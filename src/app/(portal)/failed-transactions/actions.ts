"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { canTransition, transitionTransaction } from "@/lib/transactions/state-machine"

class ActionError extends Error {}

async function requireExceptionSession() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "exceptions:resolve")) {
    throw new ActionError("You do not have permission to resolve exceptions.")
  }
  return session.user
}

type ResolutionMethod = "RETRY" | "NOTIFY" | "OVERRIDE" | "RESOLVE"

export async function resolveException(exceptionId: string, method: ResolutionMethod, notes?: string) {
  const user = await requireExceptionSession()

  const exception = await prisma.exceptionQueueItem.findUniqueOrThrow({
    where: { id: exceptionId },
    include: {
      transaction: { include: { ticket: { include: { customer: { include: { wallet: true } } } } } },
    },
  })

  if (exception.status === "RESOLVED") {
    throw new ActionError("This exception has already been resolved.")
  }

  const transaction = exception.transaction

  if (method === "RETRY" && transaction) {
    const wallet = transaction.ticket.customer.wallet
    const requiredAmount = Number(transaction.authorisedQtyL) * Number(transaction.unitTariff)

    if (wallet && Number(wallet.balance) >= requiredAmount) {
      await prisma.$transaction(async (tx) => {
        if (canTransition(transaction.status, "AUTHORISED")) await transitionTransaction(tx, transaction.id, "AUTHORISED", { actorId: user.id, note: "Retried authorisation — balance now sufficient", data: { failureReason: null } })
        await tx.exceptionQueueItem.update({ where: { id: exceptionId }, data: { status: "RESOLVED", resolvedAt: new Date(), resolutionNotes: "Retried — balance now sufficient." } })
      })
    } else {
      await prisma.exceptionQueueItem.update({
        where: { id: exceptionId },
        data: { status: "IN_PROGRESS", resolutionNotes: "Retried — balance still insufficient." },
      })
    }
  } else if (method === "OVERRIDE" && transaction) {
    await prisma.$transaction(async (tx) => {
      if (canTransition(transaction.status, "AUTHORISED")) await transitionTransaction(tx, transaction.id, "AUTHORISED", { actorId: user.id, note: "Overridden with admin approval", data: { failureReason: null } })
      await tx.exceptionQueueItem.update({ where: { id: exceptionId }, data: { status: "RESOLVED", resolvedAt: new Date(), resolutionNotes: notes || "Overridden with admin approval." } })
    })
  } else if (method === "NOTIFY") {
    await prisma.exceptionQueueItem.update({
      where: { id: exceptionId },
      data: { status: "IN_PROGRESS", resolutionNotes: "Customer maker notified." },
    })
  } else {
    await prisma.exceptionQueueItem.update({
      where: { id: exceptionId },
      data: { status: "RESOLVED", resolvedAt: new Date(), resolutionNotes: notes || "Marked resolved." },
    })
  }

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: `EXCEPTION_${method}`,
    entityType: "ExceptionQueueItem",
    entityId: exceptionId,
    newValues: { notes },
    result: "SUCCESS",
  })

  revalidatePath("/failed-transactions")
  revalidatePath("/transactions")
}
