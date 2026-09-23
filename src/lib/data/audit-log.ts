import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"
import type { Prisma } from "@prisma/client"

const PAGE_SIZE = 15

/** Entity types that hold financial records — the "changes to financial records" view (US-AUD-003). */
export const FINANCIAL_ENTITIES = [
  "WalletTopUpRequest",
  "FuelWallet",
  "DealerSettlement",
  "CreditNote",
  "ManualAdjustment",
  "TransactionReversal",
  "EpraPrice",
  "SystemSetting",
]

export interface AuditFilters {
  entityType?: string
  user?: string
  result?: "SUCCESS" | "FAILURE"
  from?: string
  to?: string
  preset?: "financial" | "adjustments" | "exceptions"
}

export function buildAuditWhere(f: AuditFilters): Prisma.AuditLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {}
  if (f.from) createdAt.gte = new Date(`${f.from}T00:00:00`)
  if (f.to) createdAt.lte = new Date(`${f.to}T23:59:59.999`)
  return {
    ...(f.preset === "financial" ? { entityType: { in: FINANCIAL_ENTITIES } } : {}),
    ...(f.preset === "adjustments" ? { entityType: "ManualAdjustment" } : {}),
    ...(f.preset === "exceptions" ? { OR: [{ result: "FAILURE" }, { action: { startsWith: "EXCEPTION_" } }, { action: { contains: "REVERS" } }] } : {}),
    ...(f.entityType ? { entityType: f.entityType } : {}),
    ...(f.result ? { result: f.result } : {}),
    ...(f.user ? { user: { OR: [{ name: { contains: f.user, mode: "insensitive" } }, { email: { contains: f.user, mode: "insensitive" } }] } } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
  }
}

export async function getAuditLogs(filters: AuditFilters & { page?: number }) {
  const where = buildAuditWhere(filters)
  const page = filters.page ?? 0

  const [rows, totalRows, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: true }, orderBy: { createdAt: "desc" }, skip: page * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
  ])

  return { rows: toPlain(rows), totalRows, pageSize: PAGE_SIZE, entityTypes: entityTypes.map((e) => e.entityType).sort() }
}

export type AuditLogRow = Awaited<ReturnType<typeof getAuditLogs>>["rows"][number]
