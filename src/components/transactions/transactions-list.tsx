import Link from "next/link"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { LitresDisplay, MoneyDisplay } from "@/components/shared/money-display"
import type { TransactionListRow } from "@/lib/data/transactions"

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
]

/** Transactions table with a plain GET filter form, so filters and paging work without client state. */
export function TransactionsList({
  rows,
  totalRows,
  pageSize,
  page,
  filters,
}: {
  rows: TransactionListRow[]
  totalRows: number
  pageSize: number
  page: number
  filters: { search?: string; status?: string; from?: string; to?: string }
}) {
  const pages = Math.max(Math.ceil(totalRows / pageSize), 1)
  const link = (p: number) => {
    const q = new URLSearchParams({ ...(filters.search ? { search: filters.search } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.from ? { from: filters.from } : {}), ...(filters.to ? { to: filters.to } : {}), page: String(p) })
    return `/transactions?${q}`
  }

  return (
    <div className="flex flex-col gap-5">
      <form method="get" className="grid gap-3 rounded-xl border border-[#E4E7F2] bg-white p-4 sm:grid-cols-5">
        <input name="search" defaultValue={filters.search} placeholder="Reference, ticket, vehicle" className="rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm sm:col-span-2" />
        <select name="status" defaultValue={filters.status ?? ""} className="rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" name="from" defaultValue={filters.from} className="rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm" />
        <input type="date" name="to" defaultValue={filters.to} className="rounded-lg border border-[#E4E7F2] px-3 py-2 text-sm" />
        <div className="sm:col-span-5 flex justify-end">
          <button type="submit" className="rounded-lg bg-[#1226AA] px-4 py-2 text-sm font-medium text-white">Apply filters</button>
        </div>
      </form>

      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<TransactionListRow>
          rows={rows}
          empty="No transactions match these filters."
          columns={[
            { header: "Reference", cell: (t) => <Link href={`/transactions/${t.id}`} className="font-semibold text-[#1226AA] hover:underline">{t.reference}</Link> },
            { header: "Happened", cell: (t) => t.happenedAt.slice(0, 16) },
            { header: "Customer / Vehicle", cell: (t) => <span>{t.customer ?? "—"}<span className="text-muted-foreground"> · {t.vehicle ?? "—"}</span></span> },
            { header: "Station", cell: (t) => t.station ?? "—" },
            { header: "Litres", cell: (t) => (t.litres ? <LitresDisplay litres={t.litres} /> : "—") },
            { header: "Amount", cell: (t) => (t.amount ? <MoneyDisplay amount={t.amount} /> : "—") },
            { header: "Status", cell: (t) => <StatusBadge status={t.status === "COMPLETED" ? "COMPLETED" : t.status === "FAILED" ? "FAILED" : "PENDING"} /> },
          ]}
        />
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalRows} transaction{totalRows === 1 ? "" : "s"}</span>
          <div className="flex gap-2">
            {page > 0 && <Link href={link(page - 1)} className="rounded-lg border px-3 py-1.5 hover:bg-[#F6F7FB]">Previous</Link>}
            <span className="px-2 py-1.5">Page {page + 1} of {pages}</span>
            {page + 1 < pages && <Link href={link(page + 1)} className="rounded-lg border px-3 py-1.5 hover:bg-[#F6F7FB]">Next</Link>}
          </div>
        </div>
      </div>
    </div>
  )
}
