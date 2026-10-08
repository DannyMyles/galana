import Link from "next/link"
import { auth } from "@/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { QuoteCard } from "@/components/dashboard/quote-card"
import { getRandomQuote } from "@/lib/data/quote"
import { dashboardFor } from "@/lib/data/portal-reports"
import { BarsChart, DonutChart, TrendChart } from "@/components/charts/portal-charts"
import { requirePermission } from "@/lib/rbac/guard"
import { Plug, AlertTriangle, CheckCircle2 } from "@/components/icons"
import type { Unavailable as UnavailableItem } from "@/lib/integrations/fuel-card-partner"

const TICKET_LABEL: Record<string, string> = { Reserved: "Active", Dispensing: "Fuelling", Consumed: "Consumed", Expired: "Expired", Refunded: "Cancelled" }

function Unavailable({ item }: { item: UnavailableItem }) {
  return (
    <div className="rounded-xl border border-dashed border-[#D5D9EA] bg-[#F6F7FB] p-4">
      <p className="text-sm font-semibold text-[#3B3E63]">{item.label}</p>
      <p className="mt-1 text-xs text-[#6A6C8C]">{item.reason}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-[#1B1D3A]">{title}</h2>
      {children}
    </section>
  )
}

export default async function DashboardPage() {
  await requirePermission(["reports:ops", "reports:finance", "reports:jaguar", "reports:dealer"])
  const session = await auth()
  const [d, quote] = await Promise.all([dashboardFor(session!.user!.email as string), getRandomQuote()])
  const firstName = (session?.user?.name ?? "there").split(" ")[0]

  return (
    <div>
      <DashboardHeader
        firstName={firstName}
        subtitle={d.scope === "station" ? `Your station: ${d.dealer?.stationName ?? d.station}` : "Operations, finance and Jaguar figures from the fuel card service."}
        quote={<QuoteCard quote={quote} />}
      />

      {d.operations && (
        <Section title="Operations">
          <div className="mb-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
            <KpiCard label="Active stations" value={d.operations.activeStations.toString()} icon={Plug} iconTint="blue" />
            <KpiCard label="Active POS devices" value={d.operations.activePosDevices.toString()} icon={Plug} iconTint="emerald" />
            <KpiCard label="Today's fuelling" value={`${d.operations.today.transactions}`} helperText={`${d.operations.today.litres.toFixed(1)} L`} icon={CheckCircle2} iconTint="blue" />
            <KpiCard label="Failed transactions" value={d.operations.failedTransactions.count.toString()} icon={AlertTriangle} iconTint="red" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
              <p className="mb-3 text-sm font-semibold">Top-consuming stations (last 30 days)</p>
              <MiniTable rows={d.operations.topStations} empty="No fuelling in this period." columns={[
                { header: "Station", cell: (s) => s.station },
                { header: "Litres", cell: (s) => <LitresDisplay litres={s.litres} /> },
                { header: "Amount", cell: (s) => <MoneyDisplay amount={s.amount} /> },
              ]} />
            </div>
            <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
              <p className="mb-3 text-sm font-semibold">Tickets nearing expiry (next 2 hours)</p>
              <MiniTable rows={d.operations.ticketsNearingExpiry} empty="No tickets are close to expiry." columns={[
                { header: "Ticket", cell: (t) => t.ticketReference },
                { header: "Vehicle", cell: (t) => t.vehicle ?? "—" },
                { header: "Expires", cell: (t) => <DateTimeDisplay value={t.expiresOn} formatStr="dd MMM HH:mm" /> },
              ]} />
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <DonutChart
              title="Fuelling outcomes"
              description="Completed against failed, over the period"
              data={[{ name: "Completed", value: d.outcomes?.completed ?? 0 }, { name: "Failed", value: d.outcomes?.failed ?? 0 }]}
            />
            <DonutChart
              title="Tickets by status"
              description="Tickets created in the period"
              data={Object.entries(d.ticketStatus ?? {}).map(([k, v]) => ({ name: TICKET_LABEL[k] ?? k, value: v }))}
            />
          </div>
          <div className="mt-5">
            <TrendChart title="Litres dispensed per day" data={(d.trend ?? []).map((t) => ({ date: t.date, value: t.litres }))} />
          </div>
        </Section>
      )}

      {d.finance && (
        <Section title="Finance">
          <div className="mb-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
            <KpiCard label="Fuel-wallet balance" value={<MoneyDisplay amount={d.finance.fuelWalletBalance} />} icon={CheckCircle2} iconTint="emerald" />
            <KpiCard label="Consumption (30 days)" value={<MoneyDisplay amount={d.finance.totalConsumption.amount} />} icon={CheckCircle2} iconTint="blue" />
            <KpiCard label="Total Jaguar funding" value={<MoneyDisplay amount={d.finance.totalJaguarFunding} />} helperText="All-time approved top-ups" icon={CheckCircle2} iconTint="purple" />
            <KpiCard label="Dealer settlement liability" value={<MoneyDisplay amount={d.finance.dealerSettlementLiability} />} helperText="Pending, not yet posted" icon={CheckCircle2} iconTint="blue" />
          </div>
          <div className="mt-5">
            <TrendChart title="Consumption per day (KES)" unit="KES" data={(d.trend ?? []).map((t) => ({ date: t.date, value: t.amount }))} />
          </div>
        </Section>
      )}

      {d.jaguar && (
        <Section title="Jaguar">
          <div className="mb-5 grid gap-5 sm:grid-cols-3">
            <KpiCard label="Prepaid balance" value={<MoneyDisplay amount={d.jaguar.prepaidBalance} />} icon={CheckCircle2} iconTint="emerald" />
            <KpiCard label="Consumption (30 days)" value={<MoneyDisplay amount={d.jaguar.consumption.amount} />} icon={CheckCircle2} iconTint="blue" />
            <KpiCard label="Active tickets" value={d.jaguar.activeTickets.toString()} icon={Plug} iconTint="purple" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
              <p className="mb-3 text-sm font-semibold">By vehicle</p>
              <MiniTable rows={d.jaguar.byVehicle} empty="No fuelling in this period." columns={[
                { header: "Vehicle", cell: (v) => v.vehicle },
                { header: "Litres", cell: (v) => <LitresDisplay litres={v.litres} /> },
                { header: "Amount", cell: (v) => <MoneyDisplay amount={v.amount} /> },
              ]} />
            </div>
            <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
              <p className="mb-3 text-sm font-semibold">By station</p>
              <MiniTable rows={d.jaguar.byStation} empty="No fuelling in this period." columns={[
                { header: "Station", cell: (s) => s.station },
                { header: "Litres", cell: (s) => <LitresDisplay litres={s.litres} /> },
                { header: "Amount", cell: (s) => <MoneyDisplay amount={s.amount} /> },
              ]} />
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <BarsChart title="Litres by vehicle" data={d.jaguar.byVehicle.map((v) => ({ label: v.vehicle, value: v.litres }))} />
            <DonutChart title="Litres by station" description="Share of fuelling per station" data={d.jaguar.byStation.map((s) => ({ name: s.station, value: s.litres }))} />
          </div>
        </Section>
      )}

      {d.dealer && (
        <Section title="Your station">
          <div className="mb-5 grid gap-5 sm:grid-cols-3">
            <KpiCard label="Consumption (30 days)" value={<MoneyDisplay amount={d.dealer.consumption.amount} />} helperText={`${d.dealer.consumption.litres.toFixed(1)} L`} icon={CheckCircle2} iconTint="blue" />
            <KpiCard label="Failed transactions" value={d.dealer.failedTransactions.toString()} icon={AlertTriangle} iconTint="red" />
            <KpiCard label="Transactions" value={d.dealer.consumption.transactions.toString()} icon={Plug} iconTint="purple" />
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Unavailable item={d.dealer.currentDealerCredits} />
            <Unavailable item={d.dealer.settlementStatus} />
          </div>
          <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Recent transactions</p>
              <Link href="/transactions" className="text-sm text-[#1226AA] hover:underline">All transactions</Link>
            </div>
            <MiniTable rows={d.dealer.transactionHistory} empty="No transactions in this period." columns={[
              { header: "Reference", cell: (t) => t.reference },
              { header: "Date", cell: (t) => t.date },
              { header: "Vehicle", cell: (t) => t.vehicle ?? "—" },
              { header: "Litres", cell: (t) => <LitresDisplay litres={t.litres} /> },
              { header: "Amount", cell: (t) => <MoneyDisplay amount={t.amount} /> },
            ]} />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <DonutChart title="Completed against failed" data={[{ name: "Completed", value: d.dealer.consumption.transactions }, { name: "Failed", value: d.dealer.failedTransactions }]} />
            <TrendChart title="Litres per day at your station" data={(d.trend ?? []).map((t) => ({ date: t.date, value: t.litres }))} />
          </div>
        </Section>
      )}

      {d.sections.length === 0 && <p className="text-sm text-muted-foreground">No dashboard sections are available for your role.</p>}
    </div>
  )
}
