import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { requirePermission } from "@/lib/rbac/guard"
import { listTopUps } from "@/lib/integrations/fuel-card-partner"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { Ticket } from "@/components/icons"
import { toPlain } from "@/lib/serialize"

const STATUS: Record<string, PortalStatus> = { "Pending Approval": "PENDING_APPROVAL", Approved: "APPROVED", Rejected: "REJECTED" }

export default async function TopUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["wallet:view"])
  const session = await auth()
  const { id } = await params
  const all = toPlain(await listTopUps(session!.user!.email as string))
  const r = all.find((x) => x.id === id)
  if (!r) notFound()
  return (
    <DetailPage
      backHref="/funding-wallet"
      backLabel="Funding wallet"
      icon={Ticket}
      title={r.reference}
      subtitle={`${r.customer} · requested by ${r.requestedBy}`}
      badge={<StatusBadge status={STATUS[r.status]} />}
      main={
        <DetailSection title="Decision">
          <DetailFields columns={1} items={[
            { label: "Decided by", value: r.decidedBy ?? "Not decided yet" },
            { label: "Decided at", value: r.decidedAt ? r.decidedAt.slice(0, 16) : "—" },
            { label: "Checker comment", value: r.checkerComment ?? "—" },
            { label: "Credited to wallet", value: r.walletCredited ? "Yes" : "No" },
          ]} />
        </DetailSection>
      }
      aside={
        <DetailSection title="Request">
          <DetailFields columns={1} items={[
            { label: "Amount", value: <MoneyDisplay amount={r.amount} /> },
            { label: "Funding account", value: r.fundingAccount },
            { label: "Remarks", value: r.remarks ?? "—" },
          ]} />
        </DetailSection>
      }
    />
  )
}
