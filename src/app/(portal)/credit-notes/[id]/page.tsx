import Link from "next/link"
import { ReceiptText } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getCreditNoteDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"

export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["credit-notes:manage", "credit-notes:approve", "credit-notes:view"])
  const { id } = await params
  const c = await getCreditNoteDetail(id)
  return (
    <DetailPage
      backHref="/credit-notes"
      backLabel="Credit notes"
      icon={ReceiptText}
      title={c.reference ?? `Credit note ${c.id.slice(-6).toUpperCase()}`}
      subtitle={`${c.customer.name} · ${c.type.replace(/_/g, " ").toLowerCase()}`}
      badge={<StatusBadge status={c.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailStat label="Amount" value={<MoneyDisplay amount={Number(c.amount)} />} />
            <DetailStat label="Raised" value={<DateTimeDisplay value={c.createdAt} />} />
          </div>
          <DetailSection title="Reason">
            <p className="text-sm text-[#0B0B33]">{c.reason ?? "No reason recorded."}</p>
          </DetailSection>
          <EntityAudit entityType="CreditNote" entityId={c.id} />
        </>
      }
      aside={
        <>
          <DetailSection title="Approval">
            <DetailFields columns={1} items={[
              { label: "Prepared by", value: c.maker?.name ?? "System (auto-generated)" },
              { label: "Decided by", value: c.checker?.name },
              { label: "Decided", value: c.decidedAt ? <DateTimeDisplay value={c.decidedAt} /> : null },
              { label: "Checker comment", value: c.checkerComment },
            ]} />
          </DetailSection>
          {c.settlement && (
            <DetailSection title="Linked settlement">
              <DetailFields columns={1} items={[
                { label: "Settlement", value: <Link href={`/settlements/${c.settlement.id}`} className="text-[#1226AA] hover:underline">{c.settlement.transaction.reference}</Link> },
                { label: "Station", value: c.settlement.station.name },
              ]} />
            </DetailSection>
          )}
        </>
      }
    />
  )
}
