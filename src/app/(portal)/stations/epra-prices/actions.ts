"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { parseCsv } from "@/lib/export/csv"
import { createEpraPriceSchema, type CreateEpraPriceInput } from "@/lib/validations/epra-price"
import { addEpraPrice, listFuelProducts } from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function requireEpraManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "epra-prices:manage")) {
    throw new ActionError("You do not have permission to update EPRA prices.")
  }
  if (!session.user.email) throw new ActionError("Your session has no email address, so the change cannot be recorded.")
  return session.user
}

/** Prices are stored in Galana Settings (Frappe). Each change is recorded in Activity Log by Frappe. */
export async function createEpraPrice(input: CreateEpraPriceInput) {
  const user = await requireEpraManager()
  const parsed = createEpraPriceSchema.safeParse(input)
  if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid price details.")

  try {
    await addEpraPrice(user.email as string, parsed.data.productId, parsed.data.pricePerLitre, parsed.data.effectiveFrom)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not save the price.")
  }
  revalidatePath("/stations/epra-prices")
}

export async function bulkUploadEpraPrices(csv: string) {
  const user = await requireEpraManager()
  const rows = parseCsv(csv)
  const header = (rows[0] ?? []).map((h) => h.trim())
  if (rows.length < 2 || !["product", "price", "effectiveFrom"].every((c) => header.includes(c))) {
    return { created: 0, errors: [{ line: 1, message: "Expected columns: product, price, effectiveFrom (product is the fuel item name or code)." }] }
  }

  const products = await listFuelProducts()
  const errors: { line: number; message: string }[] = []
  let created = 0

  for (let i = 1; i < rows.length; i++) {
    const cells = Object.fromEntries(header.map((h, idx) => [h, rows[i][idx] ?? ""]))
    const line = i + 1
    const product = products.find((p) => p.code.toLowerCase() === cells.product.trim().toLowerCase() || p.name.toLowerCase() === cells.product.trim().toLowerCase())
    const price = Number(cells.price)
    if (!product) { errors.push({ line, message: `Unknown product "${cells.product}"` }); continue }
    if (!(price > 0)) { errors.push({ line, message: `Invalid price "${cells.price}"` }); continue }
    if (Number.isNaN(new Date(cells.effectiveFrom).getTime())) { errors.push({ line, message: `Invalid date "${cells.effectiveFrom}" (use YYYY-MM-DD)` }); continue }

    try {
      await addEpraPrice(user.email as string, product.id, price, cells.effectiveFrom)
      created += 1
    } catch (error) {
      errors.push({ line, message: error instanceof Error ? error.message : "Could not save the price" })
    }
  }
  revalidatePath("/stations/epra-prices")
  return { created, errors }
}
