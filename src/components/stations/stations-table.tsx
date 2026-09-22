"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { StationStatusMenu } from "@/components/stations/station-status-menu"
import type { StationListRow } from "@/lib/data/stations"

const columns: ColumnDef<StationListRow>[] = [
  { header: "Station Name", accessorKey: "name" },
  { header: "Code", accessorKey: "code" },
  { header: "Region", accessorKey: "region" },
  { header: "County", accessorKey: "county" },
  {
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    header: "Actions",
    cell: ({ row }) => (
      <StationStatusMenu stationId={row.original.id} status={row.original.status} />
    ),
  },
]

export function StationsTable({
  rows,
  totalRows,
  pageSize,
}: {
  rows: StationListRow[]
  totalRows: number
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageIndex = Number(searchParams.get("page") ?? 0)

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No stations found"
      emptyDescription="Try adjusting your search or filters, or add a new station."
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
  )
}
