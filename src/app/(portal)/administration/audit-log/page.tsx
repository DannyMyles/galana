import { PageHeader } from "@/components/shared/page-header"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { AuditLogTable } from "@/components/administration/audit-log-table"
import { getAuditLogs, type AuditFilters } from "@/lib/data/audit-log"
import { requirePermission } from "@/lib/rbac/guard"

const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined)

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("audit-log:view")
  const p = await searchParams
  const preset = one(p.preset)
  const { rows, totalRows, pageSize, entityTypes } = await getAuditLogs({
    entityType: one(p.entityType),
    user: one(p.user),
    result: one(p.result) as AuditFilters["result"],
    from: one(p.from),
    to: one(p.to),
    preset: preset === "financial" || preset === "adjustments" || preset === "exceptions" ? preset : undefined,
    page: Number(one(p.page) ?? 0),
  })

  return (
    <div>
      <PageHeader title="Audit Log" description="Read-only, immutable record of every action: who, what, when, from where, and the before/after values." />
      <AdministrationSubNav />
      <AuditLogTable rows={rows} totalRows={totalRows} pageSize={pageSize} entityTypes={entityTypes} />
    </div>
  )
}
