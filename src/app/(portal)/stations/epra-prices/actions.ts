"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
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
