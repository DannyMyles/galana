import { prisma } from "@/lib/db/client"

const PAGE_SIZE = 15

export async function getAuditLogs({
  entityType,
  page = 0,
}: {
  entityType?: string
  page?: number
}) {
  const where = entityType ? { entityType } : {}

  const [rows, totalRows, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
  ])

  return {
    rows,
    totalRows,
    pageSize: PAGE_SIZE,
    entityTypes: entityTypes.map((e) => e.entityType),
  }
}

export type AuditLogRow = Awaited<ReturnType<typeof getAuditLogs>>["rows"][number]
