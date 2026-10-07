import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { listRecordAudit } from "@/lib/integrations/fuel-card-partner"
import { DetailSection } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge } from "@/components/shared/status-badge"

/** Audit history for one record, from Activity Log in Frappe. Rendered only for roles allowed to view the audit log. */
export async function EntityAudit({ entityType, entityId }: { entityType: string; entityId: string }) {
  void entityType
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "audit-log:view")) return null
  const logs = await listRecordAudit(entityId, 10).catch(() => [])
  return (
    <DetailSection title="Audit history" description="Immutable record of changes to this item">
      <MiniTable
        rows={logs}
        empty="No audit entries recorded for this item."
        columns={[
          { header: "When", cell: (l) => l.when.slice(0, 16) },
          { header: "Action", cell: (l) => <span className="font-medium">{l.action.replace(/_/g, " ").toLowerCase()}</span> },
          { header: "By", cell: (l) => l.by },
          { header: "Result", cell: (l) => <StatusBadge status={l.result === "SUCCESS" ? "COMPLETED" : "FAILED"} /> },
        ]}
      />
    </DetailSection>
  )
}
