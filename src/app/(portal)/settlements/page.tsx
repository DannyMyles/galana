import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MoneyDisplay } from "@/components/shared/money-display"
import { SettlementsTable } from "@/components/settlements/settlements-table"
import { getSettlements } from "@/lib/data/settlements"

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const page = params.page ? Number(params.page) : 0
  const { rows, totalRows, pageSize, outstandingLiability } = await getSettlements({ page })

  return (
    <div>
      <PageHeader title="Settlements" description="Dealer settlements created from completed transactions" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <KpiCard label="Outstanding Dealer Liability" value={<MoneyDisplay amount={outstandingLiability} />} />
        <KpiCard label="Total Settlement Records" value={totalRows.toString()} />
      </div>

      <SettlementsTable rows={rows} totalRows={totalRows} pageSize={pageSize} />
    </div>
  )
}
