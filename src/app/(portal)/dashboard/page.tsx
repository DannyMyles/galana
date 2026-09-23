import Link from "next/link"
import { Wallet, Fuel, CheckCircle2, AlertTriangle, Plus } from "@/components/icons"
import { auth } from "@/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsumptionTrendChart } from "@/components/dashboard/consumption-trend-chart"
import { StatusDonut } from "@/components/dashboard/status-donut"
import { RecentTransactionsTable } from "@/components/dashboard/recent-transactions-table"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { hasPermission } from "@/lib/rbac/roles"
import { getFinanceDashboardData } from "@/lib/data/dashboard"

export default async function DashboardPage() {
  const session = await auth()
  const data = await getFinanceDashboardData()
  const firstName = (session?.user?.name ?? "there").split(" ")[0]
  const canTopUp = session?.user ? hasPermission(session.user.roles, "wallet:topup:create") : false
  const maxLitres = Math.max(1, ...data.topStations.map((s) => s.litres))

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <DashboardHeader
        firstName={firstName}
        actions={
          canTopUp ? (
            <Button render={<Link href="/funding-wallet/topup" />} nativeButton={false} className="h-12 rounded-xl px-5">
              <Plus className="size-4" />
              Top up Request
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Fuel Wallet Balance" value={<MoneyDisplay amount={data.walletBalance} decimals={0} />} icon={Wallet} iconTint="blue" />
        <KpiCard
          label="Total Consumption (MTD)"
          value={<LitresDisplay litres={data.monthConsumptionLitres} />}
          icon={Fuel}
          iconTint="amber"
        />
        <KpiCard
          label="Completed Transactions"
          value={data.completedTransactionsCount.toLocaleString()}
          icon={CheckCircle2}
          iconTint="emerald"
        />
        <KpiCard
          label="Pending Reconciliation"
          value={data.pendingReconciliationCount.toLocaleString()}
          icon={AlertTriangle}
          iconTint="purple"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Consumption Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Litres dispensed per day, last 30 days</p>
          </CardHeader>
          <CardContent>
            <ConsumptionTrendChart data={data.consumptionTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown by status</p>
          </CardHeader>
          <CardContent>
            <StatusDonut data={data.statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="link" render={<Link href="/transactions" />} nativeButton={false}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <RecentTransactionsTable rows={data.recentTransactions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Stations</CardTitle>
            <p className="text-sm text-muted-foreground">By litres dispensed</p>
          </CardHeader>
          <CardContent>
            {data.topStations.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No completed transactions yet.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {data.topStations.map((station, index) => (
                  <li key={station.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1226AA]/10 text-xs font-semibold text-[#1226AA]">
                          {index + 1}
                        </span>
                        <span className="truncate font-medium text-[#0B0B33]">{station.name}</span>
                      </span>
                      <LitresDisplay litres={station.litres} className="shrink-0 font-semibold" />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEF0F8]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1226AA] to-[#F75B8C]"
                        style={{ width: `${(station.litres / maxLitres) * 100}%` }}
                      />
                    </div>
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
