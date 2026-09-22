import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { TransactionStatus } from "@prisma/client"

const PAGE_SIZE = 8

export async function getTransactions({
  search,
  status,
  stationId,
  page = 0,
}: {
  search?: string
  status?: TransactionStatus
  stationId?: string
  page?: number
}) {
  const where = {
    ...(search ? { reference: { contains: search, mode: "insensitive" as const } } : {}),
    ...(status ? { status } : {}),
    ...(stationId ? { stationId } : {}),
  }

  const [rows, totalRows] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { station: true, ticket: { include: { customer: true, vehicle: true } } },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.transaction.count({ where }),
  ])

  return { rows: toPlain(rows), totalRows, pageSize: PAGE_SIZE }
}

export type TransactionListRow = Awaited<ReturnType<typeof getTransactions>>["rows"][number]
