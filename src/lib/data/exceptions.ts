import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export async function getExceptionStats() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [open, inProgress, resolvedToday] = await Promise.all([
    prisma.exceptionQueueItem.count({ where: { status: "OPEN" } }),
    prisma.exceptionQueueItem.count({ where: { status: "IN_PROGRESS" } }),
    prisma.exceptionQueueItem.findMany({
      where: { status: "RESOLVED", resolvedAt: { gte: startOfToday } },
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

export async function getExceptionQueue() {
  const rows = await prisma.exceptionQueueItem.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
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
