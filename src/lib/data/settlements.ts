import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { Prisma, SettlementStatus } from "@prisma/client"

const PAGE_SIZE = 10

export async function getSettlements({ status, stationId, page = 0 }: { status?: SettlementStatus; stationId?: string; page?: number }, scopeStationId?: string) {
  const where: Prisma.DealerSettlementWhereInput = { ...(status ? { status } : {}), ...(scopeStationId ? { stationId: scopeStationId } : stationId ? { stationId } : {}) }
  const scoped: Prisma.DealerSettlementWhereInput = scopeStationId ? { stationId: scopeStationId } : {}

  const [rows, totalRows, pending, byStatus] = await Promise.all([
    prisma.dealerSettlement.findMany({ where, include: { station: true, transaction: true }, orderBy: { createdAt: "desc" }, skip: page * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.dealerSettlement.count({ where }),
    prisma.dealerSettlement.aggregate({ where: { ...scoped, status: "PENDING" }, _sum: { netPayableToDealer: true }, _count: true }),
    prisma.dealerSettlement.groupBy({ by: ["status"], where: scoped, _count: { _all: true }, _sum: { netPayableToDealer: true } }),
  ])

  return {
    rows: toPlain(rows),
    totalRows,
    pageSize: PAGE_SIZE,
    outstandingLiability: Number(pending._sum.netPayableToDealer ?? 0),
    outstandingCount: pending._count,
    byStatus: byStatus.map((g) => ({ status: g.status as string, count: g._count._all, amount: Number(g._sum.netPayableToDealer ?? 0) })),
  }
}

export type SettlementListRow = Awaited<ReturnType<typeof getSettlements>>["rows"][number]
