import { AlertTriangle, Clock, CheckCircle2 } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { ExceptionWorkspace } from "@/components/exceptions/exception-workspace"
import { getExceptionStats, getExceptionQueue } from "@/lib/data/exceptions"

export default async function FailedTransactionsPage() {
  const [stats, items] = await Promise.all([getExceptionStats(), getExceptionQueue()])

  return (
    <div>
      <PageHeader
        title="Failed Transactions"
        description="Review, investigate, and resolve transaction exceptions, network timeouts, and dispenser mismatches"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open Exceptions" value={stats.openCount.toString()} icon={AlertTriangle} iconTint="red" />
        <KpiCard
          label="Avg Resolution Time"
          value={`${stats.avgResolutionMinutes}m`}
          icon={Clock}
          iconTint="amber"
          helperText="Target SLA threshold: ≤ 20m"
        />
        <KpiCard
          label="Resolved Today"
          value={stats.resolvedTodayCount.toString()}
          icon={CheckCircle2}
          iconTint="emerald"
        />
      </div>

      <ExceptionWorkspace items={items} />
    </div>
  )
}
