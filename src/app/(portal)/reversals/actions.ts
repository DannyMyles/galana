"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { transitionTransaction } from "@/lib/transactions/state-machine"

class ActionError extends Error {}

const refresh = (transactionId?: string) => {
  for (const path of ["/reversals", "/transactions", "/settlements", "/credit-notes", "/dashboard", "/fuel-tickets", ...(transactionId ? [`/transactions/${transactionId}`] : [])]) revalidatePath(path)
}

export async function requestReversal(transactionId: string, reason: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "reversals:request")) throw new ActionError("You do not have permission to request reversals.")
  if (!reason.trim()) throw new ActionError("A reason is required.")

  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId }, include: { reversals: true } })
  if (transaction.status !== "COMPLETED") throw new ActionError("Only completed transactions can be reversed.")
  if (transaction.reversals.some((r) => r.status === "PENDING_APPROVAL")) throw new ActionError("A reversal is already awaiting approval for this transaction.")

  const reversal = await prisma.transactionReversal.create({ data: { transactionId, reason: reason.trim(), requestedById: session.user.id } })
  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "REVERSAL_REQUESTED", entityType: "TransactionReversal", entityId: reversal.id, newValues: { transactionId, reason }, result: "SUCCESS" })
  refresh(transactionId)
}

export async function decideReversal(reversalId: string, approve: boolean, comment: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "reversals:approve")) throw new ActionError("You do not have permission to decide reversals.")
  if (!approve && !comment.trim()) throw new ActionError("A reason is required to reject a reversal.")

  const reversal = await prisma.transactionReversal.findUniqueOrThrow({
    where: { id: reversalId },
    include: { transaction: { include: { ticket: { include: { customer: { include: { wallet: true } } } }, settlement: { include: { creditNotes: true } } } } },
  })
  if (reversal.status !== "PENDING_APPROVAL") throw new ActionError("This reversal has already been decided.")
  if (reversal.requestedById === session.user.id) throw new ActionError("You cannot approve a reversal you requested.")

  if (!approve) {
    await prisma.transactionReversal.update({ where: { id: reversalId }, data: { status: "REJECTED", decidedById: session.user.id, decisionComment: comment.trim(), decidedAt: new Date() } })
  } else {
    const t = reversal.transaction
    const wallet = t.ticket.customer.wallet
    if (!wallet || !t.totalAmount || !t.dispensedQtyL) throw new ActionError("This transaction has no posted consumption to reverse.")
    const restored = Number(t.ticket.remainingQuantityL) + Number(t.dispensedQtyL)
    const fullyRestored = restored >= Number(t.ticket.authorisedQuantityL)

    await prisma.$transaction(async (tx) => {
      await tx.transactionReversal.update({ where: { id: reversalId }, data: { status: "APPROVED", decidedById: session.user.id, decisionComment: comment.trim() || null, decidedAt: new Date() } })
      await transitionTransaction(tx, t.id, "REVERSED", { actorId: session.user.id, note: `Reversal approved: ${reversal.reason}` })
      // US-TXN-011: the financial and fuel balances are both restored.
      await tx.fuelWallet.update({ where: { id: wallet.id }, data: { balance: { increment: t.totalAmount! } } })
      await tx.ticket.update({ where: { id: t.ticketId }, data: { remainingQuantityL: restored, status: fullyRestored ? "ISSUED" : "PARTIALLY_REDEEMED" } })
      if (t.settlement) {
        await tx.dealerSettlement.update({ where: { id: t.settlement.id }, data: { status: "REVERSED" } })
        // Discount credit notes raised for the original sale no longer apply.
        await tx.creditNote.updateMany({ where: { settlementId: t.settlement.id, status: "PENDING" }, data: { status: "REJECTED", checkerComment: "Voided: underlying transaction reversed", decidedAt: new Date() } })
      }
    })
  }

  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: approve ? "REVERSAL_APPROVED" : "REVERSAL_REJECTED", entityType: "TransactionReversal", entityId: reversalId, newValues: { comment }, result: "SUCCESS" })
  refresh(reversal.transactionId)
}
