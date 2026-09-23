import { AlertTriangle, Clock, CheckCircle2 } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { QueryTabs } from "@/components/shared/sub-nav"
import { ExceptionWorkspace } from "@/components/exceptions/exception-workspace"
import { getExceptionStats, getExceptionQueue } from "@/lib/data/exceptions"
import { getStationForUser } from "@/lib/data/pos"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"

export default async function FailedTransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission(["transactions:view-station", "transactions:view-all", "exceptions:resolve", "exceptions:view"])
  const { view } = await searchParams
  const seesAll = hasPermission(user.roles, ["transactions:view-all", "exceptions:view", "exceptions:resolve"])
  // Dealer managers only see failures at their own station (US-DM-009).
  const scope = seesAll ? undefined : ((await getStationForUser(user.id))?.id ?? "none")
  const tab = view === "resolved" ? "resolved" : "open"

  const [stats, items] = await Promise.all([getExceptionStats(scope), getExceptionQueue(tab, scope)])

  return (
    <div>
      <PageHeader
        title="Failed Transactions"
        description={seesAll ? "Review, investigate and resolve failed, reversed and ambiguous transactions." : "Failed transactions at your station and the reason for each."}
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <KpiCard label="Open exceptions" value={stats.openCount.toString()} icon={AlertTriangle} iconTint="red" />
        <KpiCard label="Avg resolution time" value={`${stats.avgResolutionMinutes}m`} icon={Clock} iconTint="amber" helperText="Target SLA ≤ 20m" />
        <KpiCard label="Resolved today" value={stats.resolvedTodayCount.toString()} icon={CheckCircle2} iconTint="emerald" />
      </div>

      <QueryTabs param="view" tabs={[{ label: "Open", value: "open" }, { label: "Resolved", value: "resolved" }]} />
      <ExceptionWorkspace items={items} canResolve={hasPermission(user.roles, "exceptions:resolve")} />
    </div>
  )
}
