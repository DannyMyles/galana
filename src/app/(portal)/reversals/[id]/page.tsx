import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { EntityAudit } from "@/components/shared/entity-audit"
import { requirePermission } from "@/lib/rbac/guard"
import { listReversals, type ReversalRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"
import { Ticket } from "@/components/icons"

export const dynamic = "force-dynamic"
const STATUS: Record<ReversalRow["status"], PortalStatus> = { "Pending Approval": "PENDING_APPROVAL", Approved: "APPROVED", Rejected: "REJECTED" }

export default async function ReversalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["reversals:view"])
  const session = await auth()
  const { id } = await params
  const r = toPlain((await listReversals(session!.user!.email as string)).find((x) => x.id === id))
  if (!r) notFound()
  return (
    <DetailPage
      backHref="/reversals"
      backLabel="Reversals"
      icon={Ticket}
      title={`Reversal of ${r.transaction}`}
      subtitle={`${r.customer} · requested by ${r.requestedBy}`}
      badge={<StatusBadge status={STATUS[r.status]} />}
      main={
        <>
          <DetailSection title="Reason and decision">
            <DetailFields columns={1} items={[
              { label: "Reason", value: r.reason },
              { label: "Requested at", value: r.requestedAt.slice(0, 16) },
              { label: "Decided by", value: r.decidedBy ?? "Not decided yet" },
              { label: "Decided at", value: r.decidedAt ? r.decidedAt.slice(0, 16) : "—" },
              { label: "Checker comment", value: r.checkerComment ?? "—" },
            ]} />
          </DetailSection>
          <EntityAudit entityType="Reversal" entityId={r.id} />
        </>
      }
      aside={
        <DetailSection title="Fuelling">
          <DetailFields columns={1} items={[
            { label: "Amount", value: <MoneyDisplay amount={r.amount} /> },
            { label: "Transaction", value: <Link href={`/transactions/${r.transaction}`} className="text-[#1226AA] hover:underline">{r.transaction}</Link> },
            { label: "Credited to wallet", value: r.walletChanged ? "Yes" : "No, not approved" },
          ]} />
        </DetailSection>
      }
    />
  )
}
