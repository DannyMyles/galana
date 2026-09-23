import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { ReconciliationLevel } from "@prisma/client"

export async function getReconciliationRecords(level?: ReconciliationLevel) {
  const rows = await prisma.reconciliationRecord.findMany({
    where: level ? { level } : undefined,
    include: { transaction: { include: { station: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })
  return toPlain(rows)
}

export type ReconciliationRow = Awaited<ReturnType<typeof getReconciliationRecords>>[number]

export async function getReconciliationStats() {
  const groups = await prisma.reconciliationRecord.groupBy({ by: ["level", "status"], _count: { _all: true } })
  const count = (level: string | null, status: string) => groups.filter((g) => (!level || g.level === level) && g.status === status).reduce((s, g) => s + g._count._all, 0)
  return {
    matched: count(null, "MATCHED"),
    exceptions: count(null, "EXCEPTION"),
    resolved: count(null, "RESOLVED"),
    byLevel: Object.fromEntries(["TICKET", "TRANSACTION", "FINANCIAL"].map((l) => [l, { open: count(l, "EXCEPTION"), total: groups.filter((g) => g.level === l).reduce((s, g) => s + g._count._all, 0) }])),
  }
}
