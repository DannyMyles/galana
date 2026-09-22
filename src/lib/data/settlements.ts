import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { SettlementStatus } from "@prisma/client"

const PAGE_SIZE = 8

export async function getSettlements({ status, page = 0 }: { status?: SettlementStatus; page?: number }) {
  const where = status ? { status } : {}

  const [rows, totalRows, liability] = await Promise.all([
    prisma.dealerSettlement.findMany({
      where,
      include: { station: true, transaction: true },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.dealerSettlement.count({ where }),
    prisma.dealerSettlement.aggregate({
      where: { status: "PENDING" },
      _sum: { netPayableToDealer: true },
    }),
  ])

  return {
    rows: toPlain(rows),
    totalRows,
    pageSize: PAGE_SIZE,
    outstandingLiability: Number(liability._sum.netPayableToDealer ?? 0),
  }
}

export type SettlementListRow = Awaited<ReturnType<typeof getSettlements>>["rows"][number]
