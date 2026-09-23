import { Landmark, ListChecks, CheckCircle2 } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MoneyDisplay } from "@/components/shared/money-display"
import { SettlementsTable } from "@/components/settlements/settlements-table"
import { getSettlements } from "@/lib/data/settlements"
import { getStationForUser } from "@/lib/data/pos"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { prisma } from "@/lib/db/client"
import type { SettlementStatus } from "@prisma/client"

export default async function SettlementsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission(["settlements:manage", "settlements:view", "reports:dealer"])
  const p = await searchParams
  const seesAll = hasPermission(user.roles, ["settlements:manage", "settlements:view"])
  // Dealers only ever see their own station's settlements (US-RPT-016..020).
  const scope = seesAll ? undefined : ((await getStationForUser(user.id))?.id ?? "none")

  const [{ rows, totalRows, pageSize, outstandingLiability, outstandingCount, byStatus }, stations] = await Promise.all([
    getSettlements({ status: p.status as SettlementStatus | undefined, stationId: p.stationId, page: Number(p.page ?? 0) }, scope),
    seesAll ? prisma.station.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve(undefined),
  ])
  const settled = byStatus.find((b) => b.status === "SETTLED")

  return (
    <div>
      <PageHeader title="Settlements" description={seesAll ? "Dealer settlements created from completed transactions, net of the under-canopy discount." : "Your station's settlements and their payment status."} />
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <KpiCard label="Outstanding liability" value={<MoneyDisplay amount={outstandingLiability} decimals={0} />} icon={Landmark} iconTint="amber" helperText={`${outstandingCount} pending`} />
        <KpiCard label="Settled" value={<MoneyDisplay amount={settled?.amount ?? 0} decimals={0} />} icon={CheckCircle2} iconTint="emerald" helperText={`${settled?.count ?? 0} records`} />
        <KpiCard label="Matching records" value={totalRows.toString()} icon={ListChecks} iconTint="blue" />
      </div>
      <SettlementsTable rows={rows} totalRows={totalRows} pageSize={pageSize} stations={stations} canManage={hasPermission(user.roles, "settlements:manage")} />
    </div>
  )
}
