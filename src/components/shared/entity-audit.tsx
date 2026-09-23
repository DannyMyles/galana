import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { hasPermission } from "@/lib/rbac/roles"
import { DetailSection } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { StatusBadge } from "@/components/shared/status-badge"

/** Audit history for one record; only rendered for roles allowed to view the audit log. */
export async function EntityAudit({ entityType, entityId }: { entityType: string; entityId: string }) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "audit-log:view")) return null
  const logs = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
  return (
    <DetailSection title="Audit history" description="Immutable record of changes to this item">
      <MiniTable
        rows={logs}
        empty="No audit entries recorded for this item."
        columns={[
          { header: "When", cell: (l) => <DateTimeDisplay value={l.createdAt} /> },
          { header: "Action", cell: (l) => <span className="font-medium">{l.action.replace(/_/g, " ").toLowerCase()}</span> },
          { header: "By", cell: (l) => l.user?.name ?? "System" },
          { header: "Result", cell: (l) => <StatusBadge status={l.result === "SUCCESS" ? "COMPLETED" : "FAILED"} /> },
        ]}
      />
    </DetailSection>
  )
}
