import { auth } from "@/auth"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { reportFor } from "@/lib/data/portal-reports"
import { requirePermission } from "@/lib/rbac/guard"
import { BarsChart, DonutChart, TrendChart } from "@/components/charts/portal-charts"
import { CheckCircle2, AlertTriangle } from "@/components/icons"

function defaultRange() {
  const to = new Date()
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission(["reports:ops", "reports:finance", "reports:jaguar", "reports:dealer"])
  const session = await auth()
  const raw = await searchParams
  const range = defaultRange()
  const from = raw.from || range.from
  const to = raw.to || range.to
  const r = await reportFor(session!.user!.email as string, from, to)

  return (
    <div>
      <PageHeader title="Reports" description={r.scope === "station" ? `Your station, ${from} to ${to}` : `All stations and customers, ${from} to ${to}`} />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[#E4E7F2] bg-white p-4">
        <label className="text-xs text-[#6A6C8C]">From<input type="date" name="from" defaultValue={from} className="mt-1 block rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm" /></label>
        <label className="text-xs text-[#6A6C8C]">To<input type="date" name="to" defaultValue={to} className="mt-1 block rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm" /></label>
        <button type="submit" className="rounded-lg bg-[#1226AA] px-4 py-2 text-sm font-medium text-white">Run report</button>
      </form>

      <div className="mb-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        <KpiCard label="Transactions" value={r.totals.transactions.toString()} icon={CheckCircle2} iconTint="blue" />
        <KpiCard label="Litres" value={<LitresDisplay litres={r.totals.litres} />} icon={CheckCircle2} iconTint="emerald" />
        <KpiCard label="Amount" value={<MoneyDisplay amount={r.totals.amount} />} icon={CheckCircle2} iconTint="purple" />
        <KpiCard label="Failed" value={r.totals.failedTransactions.toString()} icon={AlertTriangle} iconTint="red" />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
          <p className="mb-3 text-sm font-semibold">By station</p>
          <MiniTable rows={r.byStation} empty="No fuelling in this period." columns={[
            { header: "Station", cell: (s) => s.station },
            { header: "Transactions", cell: (s) => s.transactions },
            { header: "Litres", cell: (s) => <LitresDisplay litres={s.litres} /> },
            { header: "Amount", cell: (s) => <MoneyDisplay amount={s.amount} /> },
          ]} />
        </div>
        <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
          <p className="mb-3 text-sm font-semibold">By customer</p>
          <MiniTable rows={r.byCustomer} empty="No fuelling in this period." columns={[
            { header: "Customer", cell: (c) => c.customer },
            { header: "Transactions", cell: (c) => c.transactions },
            { header: "Litres", cell: (c) => <LitresDisplay litres={c.litres} /> },
            { header: "Amount", cell: (c) => <MoneyDisplay amount={c.amount} /> },
          ]} />
        </div>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <DonutChart title="Litres by station" description={`${from} to ${to}`} data={r.byStation.map((s) => ({ name: s.station, value: s.litres }))} />
        <BarsChart title="Litres by customer" data={r.byCustomer.map((c) => ({ label: c.customer, value: c.litres }))} />
      </div>
      <div className="mb-6">
        <TrendChart title="Litres per day" data={r.byDay.map((d) => ({ date: d.date, value: d.litres }))} />
      </div>
      <div className="mb-6 rounded-xl border border-[#E4E7F2] bg-white p-4">
        <p className="mb-3 text-sm font-semibold">By day</p>
        <MiniTable rows={r.byDay} empty="No fuelling in this period." columns={[
          { header: "Date", cell: (d) => d.date },
          { header: "Transactions", cell: (d) => d.transactions },
          { header: "Litres", cell: (d) => <LitresDisplay litres={d.litres} /> },
          { header: "Amount", cell: (d) => <MoneyDisplay amount={d.amount} /> },
        ]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {r.unavailable.map((u) => (
          <div key={u.label} className="rounded-xl border border-dashed border-[#D5D9EA] bg-[#F6F7FB] p-4">
            <p className="text-sm font-semibold text-[#3B3E63]">{u.label}</p>
            <p className="mt-1 text-xs text-[#6A6C8C]">{u.reason}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
