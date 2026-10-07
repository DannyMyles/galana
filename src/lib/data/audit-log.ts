import { listAuditLog, type AuditLogEntry, type AuditLogParams } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

/** Audit entries are read from Activity Log in Frappe (see docs/prisma-to-frappe-map.md). */
export interface AuditFilters {
  entityType?: string
  user?: string
  result?: "SUCCESS" | "FAILURE"
  from?: string
  to?: string
  preset?: "financial" | "adjustments" | "exceptions"
}

export function toAuditParams(f: AuditFilters & { page?: number; pageSize?: number }): AuditLogParams {
  return {
    entityType: f.entityType,
    searchUser: f.user,
    result: f.result,
    fromDate: f.from,
    toDate: f.to,
    preset: f.preset,
    page: f.page ?? 0,
    pageSize: f.pageSize,
  }
}

export async function getAuditLogs(filters: AuditFilters & { page?: number }) {
  const result = await listAuditLog(toAuditParams(filters))
  return toPlain({
    rows: result.rows.map((r: AuditLogEntry) => ({ ...r, createdAt: new Date(r.createdAt) })),
    totalRows: result.totalRows,
    pageSize: result.pageSize,
    entityTypes: result.entityTypes,
  })
}

export type AuditLogRow = Awaited<ReturnType<typeof getAuditLogs>>["rows"][number]
