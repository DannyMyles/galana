import { PageHeader } from "@/components/shared/page-header"
import { AdministrationSubNav } from "@/components/administration/administration-subnav"
import { AuditLogTable } from "@/components/administration/audit-log-table"
import { getAuditLogs } from "@/lib/data/audit-log"

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { rows, totalRows, pageSize, entityTypes } = await getAuditLogs({
    entityType: typeof params.entityType === "string" ? params.entityType : undefined,
    page: params.page ? Number(params.page) : 0,
  })

  return (
    <div>
      <PageHeader title="Audit Log" description="Read-only trail of actions taken across the portal" />
      <AdministrationSubNav />
      <AuditLogTable rows={rows} totalRows={totalRows} pageSize={pageSize} entityTypes={entityTypes} />
    </div>
  )
}
