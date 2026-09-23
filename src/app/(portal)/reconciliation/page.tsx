import { CheckCircle2, AlertTriangle, ShieldCheck, Plug } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { QueryTabs } from "@/components/shared/sub-nav"
import { ReconciliationTable } from "@/components/reconciliation/reconciliation-table"
import { getReconciliationRecords, getReconciliationStats } from "@/lib/data/reconciliation"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import type { ReconciliationLevel } from "@prisma/client"

export default async function ReconciliationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission(["reconciliation:manage", "reconciliation:view"])
  const { level } = await searchParams
  const active = (["TICKET", "TRANSACTION", "FINANCIAL"] as const).find((l) => l === level)
  const [records, stats] = await Promise.all([getReconciliationRecords(active as ReconciliationLevel | undefined), getReconciliationStats()])
  const badge = (l: string) => (stats.byLevel[l]?.open ? ` (${stats.byLevel[l].open})` : "")

  return (
    <div>
      <PageHeader title="Reconciliation" description="Three levels — ticket, transaction and financial. Differences enter the exception queue automatically and every resolution is audited." />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <KpiCard label="Matched" value={stats.matched.toString()} icon={CheckCircle2} iconTint="emerald" />
        <KpiCard label="Open exceptions" value={stats.exceptions.toString()} icon={AlertTriangle} iconTint="red" />
        <KpiCard label="Resolved" value={stats.resolved.toString()} icon={ShieldCheck} iconTint="blue" />
      </div>

      <p className="mb-5 flex items-start gap-2 rounded-xl bg-[#1226AA]/[0.06] px-4 py-3 text-sm text-[#3B3E63]">
        <Plug className="mt-0.5 size-4 shrink-0 text-[#1226AA]" />
        Checks against Jaguar&apos;s ticket/redemption records and POS transaction logs (US-REC-001 to 003) switch on once those integration APIs are connected. Galana&apos;s own ledger is reconciled now.
      </p>

      <QueryTabs
        param="level"
        tabs={[
          { label: "All levels", value: "ALL" },
          { label: `Ticket${badge("TICKET")}`, value: "TICKET" },
          { label: `Transaction${badge("TRANSACTION")}`, value: "TRANSACTION" },
          { label: `Financial${badge("FINANCIAL")}`, value: "FINANCIAL" },
        ]}
      />
      <ReconciliationTable rows={records} canManage={hasPermission(user.roles, "reconciliation:manage")} />
    </div>
  )
}
