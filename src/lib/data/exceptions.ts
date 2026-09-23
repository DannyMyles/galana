import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export async function getExceptionStats(scopeStationId?: string) {
  const scope = scopeStationId ? { transaction: { stationId: scopeStationId } } : {}
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [open, inProgress, resolvedToday] = await Promise.all([
    prisma.exceptionQueueItem.count({ where: { status: "OPEN", ...scope } }),
    prisma.exceptionQueueItem.count({ where: { status: "IN_PROGRESS", ...scope } }),
    prisma.exceptionQueueItem.findMany({
      where: { status: "RESOLVED", resolvedAt: { gte: startOfToday }, ...scope },
      select: { createdAt: true, resolvedAt: true },
    }),
  ])

  const avgResolutionMinutes = resolvedToday.length
    ? Math.round(
        resolvedToday.reduce(
          (sum, item) => sum + (item.resolvedAt!.getTime() - item.createdAt.getTime()) / 60000,
          0
        ) / resolvedToday.length
      )
    : 0

  return {
    openCount: open + inProgress,
    resolvedTodayCount: resolvedToday.length,
    avgResolutionMinutes,
  }
}

export async function getExceptionQueue(view: "open" | "resolved" = "open", scopeStationId?: string) {
  const rows = await prisma.exceptionQueueItem.findMany({
    where: {
      status: view === "open" ? { in: ["OPEN", "IN_PROGRESS"] } : "RESOLVED",
      ...(scopeStationId ? { transaction: { stationId: scopeStationId } } : {}),
    },
    include: {
      transaction: {
        include: {
          station: true,
          ticket: { include: { customer: true, vehicle: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(rows)
}

export type ExceptionQueueRow = Awaited<ReturnType<typeof getExceptionQueue>>[number]
