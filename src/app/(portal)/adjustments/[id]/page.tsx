import { SlidersHorizontal } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getAdjustmentDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"

export default async function AdjustmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["adjustments:create", "adjustments:approve", "adjustments:view"])
  const { id } = await params
  const a = await getAdjustmentDetail(id)
  return (
    <DetailPage
      backHref="/adjustments"
      backLabel="Adjustments"
      icon={SlidersHorizontal}
      title={`${a.direction === "CREDIT" ? "Credit" : "Debit"} adjustment`}
      subtitle={a.wallet.customer.name}
      badge={<StatusBadge status={a.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailStat label={a.direction === "CREDIT" ? "Credited to wallet" : "Debited from wallet"} value={<MoneyDisplay amount={Number(a.amount)} />} />
            <DetailStat label="Requested" value={<DateTimeDisplay value={a.createdAt} />} />
          </div>
          <DetailSection title="Reason">
            <p className="text-sm text-[#0B0B33]">{a.reason}</p>
          </DetailSection>
          <EntityAudit entityType="ManualAdjustment" entityId={a.id} />
        </>
      }
      aside={
        <DetailSection title="Approval">
          <DetailFields columns={1} items={[
            { label: "Requested by", value: a.maker.name },
            { label: "Decided by", value: a.checker?.name },
            { label: "Decided", value: a.decidedAt ? <DateTimeDisplay value={a.decidedAt} /> : null },
            { label: "Checker comment", value: a.checkerComment },
          ]} />
        </DetailSection>
      }
    />
  )
}
