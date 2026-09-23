import Link from "next/link"
import { Ticket } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { LitresDisplay, MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getTicketDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("tickets:monitor")
  const { id } = await params
  const t = await getTicketDetail(id)
  return (
    <DetailPage
      backHref="/fuel-tickets"
      backLabel="Fuel tickets"
      icon={Ticket}
      title={t.ticketNo}
      subtitle={`${t.customer.name} · ${t.product.name}`}
      badge={<StatusBadge status={t.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Authorised" value={<LitresDisplay litres={String(t.authorisedQuantityL)} />} />
            <DetailStat label="Remaining" value={<LitresDisplay litres={String(t.remainingQuantityL)} />} />
            <DetailStat label="Expires" value={<DateTimeDisplay value={t.expiresAt} formatStr="dd MMM yyyy" />} />
          </div>
          <DetailSection title="Fulfilment transactions">
            <MiniTable
              rows={t.transactions}
              empty="This ticket has not been redeemed yet."
              columns={[
                { header: "Reference", cell: (x) => <Link href={`/transactions/${x.id}`} className="font-semibold text-[#1226AA] hover:underline">{x.reference}</Link> },
                { header: "Station", cell: (x) => x.station.name },
                { header: "Amount", cell: (x) => (x.totalAmount ? <MoneyDisplay amount={Number(x.totalAmount)} /> : "—") },
                { header: "Status", cell: (x) => <StatusBadge status={x.status} /> },
              ]}
            />
          </DetailSection>
          <DetailSection title="Validation attempts">
            <MiniTable
              rows={t.validations}
              empty="No validation attempts recorded."
              columns={[
                { header: "When", cell: (v) => <DateTimeDisplay value={v.createdAt} /> },
                { header: "Station", cell: (v) => v.station.name },
                { header: "Mode", cell: (v) => (v.mode === "QR_CODE" ? "QR code" : "OTP") },
                { header: "Outcome", cell: (v) => <StatusBadge status={v.isValid ? "APPROVED" : "REJECTED"} /> },
                { header: "Reason", cell: (v) => v.reason ?? "—" },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="Ticket" entityId={t.id} />
        </>
      }
      aside={
        <DetailSection title="Ticket details">
          <DetailFields columns={1} items={[
            { label: "Customer", value: <Link href={`/customers/${t.customerId}`} className="text-[#1226AA] hover:underline">{t.customer.name}</Link> },
            { label: "Vehicle", value: t.vehicle?.regNo },
            { label: "Product", value: t.product.name },
            { label: "Issued", value: <DateTimeDisplay value={t.createdAt} /> },
          ]} />
        </DetailSection>
      }
    />
  )
}
