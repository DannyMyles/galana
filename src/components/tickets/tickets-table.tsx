"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { LitresDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { TicketListRow } from "@/lib/data/tickets"

const STATUSES = ["ISSUED", "PARTIALLY_REDEEMED", "REDEEMED", "EXPIRED", "CANCELLED"]

const columns: ColumnDef<TicketListRow>[] = [
  { header: "Ticket No.", accessorKey: "ticketNo" },
  { header: "Customer", cell: ({ row }) => row.original.customer.name },
  { header: "Vehicle Reg.", cell: ({ row }) => row.original.vehicle?.regNo ?? "—" },
  { header: "Product", cell: ({ row }) => row.original.product.name },
  {
    header: "Authorised Qty",
    cell: ({ row }) => <LitresDisplay litres={String(row.original.authorisedQuantityL)} />,
  },
  {
    header: "Remaining Qty",
    cell: ({ row }) => <LitresDisplay litres={String(row.original.remainingQuantityL)} />,
  },
  { header: "Expires", cell: ({ row }) => <DateTimeDisplay value={row.original.expiresAt} /> },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export function TicketsTable({
  rows,
  totalRows,
  pageSize,
}: {
  rows: TicketListRow[]
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
            placeholder="Search by ticket no. or vehicle reg..."
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
          <SelectTrigger className="w-full sm:w-48">
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
        emptyTitle="No tickets found"
        emptyDescription="Tickets issued by Jaguar will appear here once integration is live."
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
