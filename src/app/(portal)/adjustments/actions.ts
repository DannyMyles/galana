"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"

class ActionError extends Error {}

export async function createAdjustment(input: { direction: "CREDIT" | "DEBIT"; amount: number; reason: string }) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "adjustments:create")) throw new ActionError("You do not have permission to request adjustments.")
  if (!(input.amount > 0)) throw new ActionError("Enter an amount greater than zero.")
  if (input.reason.trim().length < 5) throw new ActionError("Give a clear reason (at least 5 characters).")

  const wallet = await prisma.fuelWallet.findFirstOrThrow()
  const adjustment = await prisma.manualAdjustment.create({ data: { walletId: wallet.id, direction: input.direction, amount: input.amount, reason: input.reason.trim(), makerId: session.user.id } })
  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "ADJUSTMENT_REQUESTED", entityType: "ManualAdjustment", entityId: adjustment.id, newValues: input, result: "SUCCESS" })
  revalidatePath("/adjustments")
}

export async function decideAdjustment(id: string, approve: boolean, comment: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "adjustments:approve")) throw new ActionError("You do not have permission to decide adjustments.")
  if (!approve && !comment.trim()) throw new ActionError("A reason is required to reject.")

  const adjustment = await prisma.manualAdjustment.findUniqueOrThrow({ where: { id }, include: { wallet: true } })
  if (adjustment.status !== "PENDING_APPROVAL") throw new ActionError("This adjustment has already been decided.")
  if (adjustment.makerId === session.user.id) throw new ActionError("You cannot approve an adjustment you requested.")
  if (approve && adjustment.direction === "DEBIT" && Number(adjustment.wallet.balance) < Number(adjustment.amount)) throw new ActionError("The wallet balance is too low for this debit.")

  await prisma.$transaction(async (tx) => {
    await tx.manualAdjustment.update({ where: { id }, data: { status: approve ? "APPROVED" : "REJECTED", checkerId: session.user.id, checkerComment: comment.trim() || null, decidedAt: new Date() } })
    if (approve) {
      await tx.fuelWallet.update({ where: { id: adjustment.walletId }, data: { balance: adjustment.direction === "CREDIT" ? { increment: adjustment.amount } : { decrement: adjustment.amount } } })
    }
  })
  await writeAuditLog({
    userId: session.user.id, role: session.user.roles[0], action: approve ? "ADJUSTMENT_APPROVED" : "ADJUSTMENT_REJECTED", entityType: "ManualAdjustment", entityId: id,
    oldValues: { balance: adjustment.wallet.balance.toString() }, newValues: { direction: adjustment.direction, amount: adjustment.amount.toString(), comment }, result: "SUCCESS",
  })
  for (const p of ["/adjustments", "/dashboard", "/funding-wallet"]) revalidatePath(p)
}
