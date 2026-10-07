import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { EntityAudit } from "@/components/shared/entity-audit"
import { requirePermission } from "@/lib/rbac/guard"
import { listAdjustments, type AdjustmentRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"
import { Ticket } from "@/components/icons"

export const dynamic = "force-dynamic"
const STATUS: Record<AdjustmentRow["status"], PortalStatus> = { "Pending Approval": "PENDING_APPROVAL", Approved: "APPROVED", Rejected: "REJECTED" }

export default async function AdjustmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["adjustments:view"])
  const session = await auth()
  const { id } = await params
  const r = toPlain((await listAdjustments(session!.user!.email as string)).find((x) => x.id === id))
  if (!r) notFound()
  return (
    <DetailPage
      backHref="/adjustments"
      backLabel="Adjustments"
      icon={Ticket}
      title={r.reason}
      subtitle={`${r.customer} · ${r.direction}`}
      badge={<StatusBadge status={STATUS[r.status]} />}
      main={
        <>
          <DetailSection title="Decision">
            <DetailFields columns={1} items={[
              { label: "Requested by", value: r.requestedBy },
              { label: "Requested at", value: r.requestedAt.slice(0, 16) },
              { label: "Decided by", value: r.decidedBy ?? "Not decided yet" },
              { label: "Decided at", value: r.decidedAt ? r.decidedAt.slice(0, 16) : "—" },
              { label: "Checker comment", value: r.checkerComment ?? "—" },
            ]} />
          </DetailSection>
          <EntityAudit entityType="Adjustment" entityId={r.id} />
        </>
      }
      aside={
        <DetailSection title="Adjustment">
          <DetailFields columns={1} items={[
            { label: "Amount", value: <MoneyDisplay amount={r.amount} /> },
            { label: "Direction", value: r.direction },
            { label: "Changes wallet", value: r.walletChanged ? "Yes" : "No, not approved" },
          ]} />
        </DetailSection>
      }
    />
  )
}
