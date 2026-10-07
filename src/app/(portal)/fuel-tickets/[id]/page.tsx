import { Ticket } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
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
      subtitle={`${t.customer.name}${t.vehicle ? ` · ${t.vehicle.regNo}` : ""}`}
      badge={<StatusBadge status={t.status} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Authorised" value={<MoneyDisplay amount={t.authorisedAmount} />} />
            <DetailStat label="Remaining" value={<MoneyDisplay amount={t.remainingAmount} />} />
            <DetailStat label="Expires" value={t.expiresAt ? <DateTimeDisplay value={t.expiresAt} formatStr="dd MMM yyyy" /> : "—"} />
          </div>
          <DetailSection title="Fulfilment transactions">
            <MiniTable
              rows={t.transactions}
              empty="This ticket has not been redeemed yet."
              columns={[
                { header: "Reference", cell: (x) => <span className="font-semibold">{x.reference}</span> },
                { header: "Station", cell: (x) => x.station ?? "—" },
                { header: "Amount", cell: (x) => (x.amount ? <MoneyDisplay amount={x.amount} /> : "—") },
                { header: "Status", cell: (x) => <StatusBadge status={x.status} /> },
                { header: "Completed", cell: (x) => (x.completedOn ? x.completedOn.slice(0, 16) : "—") },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="Ticket" entityId={t.id} />
        </>
      }
      aside={
        <DetailSection title="Ticket details">
          <DetailFields columns={1} items={[
            { label: "Customer", value: t.customer.name },
            { label: "Vehicle", value: t.vehicle?.regNo ?? "—" },
            { label: "Authorisation code", value: t.authorizationCode ?? "—" },
            { label: "Dispensed", value: t.dispensedLitres ? <LitresDisplay litres={t.dispensedLitres} /> : "—" },
            { label: "Unit price", value: t.unitPrice ? <MoneyDisplay amount={t.unitPrice} /> : "—" },
          ]} />
        </DetailSection>
      }
    />
  )
}
