import { Wallet } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getTopUpDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"

export default async function TopUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("wallet:view")
  const { id } = await params
  const r = await getTopUpDetail(id)
  return (
    <DetailPage
      backHref="/funding-wallet"
      backLabel="Funding & wallet"
      icon={Wallet}
      title={`Top-up · ${r.reference}`}
      subtitle={r.wallet.customer.name}
      badge={<StatusBadge status={r.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailStat label="Amount" value={<MoneyDisplay amount={Number(r.amount)} />} />
            <DetailStat label="Requested" value={<DateTimeDisplay value={r.createdAt} />} />
          </div>
          {r.remarks && (
            <DetailSection title="Remarks">
              <p className="text-sm text-[#0B0B33]">{r.remarks}</p>
            </DetailSection>
          )}
          <EntityAudit entityType="WalletTopUpRequest" entityId={r.id} />
        </>
      }
      aside={
        <>
          <DetailSection title="Request">
            <DetailFields columns={1} items={[
              { label: "Funding account", value: r.fundingAccount },
              { label: "Requested by", value: r.maker.name },
            ]} />
          </DetailSection>
          <DetailSection title="Approval">
            <DetailFields columns={1} items={[
              { label: "Decided by", value: r.checker?.name },
              { label: "Decided", value: r.decidedAt ? <DateTimeDisplay value={r.decidedAt} /> : null },
              { label: "Comment", value: r.checkerComment },
              { label: "Receipt", value: r.prepaidReceipt ? <MoneyDisplay amount={Number(r.prepaidReceipt.grossAmount)} /> : null },
            ]} />
          </DetailSection>
        </>
      }
    />
  )
}
