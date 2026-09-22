"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"

class ActionError extends Error {}

export async function markSettlementSettled(settlementId: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "settlements:manage")) {
    throw new ActionError("You do not have permission to manage settlements.")
  }

  const settlement = await prisma.dealerSettlement.findUniqueOrThrow({ where: { id: settlementId } })
  if (settlement.status !== "PENDING") {
    throw new ActionError("This settlement has already been processed.")
  }

  await prisma.dealerSettlement.update({ where: { id: settlementId }, data: { status: "SETTLED" } })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "SETTLEMENT_SETTLED",
    entityType: "DealerSettlement",
    entityId: settlementId,
    result: "SUCCESS",
  })

  revalidatePath("/settlements")
}
