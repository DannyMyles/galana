import { auth } from "@/auth"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { customerFor } from "@/lib/data/portal-reports"
import { requirePermission } from "@/lib/rbac/guard"
import { Users } from "@/components/icons"
import { EntityAudit } from "@/components/shared/entity-audit"
import { getFuelCardSummaryForCustomer } from "@/lib/data/jaguar-fuel-card"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["reports:jaguar", "reports:finance"])
  const session = await auth()
  const { id } = await params
  const name = decodeURIComponent(id)
  const c = await customerFor(session!.user!.email as string, name)
  const portal = await getFuelCardSummaryForCustomer(name)

  return (
    <DetailPage
      backHref="/customers"
      backLabel="Customers"
      icon={Users}
      title={c.customer}
      subtitle={c.accountType ? `${c.accountType} account` : "No fuel card account"}
      badge={c.accountStatus ? <StatusBadge status={c.accountStatus === "Active" ? "ACTIVE" : "SUSPENDED"} /> : undefined}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label={c.accountType === "Credit" ? "Available credit" : "Prepaid float"} value={<MoneyDisplay amount={c.float ?? c.available} />} />
            <DetailStat label="Active tickets" value={c.activeTickets} />
            <DetailStat label="Vehicles" value={c.vehicles} />
          </div>
          <DetailSection title="Vehicles">
            <MiniTable
              rows={c.vehicleList}
              empty="No vehicles on this account."
              columns={[
                { header: "Vehicle", cell: (v) => <span className="font-semibold">{v.vehicle_number}</span> },
                { header: "Fuel", cell: (v) => v.fuel_type ?? "—" },
                { header: "Limit", cell: (v) => <span>{v.limit_type ?? "—"} · {v.limit_unit === "KES" ? <MoneyDisplay amount={v.limit_value} /> : <LitresDisplay litres={v.limit_value} />}</span> },
                { header: "Approval", cell: (v) => <StatusBadge status={v.approval_status === "Approved" ? "APPROVED" : "PENDING"} /> },
              ]}
            />
          </DetailSection>
          <DetailSection title="Recent tickets">
            <MiniTable
              rows={c.recentTickets}
              empty="No tickets yet."
              columns={[
                { header: "Ticket", cell: (t) => <span className="font-semibold">{t.ticketReference}</span> },
                { header: "Vehicle", cell: (t) => t.vehicle ?? "—" },
                { header: "Authorised", cell: (t) => <MoneyDisplay amount={t.authorisedAmount} /> },
                { header: "Status", cell: (t) => t.status },
                { header: "Created", cell: (t) => <DateTimeDisplay value={t.createdOn} formatStr="dd MMM yyyy" /> },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="Customer" entityId={c.customer} />
        </>
      }
      aside={
        <DetailSection title="Account">
          <DetailFields columns={1} items={[
            { label: "Account type", value: c.accountType ?? "—" },
            { label: "Account status", value: c.accountStatus ?? "—" },
            { label: "Fuel card service", value: portal?.state === "ok" ? "Connected" : "Not connected" },
          ]} />
        </DetailSection>
      }
    />
  )
}
