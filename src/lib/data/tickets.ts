import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { TicketStatus } from "@prisma/client"

const PAGE_SIZE = 8

export async function getTickets({
  search,
  status,
  page = 0,
}: {
  search?: string
  status?: TicketStatus
  page?: number
}) {
  const where = {
    ...(search
      ? {
          OR: [
            { ticketNo: { contains: search, mode: "insensitive" as const } },
            { vehicle: { regNo: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  }

  const [rows, totalRows] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { customer: true, vehicle: true, product: true, transactions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, reference: true, status: true, failureReason: true } } },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ])

  return { rows: toPlain(rows), totalRows, pageSize: PAGE_SIZE }
}

export type TicketListRow = Awaited<ReturnType<typeof getTickets>>["rows"][number]
