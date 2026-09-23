"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import type { TopUpRequestRow } from "@/lib/data/wallet"

const columns: ColumnDef<TopUpRequestRow>[] = [
  { header: "Date & time", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
  { header: "Reference", cell: ({ row }) => <span className="font-semibold">{row.original.reference}</span> },
  { header: "Amount", cell: ({ row }) => <MoneyDisplay amount={String(row.original.amount)} /> },
  { header: "Account", accessorKey: "fundingAccount" },
  { header: "Requested by", cell: ({ row }) => row.original.maker.name },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    header: "Decision",
    cell: ({ row }) =>
      row.original.checker ? (
        <span className="block max-w-[220px] truncate text-sm text-muted-foreground" title={row.original.checkerComment ?? ""}>
          {row.original.checker.name}{row.original.checkerComment ? ` — ${row.original.checkerComment}` : ""}
        </span>
      ) : (
        "—"
      ),
  },
]

export function FundingHistoryTable({ rows }: { rows: TopUpRequestRow[] }) {
  return (
    <div>
      <FilterBar>
        <SearchFilter placeholder="Search reference, account or remarks…" />
        <SelectFilter param="status" placeholder="All statuses" options={[{ value: "PENDING_APPROVAL", label: "Pending approval" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} />
        <div className="ml-auto"><ExportButton dataset="funding" /></div>
      </FilterBar>
      <DataTable columns={columns} data={rows} emptyTitle="No funding history found" emptyDescription="Top-up requests and their approval status appear here — searchable and exportable." />
    </div>
  )
}
