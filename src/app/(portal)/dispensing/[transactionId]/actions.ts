"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { getSettings } from "@/lib/settings"
import { transitionTransaction } from "@/lib/transactions/state-machine"

class ActionError extends Error {}

const money = (n: number) => Math.round(n * 100) / 100

async function requireDispenseSession() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:dispense")) {
    throw new ActionError("You do not have permission to dispense fuel.")
  }
  return session.user
}

export async function startFuelling(transactionId: string) {
  const user = await requireDispenseSession()
  await transitionTransaction(prisma, transactionId, "FUELLING_IN_PROGRESS", { actorId: user.id, note: "Pump released" })
  await writeAuditLog({ userId: user.id, role: user.roles[0], action: "FUELLING_STARTED", entityType: "Transaction", entityId: transactionId, result: "SUCCESS" })
  revalidatePath(`/dispensing/${transactionId}`)
}

export async function completeTransaction(transactionId: string, dispensedQtyL: number) {
  const user = await requireDispenseSession()

  const transaction = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { ticket: { include: { customer: { include: { wallet: true } } } } },
  })
  if (transaction.status !== "FUELLING_IN_PROGRESS") throw new ActionError("Start fuelling before completing this transaction.")
  if (dispensedQtyL <= 0 || dispensedQtyL > Number(transaction.authorisedQtyL)) {
    throw new ActionError("Dispensed quantity cannot exceed the authorised quantity.")
  }
  const wallet = transaction.ticket.customer.wallet
  if (!wallet) throw new ActionError("This customer has no active fuel wallet.")

  const settings = await getSettings()
  const totalAmount = money(dispensedQtyL * Number(transaction.unitTariff))
  // US-FIN-002/003: station under-canopy discount reduces what the dealer is paid; the Jaguar contractual
  // discount is settled separately through a credit note and never touches the wallet load or dealer payable.
  const underCanopy = money((totalAmount * settings.underCanopyDiscountPct) / 100)
  const contractual = money((totalAmount * settings.jaguarDiscountPct) / 100)
  const remainingAfter = Math.max(0, Number(transaction.ticket.remainingQuantityL) - dispensedQtyL)

  await prisma.$transaction(async (tx) => {
    await transitionTransaction(tx, transactionId, "COMPLETED", {
      actorId: user.id,
      note: `Dispensed ${dispensedQtyL} L`,
      data: { dispensedQtyL, totalAmount, completedAt: new Date() },
    })
    await tx.fuelWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: totalAmount } } })
    await tx.ticket.update({
      where: { id: transaction.ticketId },
      data: { remainingQuantityL: remainingAfter, status: remainingAfter <= 0 ? "REDEEMED" : "PARTIALLY_REDEEMED" },
    })
    const settlement = await tx.dealerSettlement.create({
      data: {
        transactionId,
        stationId: transaction.stationId,
        grossAmount: totalAmount,
        underCanopyDiscount: underCanopy,
        jaguarContractualDiscount: contractual,
        netPayableToDealer: money(totalAmount - underCanopy),
      },
    })
    const notes = [
      { type: "UNDER_CANOPY" as const, amount: underCanopy, reason: `Under-canopy discount (${settings.underCanopyDiscountPct}%) on ${transaction.reference}` },
      { type: "CONTRACTUAL" as const, amount: contractual, reason: `Jaguar contractual discount (${settings.jaguarDiscountPct}%) on ${transaction.reference}` },
    ].filter((n) => n.amount > 0)
    for (const note of notes) {
      await tx.creditNote.create({
        data: { customerId: transaction.ticket.customerId, settlementId: settlement.id, amount: note.amount, type: note.type, reason: note.reason, reference: transaction.reference },
      })
    }
  })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "TRANSACTION_COMPLETED",
    entityType: "Transaction",
    entityId: transactionId,
    newValues: { dispensedQtyL, totalAmount, underCanopy, contractual },
    result: "SUCCESS",
  })
  for (const path of [`/dispensing/${transactionId}`, "/transactions", "/dashboard", "/fuel-tickets", "/settlements", "/credit-notes"]) revalidatePath(path)
}

export async function cancelTransaction(transactionId: string) {
  const user = await requireDispenseSession()
  await transitionTransaction(prisma, transactionId, "CANCELLED", { actorId: user.id, note: "Cancelled before completion — hold released" })
  await writeAuditLog({ userId: user.id, role: user.roles[0], action: "TRANSACTION_CANCELLED", entityType: "Transaction", entityId: transactionId, result: "SUCCESS" })
  revalidatePath(`/dispensing/${transactionId}`)
  revalidatePath("/transactions")
}
