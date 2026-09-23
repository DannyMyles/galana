"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search } from "@/components/icons"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { TransactionListRow } from "@/lib/data/transactions"

const STATUSES = [
  "INITIATED",
  "TICKET_VALIDATED",
  "FUEL_AUTHORISATION_PENDING",
  "AUTHORISED",
  "FUELLING_IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
  "REVERSED",
  "PENDING_RECONCILIATION",
]

const columns: ColumnDef<TransactionListRow>[] = [
  { header: "Date & Time", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
  { header: "Reference", accessorKey: "reference" },
  { header: "Station", cell: ({ row }) => row.original.station.name },
  { header: "Customer", cell: ({ row }) => row.original.ticket.customer.name },
  { header: "Vehicle", cell: ({ row }) => row.original.ticket.vehicle?.regNo ?? "—" },
  {
    header: "Amount (KES)",
    cell: ({ row }) =>
      row.original.totalAmount ? <MoneyDisplay amount={String(row.original.totalAmount)} /> : "—",
  },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export function TransactionsTable({
  rows,
  totalRows,
  pageSize,
}: {
  rows: TransactionListRow[]
  totalRows: number
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const pageIndex = Number(searchParams.get("page") ?? 0)

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && updateParam("search", search || null)}
            onBlur={() => updateParam("search", search || null)}
          />
        </div>
        <Select
          value={searchParams.get("status") ?? undefined}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status[0] + status.slice(1).toLowerCase().replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No transactions found"
        emptyDescription="Completed and in-progress fuelling transactions will appear here."
        pagination={{
          pageIndex,
          pageSize,
          totalRows,
          onPageChange: (nextPage) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("page", String(nextPage))
            router.push(`${pathname}?${params.toString()}`)
          },
        }}
      />
    </div>
  )
}
