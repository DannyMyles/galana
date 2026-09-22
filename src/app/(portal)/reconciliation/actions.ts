"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"

class ActionError extends Error {}

/**
 * Transaction <-> Settlement reconciliation (US-REC-003/004): every COMPLETED
 * transaction should have exactly one DealerSettlement. Records already
 * reconciled (found by transactionId) are left alone so re-running this is
 * idempotent.
 */
export async function runReconciliationCheck() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "reconciliation:manage")) {
    throw new ActionError("You do not have permission to run reconciliation.")
  }

  const alreadyChecked = await prisma.reconciliationRecord.findMany({
    where: { level: "TRANSACTION" },
    select: { transactionId: true },
  })
  const checkedIds = new Set(alreadyChecked.map((r) => r.transactionId))

  const completedTransactions = await prisma.transaction.findMany({
    where: { status: "COMPLETED", id: { notIn: Array.from(checkedIds).filter((id): id is string => !!id) } },
    include: { settlement: true },
  })

  let matched = 0
  let exceptions = 0

  for (const transaction of completedTransactions) {
    const status = transaction.settlement ? "MATCHED" : "EXCEPTION"
    const record = await prisma.reconciliationRecord.create({
      data: {
        level: "TRANSACTION",
        transactionId: transaction.id,
        status,
        details: {
          reference: transaction.reference,
          hasSettlement: !!transaction.settlement,
        },
      },
    })

    if (status === "MATCHED") {
      matched += 1
    } else {
      exceptions += 1
      await prisma.exceptionQueueItem.create({
        data: {
          reconciliationRecordId: record.id,
          transactionId: transaction.id,
          reason: "Completed transaction has no dealer settlement",
          status: "OPEN",
        },
      })
    }
  }

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "RECONCILIATION_CHECK_RUN",
    entityType: "ReconciliationRecord",
    newValues: { checked: completedTransactions.length, matched, exceptions },
    result: "SUCCESS",
  })

  revalidatePath("/reconciliation")
  revalidatePath("/failed-transactions")

  return { checked: completedTransactions.length, matched, exceptions }
}

export async function resolveReconciliationRecord(recordId: string, notes: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "reconciliation:manage")) {
    throw new ActionError("You do not have permission to resolve reconciliation exceptions.")
  }

  await prisma.reconciliationRecord.update({ where: { id: recordId }, data: { status: "RESOLVED" } })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "RECONCILIATION_EXCEPTION_RESOLVED",
    entityType: "ReconciliationRecord",
    entityId: recordId,
    newValues: { notes },
    result: "SUCCESS",
  })

  revalidatePath("/reconciliation")
}
