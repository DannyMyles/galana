import {
  Wallet,
  Fuel,
  Landmark,
  AlertTriangle,
  Building2,
  Cpu,
  ArrowLeftRight,
  Clock,
  Ticket,
  ShieldCheck,
} from "@/components/icons"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getFinanceReport,
  getOpsReport,
  getJaguarReport,
  getDealerReport,
} from "@/lib/data/reports"

export default async function ReportsPage() {
  const session = await auth()
  const roles = session?.user.roles ?? []

  const tabs = [
    { key: "finance", label: "Finance", permission: "reports:finance" as const },
    { key: "ops", label: "Operations", permission: "reports:ops" as const },
    { key: "jaguar", label: "Jaguar", permission: "reports:jaguar" as const },
    { key: "dealer", label: "Dealer", permission: "reports:dealer" as const },
  ].filter((tab) => hasPermission(roles, tab.permission))

  if (tabs.length === 0) {
    return (
      <div>
        <PageHeader title="Reports" />
        <p className="text-sm text-muted-foreground">You do not have access to any reports.</p>
      </div>
    )
  }

  const [finance, ops, jaguar, dealer] = await Promise.all([
    tabs.some((t) => t.key === "finance") ? getFinanceReport() : null,
    tabs.some((t) => t.key === "ops") ? getOpsReport() : null,
    tabs.some((t) => t.key === "jaguar") ? getJaguarReport() : null,
    tabs.some((t) => t.key === "dealer") ? getDealerReport() : null,
  ])

  return (
    <div>
      <PageHeader title="Reports" description="Finance, Operations, Jaguar, and Dealer performance" />

      <Tabs defaultValue={tabs[0].key}>
        <TabsList className="mb-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {finance && (
          <TabsContent value="finance" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Total Jaguar Funding"
              value={<MoneyDisplay amount={finance.totalFunding} />}
              icon={Wallet}
              iconTint="blue"
            />
            <KpiCard
              label="Fuel Wallet Balance"
              value={<MoneyDisplay amount={finance.walletBalance} />}
              icon={Wallet}
              iconTint="purple"
            />
            <KpiCard
              label="Total Consumption"
              value={<LitresDisplay litres={finance.totalConsumptionLitres} />}
              icon={Fuel}
              iconTint="amber"
            />
            <KpiCard
              label="Dealer Settlement Liability"
              value={<MoneyDisplay amount={finance.dealerLiability} />}
              icon={Landmark}
              iconTint="red"
            />
            <KpiCard
              label="Outstanding Reconciliation"
              value={finance.outstandingReconciliation.toString()}
              icon={AlertTriangle}
              iconTint="emerald"
            />
          </TabsContent>
        )}

        {ops && (
          <TabsContent value="ops" className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label="Active Stations" value={ops.activeStations.toString()} icon={Building2} iconTint="blue" />
              <KpiCard label="Active POS Devices" value={ops.activePosDevices.toString()} icon={Cpu} iconTint="purple" />
              <KpiCard
                label="Today's Transactions"
                value={ops.todaysTransactions.toString()}
                icon={ArrowLeftRight}
                iconTint="emerald"
              />
              <KpiCard
                label="Failed Transactions"
                value={ops.failedTransactions.toString()}
                icon={AlertTriangle}
                iconTint="red"
              />
              <KpiCard
                label="Tickets Approaching Expiry"
                value={ops.expiringTickets.toString()}
                icon={Clock}
                iconTint="amber"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Top Consuming Stations</CardTitle>
              </CardHeader>
              <CardContent>
                {ops.topStations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completed transactions yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {ops.topStations.map((station) => (
                      <li key={station.name} className="flex items-center justify-between border-b pb-2">
                        <span>{station.name}</span>
                        <LitresDisplay litres={station.litres} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {jaguar && (
          <TabsContent value="jaguar" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Total Prepaid Balance"
              value={<MoneyDisplay amount={jaguar.prepaidBalance} />}
              icon={Wallet}
              iconTint="blue"
            />
            <KpiCard
              label="Total Consumption"
              value={<LitresDisplay litres={jaguar.totalConsumptionLitres} />}
              icon={Fuel}
              iconTint="amber"
            />
            <KpiCard label="Active Tickets" value={jaguar.activeTickets.toString()} icon={Ticket} iconTint="purple" />
          </TabsContent>
        )}

        {dealer && (
          <TabsContent value="dealer" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Station Consumption"
              value={<LitresDisplay litres={dealer.stationConsumptionLitres} />}
              icon={Fuel}
              iconTint="amber"
            />
            <KpiCard
              label="Current Dealer Credits"
              value={<MoneyDisplay amount={dealer.currentCredits} />}
              icon={Landmark}
              iconTint="blue"
            />
            <KpiCard
              label="Transaction History"
              value={dealer.transactionCount.toString()}
              icon={ArrowLeftRight}
              iconTint="purple"
            />
            <KpiCard
              label="Failed Transactions"
              value={dealer.failedTransactions.toString()}
              icon={AlertTriangle}
              iconTint="red"
            />
            <KpiCard
              label="Settled Records"
              value={dealer.settledCount.toString()}
              icon={ShieldCheck}
              iconTint="emerald"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
