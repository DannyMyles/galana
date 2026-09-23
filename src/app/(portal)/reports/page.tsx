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
} from "@/components/icons"
import Link from "next/link"
import { auth } from "@/auth"
import { getStationForUser } from "@/lib/data/pos"
import { StatusBadge } from "@/components/shared/status-badge"
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
    tabs.some((t) => t.key === "dealer") ? getDealerReport(hasPermission(roles, ["settlements:manage", "settlements:view"]) ? undefined : (await getStationForUser(session!.user.id))?.id ?? "none") : null,
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
          <TabsContent value="finance" className="flex flex-col gap-6">
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
           </div>
           <div className="grid gap-5 xl:grid-cols-3">
              {[
                { title: "Dealer settlements", rows: finance.settlementsByStatus, empty: "No settlements yet." },
                { title: "Credit notes", rows: finance.creditNotesByStatus, empty: "No credit notes yet." },
              ].map((block) => (
                <Card key={block.title}>
                  <CardHeader><CardTitle className="text-lg">{block.title}</CardTitle></CardHeader>
                  <CardContent>
                    {block.rows.length === 0 ? <p className="text-sm text-muted-foreground">{block.empty}</p> : (
                      <ul className="flex flex-col gap-3 text-sm">
                        {block.rows.map((r) => (
                          <li key={r.status} className="flex items-center justify-between gap-3"><StatusBadge status={r.status} /><span>{r.count} · <MoneyDisplay amount={r.amount} decimals={0} /></span></li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent top-ups</CardTitle></CardHeader>
                <CardContent>
                  {finance.recentTopUps.length === 0 ? <p className="text-sm text-muted-foreground">No top-up requests yet.</p> : (
                    <ul className="flex flex-col gap-3 text-sm">
                      {finance.recentTopUps.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-3">
                          <Link href={`/funding-wallet/${t.id}`} className="truncate font-medium text-[#1226AA] hover:underline">{t.reference}</Link>
                          <span className="flex shrink-0 items-center gap-2"><MoneyDisplay amount={t.amount} decimals={0} /><StatusBadge status={t.status} /></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
           </div>
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
          <TabsContent value="jaguar" className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label="Total Prepaid Balance" value={<MoneyDisplay amount={jaguar.prepaidBalance} decimals={0} />} icon={Wallet} iconTint="blue" />
              <KpiCard label="Total Consumption" value={<LitresDisplay litres={jaguar.totalConsumptionLitres} />} icon={Fuel} iconTint="amber" />
              <KpiCard label="Active Tickets" value={jaguar.activeTickets.toString()} icon={Ticket} iconTint="purple" />
            </div>
            <div className="grid gap-5 xl:grid-cols-3">
              {[
                { title: "By customer", rows: jaguar.byCustomer },
                { title: "By vehicle", rows: jaguar.byVehicle },
                { title: "By station", rows: jaguar.byStation },
              ].map((block) => (
                <Card key={block.title}>
                  <CardHeader><CardTitle className="text-lg">Consumption {block.title.toLowerCase()}</CardTitle></CardHeader>
                  <CardContent>
                    {block.rows.length === 0 ? <p className="text-sm text-muted-foreground">No completed transactions yet.</p> : (
                      <ul className="flex flex-col gap-3 text-sm">
                        {block.rows.slice(0, 8).map((r) => (
                          <li key={r.name} className="flex items-center justify-between gap-3 border-b border-[#EEF0F8] pb-2 last:border-0">
                            <span className="truncate font-medium">{r.name}</span>
                            <span className="shrink-0 text-right"><LitresDisplay litres={r.litres} /><span className="block text-xs text-muted-foreground"><MoneyDisplay amount={r.amount} decimals={0} /></span></span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {dealer && (
          <TabsContent value="dealer" className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">Showing: <span className="font-semibold text-foreground">{dealer.stationName}</span></p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label="Station Consumption" value={<LitresDisplay litres={dealer.stationConsumptionLitres} />} icon={Fuel} iconTint="amber" />
              <KpiCard label="Current Dealer Credits" value={<MoneyDisplay amount={dealer.currentCredits} decimals={0} />} icon={Landmark} iconTint="blue" />
              <KpiCard label="Transaction History" value={dealer.transactionCount.toString()} icon={ArrowLeftRight} iconTint="purple" />
              <KpiCard label="Failed Transactions" value={dealer.failedTransactions.toString()} icon={AlertTriangle} iconTint="red" />
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Settlement status</CardTitle></CardHeader>
                <CardContent>
                  {dealer.settlementStatus.length === 0 ? <p className="text-sm text-muted-foreground">No settlements yet.</p> : (
                    <ul className="flex flex-col gap-3 text-sm">
                      {dealer.settlementStatus.map((s) => (
                        <li key={s.status} className="flex items-center justify-between gap-3"><StatusBadge status={s.status} /><span>{s.count} · <MoneyDisplay amount={s.amount} decimals={0} /></span></li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent failed transactions</CardTitle></CardHeader>
                <CardContent>
                  {dealer.recentFailures.length === 0 ? <p className="text-sm text-muted-foreground">No failures — nice.</p> : (
                    <ul className="flex flex-col gap-3 text-sm">
                      {dealer.recentFailures.map((f) => (
                        <li key={f.id}><span className="font-semibold">{f.reference}</span><span className="block text-xs text-[#D01A2F]">{f.failureReason}</span></li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
