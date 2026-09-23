import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { Prisma, TransactionStatus } from "@prisma/client"

const PAGE_SIZE = 10

export interface TransactionFilters {
  search?: string
  status?: TransactionStatus
  stationId?: string
  from?: string
  to?: string
}

export function buildTransactionWhere(filters: TransactionFilters, scopeStationId?: string): Prisma.TransactionWhereInput {
  const createdAt: Prisma.DateTimeFilter = {}
  if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00`)
  if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59.999`)
  return {
    ...(filters.search
      ? {
          OR: [
            { reference: { contains: filters.search, mode: "insensitive" } },
            { ticket: { ticketNo: { contains: filters.search, mode: "insensitive" } } },
            { ticket: { vehicle: { regNo: { contains: filters.search, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    // Station-scoped users (dealer managers) can only ever see their own station's transactions.
    ...(scopeStationId ? { stationId: scopeStationId } : filters.stationId ? { stationId: filters.stationId } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
  }
}

export async function getTransactions(filters: TransactionFilters & { page?: number }, scopeStationId?: string) {
  const where = buildTransactionWhere(filters, scopeStationId)
  const page = filters.page ?? 0

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

export async function getTransactionTrace(id: string) {
  const transaction = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: {
      station: true,
      posDevice: true,
      ticket: { include: { customer: true, vehicle: true, product: true, validations: { include: { station: true }, orderBy: { createdAt: "asc" } } } },
      events: { orderBy: { createdAt: "asc" } },
      settlement: { include: { creditNotes: true } },
      reversals: { include: { requestedBy: true, decidedBy: true }, orderBy: { createdAt: "desc" } },
      exceptions: true,
      reconciliationRecords: true,
    },
  })

  const audit = await prisma.auditLog.findMany({
    where: { OR: [{ entityType: "Transaction", entityId: id }, ...(transaction.settlement ? [{ entityType: "DealerSettlement", entityId: transaction.settlement.id }] : [])] },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  })

  const actorIds = [...new Set(transaction.events.map((e) => e.actorId).filter((v): v is string => !!v))]
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })

  return toPlain({ transaction, audit, actorNames: Object.fromEntries(actors.map((a) => [a.id, a.name])) })
}
