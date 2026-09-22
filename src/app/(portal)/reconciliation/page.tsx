import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { ReconciliationTable } from "@/components/reconciliation/reconciliation-table"
import { getReconciliationRecords, getReconciliationStats } from "@/lib/data/reconciliation"

export default async function ReconciliationPage() {
  const [records, stats] = await Promise.all([getReconciliationRecords(), getReconciliationStats()])

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Ticket, transaction, and financial reconciliation across the platform"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Matched" value={stats.matched.toString()} />
        <KpiCard label="Open Exceptions" value={stats.exceptions.toString()} />
        <KpiCard label="Resolved" value={stats.resolved.toString()} />
      </div>

      <ReconciliationTable rows={records} />
    </div>
  )
}
