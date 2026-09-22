import Link from "next/link"
import { Wallet, Fuel, CheckCircle2, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsumptionTrendChart } from "@/components/dashboard/consumption-trend-chart"
import { RecentTransactionsTable } from "@/components/dashboard/recent-transactions-table"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { getFinanceDashboardData } from "@/lib/data/dashboard"

export default async function DashboardPage() {
  const data = await getFinanceDashboardData()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Here's what's happening with your fuel card solution today."
        actions={
          <Button render={<Link href="/funding-wallet/topup" />} nativeButton={false}>
            Top up Request
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Fuel Wallet Balance"
          value={<MoneyDisplay amount={data.walletBalance} />}
          icon={Wallet}
          iconTint="blue"
        />
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

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumptionTrendChart data={data.consumptionTrend} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="link" render={<Link href="/transactions" />} nativeButton={false}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <RecentTransactionsTable rows={data.recentTransactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
