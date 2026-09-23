"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search } from "@/components/icons"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { LitresDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { TicketListRow } from "@/lib/data/tickets"
import { RowActions } from "@/components/shared/row-actions"
import { Eye } from "@/components/icons"

const STATUSES = ["ISSUED", "PARTIALLY_REDEEMED", "REDEEMED", "EXPIRED", "CANCELLED"]

const columns: ColumnDef<TicketListRow>[] = [
  { header: "Ticket No.", cell: ({ row }) => <Link href={`/fuel-tickets/${row.original.id}`} className="font-semibold text-[#1226AA] hover:underline">{row.original.ticketNo}</Link> },
  {
    header: "Customer / Vehicle",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.customer.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.vehicle?.regNo ?? "No vehicle"}</p>
      </div>
    ),
  },
  { header: "Product", cell: ({ row }) => row.original.product.name.replace(/\s*\(.*\)/, "") },
  {
    header: "Remaining / Auth.",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        <LitresDisplay litres={String(row.original.remainingQuantityL)} />
        <span className="text-muted-foreground"> / </span>
        <LitresDisplay litres={String(row.original.authorisedQuantityL)} />
      </span>
    ),
  },
  { header: "Expires", cell: ({ row }) => <DateTimeDisplay value={row.original.expiresAt} formatStr="dd MMM yyyy" /> },
  { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    header: "Fulfilment",
    cell: ({ row }) => {
      const t = row.original.transactions[0]
      return t ? (
        <Link href={`/transactions/${t.id}`} className="font-semibold text-[#1226AA] hover:underline">{t.reference}</Link>
      ) : (
        <span className="text-muted-foreground">Not redeemed</span>
      )
    },
  },
  actionsColumn<TicketListRow>((r) => <RowActions actions={[{ label: "View ticket", icon: Eye, href: `/fuel-tickets/${r.id}` }]} />),
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
