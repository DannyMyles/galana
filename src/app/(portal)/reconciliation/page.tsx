import { CheckCircle2, AlertTriangle, ShieldCheck } from "@/components/icons"
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
        <KpiCard label="Matched" value={stats.matched.toString()} icon={CheckCircle2} iconTint="emerald" />
        <KpiCard label="Open Exceptions" value={stats.exceptions.toString()} icon={AlertTriangle} iconTint="red" />
        <KpiCard label="Resolved" value={stats.resolved.toString()} icon={ShieldCheck} iconTint="blue" />
      </div>

      <ReconciliationTable rows={records} />
    </div>
  )
}
