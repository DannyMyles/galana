import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { requirePermission } from "@/lib/rbac/guard"
import { listSettlements, type SettlementRow } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export default async function SettlementsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission(["settlements:view", "settlements:manage"])
  const raw = await searchParams
  const page = Math.max(Number(raw.page ?? 0) || 0, 0)
  const result = await listSettlements({ search: raw.search, station: raw.station, fromDate: raw.from, toDate: raw.to, page })
  const rows = toPlain(result.rows as SettlementRow[])
  const pages = Math.max(Math.ceil(result.totalRows / result.pageSize), 1)
  const r = result.rates

  return (
    <div>
      <PageHeader title="Dealer Settlements" description="One settlement line per completed fuelling, with the discounts and the net payable to the dealer." />
      <p className="mb-5 rounded-xl bg-[#EEF2FF] px-4 py-3 text-sm text-[#3B3E63]">
        Discounts are per litre{r ? ` (under-canopy KES ${r.under_canopy}/L, Jaguar KES ${r.jaguar}/L)` : ""}. The under-canopy discount is deducted from the dealer. The Jaguar discount is raised as a credit note only. Nothing is posted.
      </p>
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<SettlementRow>
          rows={rows}
          empty="No completed fuellings to settle."
          columns={[
            { header: "Reference", cell: (s) => <Link href={`/settlements/${s.id}`} className="font-semibold text-[#1226AA] hover:underline">{s.reference}</Link> },
            { header: "Date", cell: (s) => s.date },
            { header: "Station", cell: (s) => s.station },
            { header: "Litres", cell: (s) => <LitresDisplay litres={s.litres} /> },
            { header: "Gross", cell: (s) => <MoneyDisplay amount={s.gross} /> },
            { header: "Under-canopy (deducted)", cell: (s) => <MoneyDisplay amount={s.underCanopyDiscount} /> },
            { header: "Net to dealer", cell: (s) => <MoneyDisplay amount={s.netPayableToDealer} /> },
            { header: "Jaguar credit note", cell: (s) => <MoneyDisplay amount={s.jaguarDiscount} /> },
            { header: "Status", cell: () => <StatusBadge status="PENDING" /> },
          ]}
        />
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          {page > 0 && <a href={`/settlements?page=${page - 1}`} className="rounded-lg border px-3 py-1.5">Previous</a>}
          <span className="px-2">Page {page + 1} of {pages}</span>
          {page + 1 < pages && <a href={`/settlements?page=${page + 1}`} className="rounded-lg border px-3 py-1.5">Next</a>}
        </div>
      </div>
    </div>
  )
}
