import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Finance dashboard summary — see US-RPT-001..005. Kept as a single query
 * bundle (Promise.all) rather than N+1 fetches from the page component.
 */
export async function getFinanceDashboardData() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const trendStart = new Date(now)
  trendStart.setDate(trendStart.getDate() - 29)

  const [wallet, monthConsumption, completedCount, pendingReconciliationCount, recentTransactions, trendRows] =
    await Promise.all([
      prisma.fuelWallet.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED", completedAt: { gte: monthStart } },
        _sum: { dispensedQtyL: true },
      }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.exceptionQueueItem.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { station: true },
      }),
      prisma.transaction.findMany({
        where: { status: "COMPLETED", completedAt: { gte: trendStart } },
        select: { completedAt: true, dispensedQtyL: true },
      }),
    ])

  const trendByDay = new Map<string, number>()
  for (const row of trendRows) {
    if (!row.completedAt) continue
    const key = row.completedAt.toISOString().slice(0, 10)
    trendByDay.set(key, (trendByDay.get(key) ?? 0) + Number(row.dispensedQtyL ?? 0))
  }

  const consumptionTrend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(trendStart)
    date.setDate(date.getDate() + index)
    const key = date.toISOString().slice(0, 10)
    return { date: key, litres: trendByDay.get(key) ?? 0 }
  })

  return {
    walletBalance: Number(wallet?.balance ?? 0),
    monthConsumptionLitres: Number(monthConsumption._sum.dispensedQtyL ?? 0),
    completedTransactionsCount: completedCount,
    pendingReconciliationCount,
    recentTransactions: toPlain(recentTransactions),
    consumptionTrend,
  }
}

export type FinanceDashboardData = Awaited<ReturnType<typeof getFinanceDashboardData>>
