import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission, type Permission } from "@/lib/rbac/roles"
import { toCsv } from "@/lib/export/csv"
import { listAuditLog } from "@/lib/integrations/fuel-card-partner"
import { toAuditParams, type AuditFilters } from "@/lib/data/audit-log"

const PERMISSIONS: Record<string, Permission[]> = {
  "audit-log": ["audit-log:view"],
}

const MAX_ROWS = 10_000

export async function GET(request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await params
  const session = await auth()
  const required = PERMISSIONS[dataset]
  if (!session?.user) return new NextResponse("Unauthorised", { status: 401 })
  if (!required || !hasPermission(session.user.roles, required)) return new NextResponse("Forbidden", { status: 403 })

  const q = Object.fromEntries(new URL(request.url).searchParams)
  const data = await listAuditLog({ ...toAuditParams(q as AuditFilters), page: 0, pageSize: MAX_ROWS })
  const rows = data.rows.map((r) => ({
    timestamp: r.createdAt, user: r.user?.name ?? "System", email: r.user?.email ?? "", role: r.role ?? "", action: r.action,
    entity_type: r.entityType, entity_id: r.entityId ?? "", old_values: r.oldValues, new_values: r.newValues,
    ip_address: r.ipAddress ?? "", device: r.device ?? "", result: r.result, failure_reason: r.failureReason ?? "",
  }))

  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "EXPORT", entityType: dataset, newValues: { rows: rows.length, filters: q }, result: "SUCCESS" })

  const filename = `galana-${dataset}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse("\uFEFF" + (toCsv(rows) || "no_data"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
  })
}
