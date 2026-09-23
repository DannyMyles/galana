"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { DateFilter, FilterBar, SearchFilter, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import type { TransactionListRow } from "@/lib/data/transactions"
import { RowActions } from "@/components/shared/row-actions"
import { Eye } from "@/components/icons"

const STATUSES = [
  "INITIATED", "TICKET_VALIDATED", "FUEL_AUTHORISATION_PENDING", "AUTHORISED", "FUELLING_IN_PROGRESS", "COMPLETED",
  "REJECTED", "CANCELLED", "EXPIRED", "FAILED", "REVERSED", "PENDING_RECONCILIATION",
].map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") }))

const columns: ColumnDef<TransactionListRow>[] = [
  { header: "Date & time", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
  {
    header: "Reference",
    cell: ({ row }) => (
      <Link href={`/transactions/${row.original.id}`} className="font-semibold text-[#1226AA] hover:underline">
        {row.original.reference}
      </Link>
    ),
  },
  { header: "Station", cell: ({ row }) => row.original.station.name },
  { header: "Customer", cell: ({ row }) => row.original.ticket.customer.name },
  { header: "Vehicle", cell: ({ row }) => row.original.ticket.vehicle?.regNo ?? "—" },
  { header: "Amount", cell: ({ row }) => (row.original.totalAmount ? <MoneyDisplay amount={String(row.original.totalAmount)} /> : "—") },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    header: "Reason",
    cell: ({ row }) =>
      row.original.failureReason ? (
        <span className="block max-w-[220px] truncate text-xs text-[#D01A2F]" title={row.original.failureReason}>
          {row.original.failureReason}
        </span>
      ) : (
        "—"
      ),
  },
  actionsColumn<TransactionListRow>((r) => <RowActions actions={[{ label: "View trace", icon: Eye, href: `/transactions/${r.id}` }]} />),
]

export function TransactionsTable({
  rows,
  totalRows,
  pageSize,
  stations,
}: {
  rows: TransactionListRow[]
  totalRows: number
  pageSize: number
  stations?: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div>
      <FilterBar>
        <SearchFilter placeholder="Search reference, ticket or vehicle…" />
        <SelectFilter param="status" placeholder="All statuses" options={STATUSES} />
        {stations && <SelectFilter param="stationId" placeholder="All stations" options={stations.map((s) => ({ value: s.id, label: s.name }))} />}
        <DateFilter />
        <ExportButton dataset="transactions" />
      </FilterBar>
      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No transactions found"
        emptyDescription="Adjust the filters, or wait for fuelling activity to appear here."
        pagination={{
          pageIndex: Number(searchParams.get("page") ?? 0),
          pageSize,
          totalRows,
          onPageChange: (next) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("page", String(next))
            router.push(`${pathname}?${params}`)
          },
        }}
      />
    </div>
  )
}
