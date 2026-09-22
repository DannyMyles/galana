"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"

class ActionError extends Error {}

async function requireDispenseSession() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:dispense")) {
    throw new ActionError("You do not have permission to dispense fuel.")
  }
  return session.user
}

export async function completeTransaction(transactionId: string, dispensedQtyL: number) {
  const user = await requireDispenseSession()

  const transaction = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { ticket: { include: { customer: { include: { wallet: true } } } } },
  })

  if (transaction.status !== "AUTHORISED") {
    throw new ActionError("This transaction is not awaiting dispensing.")
  }

  if (dispensedQtyL <= 0 || dispensedQtyL > Number(transaction.authorisedQtyL)) {
    throw new ActionError("Dispensed quantity cannot exceed the authorised quantity.")
  }

  const totalAmount = dispensedQtyL * Number(transaction.unitTariff)
  const wallet = transaction.ticket.customer.wallet
  if (!wallet) throw new ActionError("This customer has no active fuel wallet.")

  const remainingAfter = Math.max(0, Number(transaction.ticket.remainingQuantityL) - dispensedQtyL)

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        dispensedQtyL,
        totalAmount,
        completedAt: new Date(),
      },
    })

    await tx.fuelWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: totalAmount } },
    })

    await tx.ticket.update({
      where: { id: transaction.ticketId },
      data: {
        remainingQuantityL: remainingAfter,
        status: remainingAfter <= 0 ? "REDEEMED" : "PARTIALLY_REDEEMED",
      },
    })

    await tx.dealerSettlement.create({
      data: {
        transactionId,
        stationId: transaction.stationId,
        grossAmount: totalAmount,
        netPayableToDealer: totalAmount,
      },
    })
  })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "TRANSACTION_COMPLETED",
    entityType: "Transaction",
    entityId: transactionId,
    newValues: { dispensedQtyL, totalAmount },
    result: "SUCCESS",
  })

  revalidatePath(`/dispensing/${transactionId}`)
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/fuel-tickets")
  revalidatePath("/settlements")
}

export async function cancelTransaction(transactionId: string) {
  const user = await requireDispenseSession()

  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } })
  if (!["AUTHORISED", "FUELLING_IN_PROGRESS"].includes(transaction.status)) {
    throw new ActionError("This transaction can no longer be cancelled.")
  }

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: "CANCELLED" } })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "TRANSACTION_CANCELLED",
    entityType: "Transaction",
    entityId: transactionId,
    result: "SUCCESS",
  })

  revalidatePath(`/dispensing/${transactionId}`)
  revalidatePath("/transactions")
}
