import Link from "next/link"
import { AlertTriangle as AlertIcon } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay } from "@/components/shared/money-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { KpiCard } from "@/components/shared/kpi-card"
import { requirePermission } from "@/lib/rbac/guard"
import { listCreditNotes, type CreditNoteLine } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const dynamic = "force-dynamic"

const LABEL: Record<CreditNoteLine["type"], string> = { UNDER_CANOPY: "Under-canopy", CONTRACTUAL: "Jaguar contractual" }

export default async function CreditNotesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission(["credit-notes:view", "credit-notes:manage"])
  const raw = await searchParams
  const page = Math.max(Number(raw.page ?? 0) || 0, 0)
  const result = await listCreditNotes({ fromDate: raw.from, toDate: raw.to, page })
  const rows = toPlain(result.rows as CreditNoteLine[])
  const pages = Math.max(Math.ceil(result.totalRows / result.pageSize), 1)

  return (
    <div>
      <PageHeader title="Credit Notes" description="Jaguar credit notes raised from settlements: one for the under-canopy discount and one for the Jaguar contractual discount, per settlement." />
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <KpiCard label="Under-canopy total" value={<MoneyDisplay amount={result.totals.UNDER_CANOPY ?? 0} />} icon={AlertIcon} iconTint="blue" />
        <KpiCard label="Jaguar contractual total" value={<MoneyDisplay amount={result.totals.CONTRACTUAL ?? 0} />} icon={AlertIcon} iconTint="purple" />
      </div>
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<CreditNoteLine>
          rows={rows}
          empty="No credit notes. Set the per-litre rates in Galana Settings to raise them."
          columns={[
            { header: "Settlement", cell: (c) => <Link href={`/credit-notes/${encodeURIComponent(c.id)}`} className="font-semibold text-[#1226AA] hover:underline">{c.settlement}</Link> },
            { header: "Date", cell: (c) => c.date },
            { header: "Station", cell: (c) => c.station },
            { header: "Type", cell: (c) => LABEL[c.type] },
            { header: "Amount", cell: (c) => <MoneyDisplay amount={c.amount} /> },
            { header: "Status", cell: () => <StatusBadge status="PENDING" /> },
          ]}
        />
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          {page > 0 && <a href={`/credit-notes?page=${page - 1}`} className="rounded-lg border px-3 py-1.5">Previous</a>}
          <span className="px-2">Page {page + 1} of {pages}</span>
          {page + 1 < pages && <a href={`/credit-notes?page=${page + 1}`} className="rounded-lg border px-3 py-1.5">Next</a>}
        </div>
      </div>
    </div>
  )
}
