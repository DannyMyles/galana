"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { parseCsv } from "@/lib/export/csv"
import { createEpraPriceSchema, type CreateEpraPriceInput } from "@/lib/validations/epra-price"

class ActionError extends Error {}

export async function createEpraPrice(input: CreateEpraPriceInput) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "epra-prices:manage")) {
    throw new ActionError("You do not have permission to update EPRA prices.")
  }

  const parsed = createEpraPriceSchema.safeParse(input)
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid price details.")
  }

  const effectiveFrom = new Date(parsed.data.effectiveFrom)

  const price = await prisma.$transaction(async (tx) => {
    // Close out any currently open price for this product so history stays
    // non-overlapping (US-OPS-005: price history and effective dates).
    await tx.epraPrice.updateMany({
      where: { productId: parsed.data.productId, effectiveTo: null },
      data: { effectiveTo: effectiveFrom },
    })

    return tx.epraPrice.create({
      data: {
        productId: parsed.data.productId,
        pricePerLitre: parsed.data.pricePerLitre,
        effectiveFrom,
      },
    })
  })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "EPRA_PRICE_UPDATED",
    entityType: "EpraPrice",
    entityId: price.id,
    newValues: parsed.data,
    result: "SUCCESS",
  })

  revalidatePath("/stations/epra-prices")
}

export async function bulkUploadEpraPrices(csv: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "epra-prices:manage")) {
    throw new ActionError("You do not have permission to update EPRA prices.")
  }
  const rows = parseCsv(csv)
  const header = (rows[0] ?? []).map((h) => h.trim())
  if (rows.length < 2 || !["product", "price", "effectiveFrom"].every((c) => header.includes(c))) {
    return { created: 0, errors: [{ line: 1, message: "Expected columns: product, price, effectiveFrom (product is PMS, AGO, LUBRICANTS…)." }] }
  }

  const products = await prisma.fuelProduct.findMany()
  const errors: { line: number; message: string }[] = []
  let created = 0

  for (let i = 1; i < rows.length; i++) {
    const cells = Object.fromEntries(header.map((h, idx) => [h, rows[i][idx] ?? ""]))
    const line = i + 1
    const product = products.find((p) => p.code === cells.product.toUpperCase())
    const price = Number(cells.price)
    const from = new Date(cells.effectiveFrom)
    if (!product) { errors.push({ line, message: `Unknown product "${cells.product}"` }); continue }
    if (!(price > 0)) { errors.push({ line, message: `Invalid price "${cells.price}"` }); continue }
    if (Number.isNaN(from.getTime())) { errors.push({ line, message: `Invalid date "${cells.effectiveFrom}" (use YYYY-MM-DD)` }); continue }

    await prisma.$transaction(async (tx) => {
      await tx.epraPrice.updateMany({ where: { productId: product.id, effectiveTo: null }, data: { effectiveTo: from } })
      const created_ = await tx.epraPrice.create({ data: { productId: product.id, pricePerLitre: price, effectiveFrom: from } })
      await tx.auditLog.create({ data: { userId: session.user.id, role: session.user.roles[0], action: "EPRA_PRICE_UPDATED", entityType: "EpraPrice", entityId: created_.id, newValues: { source: "bulk-upload", product: product.code, price, effectiveFrom: cells.effectiveFrom }, result: "SUCCESS" } })
    })
    created += 1
  }
  revalidatePath("/stations/epra-prices")
  return { created, errors }
}
