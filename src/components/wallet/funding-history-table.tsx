"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { TopUpRequestRow } from "@/lib/data/wallet"

const columns: ColumnDef<TopUpRequestRow>[] = [
  { header: "Date & Time", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
  { header: "Reference", accessorKey: "reference" },
  { header: "Amount (KES)", cell: ({ row }) => <MoneyDisplay amount={String(row.original.amount)} /> },
  { header: "Account", accessorKey: "fundingAccount" },
  { header: "Requested By", cell: ({ row }) => row.original.maker.name },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export function FundingHistoryTable({ rows }: { rows: TopUpRequestRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No funding history yet"
      emptyDescription="Top-up requests and their approval status will appear here."
    />
  )
}
