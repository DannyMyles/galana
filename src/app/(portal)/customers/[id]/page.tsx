import { Wallet, Car, Ticket as TicketIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MoneyDisplay } from "@/components/shared/money-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCustomerDetail } from "@/lib/data/customers"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomerDetail(id)

  return (
    <div>
      <PageHeader title={customer.name} description={customer.tier ?? undefined} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Wallet Balance"
          value={customer.wallet ? <MoneyDisplay amount={String(customer.wallet.balance)} /> : "—"}
          icon={Wallet}
          iconTint="blue"
        />
        <KpiCard label="Vehicles" value={customer.vehicles.length.toString()} icon={Car} iconTint="amber" />
        <KpiCard
          label="Recent Tickets"
          value={customer.tickets.length.toString()}
          icon={TicketIcon}
          iconTint="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles registered.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {customer.vehicles.map((vehicle) => (
                  <li key={vehicle.id} className="border-b pb-2">
                    {vehicle.regNo}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets issued yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {customer.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{ticket.ticketNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.product.name} · {ticket.vehicle?.regNo ?? "—"} ·{" "}
                        <DateTimeDisplay value={ticket.expiresAt} />
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
