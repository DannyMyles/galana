import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { requirePermission } from "@/lib/rbac/guard"
import { listTransactions, type PortalTransaction } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export default async function FailedTransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission(["transactions:view-all", "transactions:view-station"])
  const raw = await searchParams
  const page = Math.max(Number(raw.page ?? 0) || 0, 0)
  const result = await listTransactions({ status: "FAILED", page, pageSize: 10 })
  const rows = toPlain(result.rows as PortalTransaction[])
  const pages = Math.max(Math.ceil(result.totalRows / result.pageSize), 1)

  return (
    <div>
      <PageHeader title="Failed Transactions" description={`${result.totalRows} failed fuelling attempts, with the reason for each.`} />
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<PortalTransaction>
          rows={rows}
          empty="No failed transactions."
          columns={[
            { header: "Reference", cell: (t) => <Link href={`/transactions/${t.id}`} className="font-semibold text-[#1226AA] hover:underline">{t.reference}</Link> },
            { header: "Happened", cell: (t) => t.happenedAt.slice(0, 16) },
            { header: "Vehicle", cell: (t) => t.vehicle ?? "—" },
            { header: "Station", cell: (t) => t.station ?? "—" },
            { header: "Reason", cell: (t) => t.failureReason ?? "Not recorded" },
            { header: "Status", cell: () => <StatusBadge status="FAILED" /> },
          ]}
        />
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          {page > 0 && <Link href={`/failed-transactions?page=${page - 1}`} className="rounded-lg border px-3 py-1.5">Previous</Link>}
          <span className="px-2">Page {page + 1} of {pages}</span>
          {page + 1 < pages && <Link href={`/failed-transactions?page=${page + 1}`} className="rounded-lg border px-3 py-1.5">Next</Link>}
        </div>
      </div>
    </div>
  )
}
