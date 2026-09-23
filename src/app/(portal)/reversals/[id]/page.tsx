import Link from "next/link"
import { Undo2 } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getReversalDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"

export default async function ReversalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["reversals:request", "reversals:approve", "reversals:view"])
  const { id } = await params
  const r = await getReversalDetail(id)
  const t = r.transaction
  return (
    <DetailPage
      backHref="/reversals"
      backLabel="Reversals"
      icon={Undo2}
      title={`Reversal · ${t.reference}`}
      subtitle={`${t.station.name} · ${t.ticket.customer.name}`}
      badge={<StatusBadge status={r.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailStat label="Transaction amount" value={t.totalAmount ? <MoneyDisplay amount={Number(t.totalAmount)} /> : "—"} />
            <DetailStat label="Requested" value={<DateTimeDisplay value={r.createdAt} />} />
          </div>
          <DetailSection title="Reason for reversal">
            <p className="text-sm text-[#0B0B33]">{r.reason}</p>
          </DetailSection>
          <EntityAudit entityType="TransactionReversal" entityId={r.id} />
        </>
      }
      aside={
        <>
          <DetailSection title="Approval">
            <DetailFields columns={1} items={[
              { label: "Requested by", value: r.requestedBy.name },
              { label: "Decided by", value: r.decidedBy?.name },
              { label: "Decided", value: r.decidedAt ? <DateTimeDisplay value={r.decidedAt} /> : null },
              { label: "Comment", value: r.decisionComment },
            ]} />
          </DetailSection>
          <DetailSection title="Transaction">
            <DetailFields columns={1} items={[
              { label: "Reference", value: <Link href={`/transactions/${t.id}`} className="text-[#1226AA] hover:underline">{t.reference}</Link> },
              { label: "Status", value: <StatusBadge status={t.status} /> },
            ]} />
          </DetailSection>
        </>
      }
    />
  )
}
