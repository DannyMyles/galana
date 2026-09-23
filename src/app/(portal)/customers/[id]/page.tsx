import Link from "next/link"
import { Car, Users } from "@/components/icons"
import { DetailPage, DetailSection, DetailStat } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getCustomerDetail } from "@/lib/data/customers"
import { requirePermission } from "@/lib/rbac/guard"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["reports:jaguar", "reports:finance"])
  const { id } = await params
  const customer = await getCustomerDetail(id)

  return (
    <DetailPage
      backHref="/customers"
      backLabel="Customers"
      icon={Users}
      title={customer.name}
      subtitle={customer.tier ?? undefined}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Wallet balance" value={customer.wallet ? <MoneyDisplay amount={String(customer.wallet.balance)} /> : "—"} />
            <DetailStat label="Vehicles" value={customer.vehicles.length} />
            <DetailStat label="Recent tickets" value={customer.tickets.length} />
          </div>
          <DetailSection title="Recent tickets">
            <MiniTable
              rows={customer.tickets}
              empty="No tickets issued yet."
              columns={[
                { header: "Ticket", cell: (t) => <Link href={`/fuel-tickets/${t.id}`} className="font-semibold text-[#1226AA] hover:underline">{t.ticketNo}</Link> },
                { header: "Product", cell: (t) => t.product.name },
                { header: "Vehicle", cell: (t) => t.vehicle?.regNo ?? "—" },
                { header: "Qty", cell: (t) => <LitresDisplay litres={String(t.authorisedQuantityL)} /> },
                { header: "Expires", cell: (t) => <DateTimeDisplay value={t.expiresAt} /> },
                { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
              ]}
            />
          </DetailSection>
        </>
      }
      aside={
        <DetailSection title="Vehicles">
          {customer.vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles registered.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {customer.vehicles.map((v) => (
                <li key={v.id} className="flex items-center gap-2.5 rounded-xl bg-[#F6F7FB] px-3 py-2.5 font-medium">
                  <Car className="size-4 text-[#6A6C8C]" />
                  {v.regNo}
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
      }
    >
      <EntityAudit entityType="Customer" entityId={customer.id} />
    </DetailPage>
  )
}
