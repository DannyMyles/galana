"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { TransactionStatus } from "@prisma/client"

export interface RecentTransactionRow {
  id: string
  reference: string
  createdAt: Date
  station: { name: string }
  totalAmount: unknown
  status: TransactionStatus
}

const columns: ColumnDef<RecentTransactionRow>[] = [
  {
    header: "Date & Time",
    accessorKey: "createdAt",
    cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} />,
  },
  { header: "Ticket No.", accessorKey: "reference" },
  {
    header: "Station",
    cell: ({ row }) => row.original.station.name,
  },
  {
    header: "Amount (KES)",
    cell: ({ row }) =>
      row.original.totalAmount ? <MoneyDisplay amount={String(row.original.totalAmount)} /> : "—",
  },
  {
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

export function RecentTransactionsTable({ rows }: { rows: RecentTransactionRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No transactions yet"
      emptyDescription="Completed and pending fuelling transactions will appear here."
    />
  )
}
