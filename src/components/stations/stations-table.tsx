"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { StationStatusMenu } from "@/components/stations/station-status-menu"
import { StationFormDialog } from "@/components/stations/station-form-dialog"
import type { StationListRow } from "@/lib/data/stations"

export function StationsTable({
  rows,
  totalRows,
  pageSize,
  dealers,
  products,
}: {
  rows: StationListRow[]
  totalRows: number
  pageSize: number
  dealers: { id: string; name: string }[]
  products: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const columns: ColumnDef<StationListRow>[] = [
    {
      header: "Station",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.code} · {row.original.county}</p>
        </div>
      ),
    },
    { header: "Dealer", cell: ({ row }) => row.original.dealer?.name ?? "—" },
    { header: "Region", accessorKey: "region" },
    {
      header: "Products",
      cell: ({ row }) => (
        <span className="block max-w-[180px] truncate text-xs" title={row.original.products.map((p) => p.product.name).join(", ")}>
          {row.original.products.map((p) => p.product.name.replace(/\s*\(.*\)/, "")).join(", ") || "—"}
        </span>
      ),
    },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "JPL OMC sync",
      cell: ({ row }) => <StatusBadge status={row.original.jplSyncStatus} />,
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <StationFormDialog
            dealers={dealers}
            products={products}
            station={{
              id: row.original.id,
              name: row.original.name,
              code: row.original.code,
              region: row.original.region,
              county: row.original.county,
              address: row.original.address,
              latitude: row.original.latitude,
              longitude: row.original.longitude,
              contactName: row.original.contactName,
              contactPhone: row.original.contactPhone,
              contactEmail: row.original.contactEmail,
              dealerId: row.original.dealerId,
              productIds: row.original.products.map((p) => p.productId),
            }}
            trigger={<Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.original.name}`} />}
            triggerContent={<Pencil className="size-4" />}
          />
          <StationStatusMenu stationId={row.original.id} status={row.original.status} />
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No stations found"
      emptyDescription="Try adjusting your search or filters, or add a new station."
      pagination={{
        pageIndex: Number(searchParams.get("page") ?? 0),
        pageSize,
        totalRows,
        onPageChange: (next) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set("page", String(next))
          router.push(`${pathname}?${params.toString()}`)
        },
      }}
    />
  )
}
