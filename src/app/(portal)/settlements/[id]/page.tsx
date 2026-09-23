import Link from "next/link"
import { notFound } from "next/navigation"
import { Landmark } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getSettlementDetail } from "@/lib/data/details"
import { getStationForUser } from "@/lib/data/pos"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"

export default async function SettlementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(["settlements:manage", "settlements:view", "reports:dealer"])
  const { id } = await params
  const s = await getSettlementDetail(id)
  if (!hasPermission(user.roles, ["settlements:manage", "settlements:view"])) {
    const own = await getStationForUser(user.id)
    if (own?.id !== s.stationId) notFound()
  }
  const t = s.transaction
  return (
    <DetailPage
      backHref="/settlements"
      backLabel="Settlements"
      icon={Landmark}
      title={`Settlement · ${t.reference}`}
      subtitle={`${s.station.name}${s.station.dealer ? ` · ${s.station.dealer.name}` : ""}`}
      badge={<StatusBadge status={s.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Gross" value={<MoneyDisplay amount={Number(s.grossAmount)} />} />
            <DetailStat label="Discounts" value={<MoneyDisplay amount={Number(s.underCanopyDiscount) + Number(s.jaguarContractualDiscount)} />} />
            <DetailStat label="Net payable" value={<MoneyDisplay amount={Number(s.netPayableToDealer)} />} />
          </div>
          <DetailSection title="Linked credit notes">
            <MiniTable
              rows={s.creditNotes}
              empty="No credit notes are linked to this settlement."
              columns={[
                { header: "Note", cell: (c) => <Link href={`/credit-notes/${c.id}`} className="font-semibold text-[#1226AA] hover:underline">{c.reference ?? c.id.slice(-6).toUpperCase()}</Link> },
                { header: "Type", cell: (c) => c.type.replace(/_/g, " ").toLowerCase() },
                { header: "Amount", cell: (c) => <MoneyDisplay amount={Number(c.amount)} /> },
                { header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="DealerSettlement" entityId={s.id} />
        </>
      }
      aside={
        <DetailSection title="Source transaction">
          <DetailFields columns={1} items={[
            { label: "Transaction", value: <Link href={`/transactions/${t.id}`} className="text-[#1226AA] hover:underline">{t.reference}</Link> },
            { label: "Customer", value: t.ticket.customer.name },
            { label: "Vehicle", value: t.ticket.vehicle?.regNo },
            { label: "Product", value: t.ticket.product.name },
            { label: "Created", value: <DateTimeDisplay value={s.createdAt} /> },
          ]} />
        </DetailSection>
      }
    />
  )
}
