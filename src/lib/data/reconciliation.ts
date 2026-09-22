import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { ReconciliationLevel } from "@prisma/client"

export async function getReconciliationRecords(level?: ReconciliationLevel) {
  const rows = await prisma.reconciliationRecord.findMany({
    where: level ? { level } : undefined,
    include: { transaction: { include: { station: true } } },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(rows)
}

export type ReconciliationRow = Awaited<ReturnType<typeof getReconciliationRecords>>[number]

export async function getReconciliationStats() {
  const [matched, exceptions, resolved] = await Promise.all([
    prisma.reconciliationRecord.count({ where: { status: "MATCHED" } }),
    prisma.reconciliationRecord.count({ where: { status: "EXCEPTION" } }),
    prisma.reconciliationRecord.count({ where: { status: "RESOLVED" } }),
  ])
  return { matched, exceptions, resolved }
}
