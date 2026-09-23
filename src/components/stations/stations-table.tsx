"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, CheckCircle2, X as Ban } from "@/components/icons"
import type { StationStatus } from "@prisma/client"
import { setStationStatus } from "@/app/(portal)/stations/actions"
import { RowActions } from "@/components/shared/row-actions"
import { EditTrigger } from "@/components/shared/icon-action-button"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { StationFormDialog } from "@/components/stations/station-form-dialog"
import type { StationListRow } from "@/lib/data/stations"

const STATUS_TRANSITIONS: Record<StationStatus, { label: string; next: StationStatus }[]> = {
  ACTIVE: [{ label: "Suspend", next: "SUSPENDED" }, { label: "Deactivate", next: "DEACTIVATED" }],
  SUSPENDED: [{ label: "Reactivate", next: "ACTIVE" }, { label: "Deactivate", next: "DEACTIVATED" }],
  DEACTIVATED: [{ label: "Reactivate", next: "ACTIVE" }],
}

export function StationsTable({
  rows,
  totalRows,
  pageSize,
  dealers,
  products,
  canManage = true,
}: {
  rows: StationListRow[]
  totalRows: number
  pageSize: number
  dealers: { id: string; name: string }[]
  products: { id: string; name: string }[]
  canManage?: boolean
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
    actionsColumn<StationListRow>((r) => (
      <RowActions
        actions={[
          { label: "View station", icon: Eye, href: `/stations/${r.id}` },
          ...(canManage ? STATUS_TRANSITIONS[r.status as StationStatus] : []).map((t) => ({
            label: t.label,
            icon: t.next === "ACTIVE" ? CheckCircle2 : Ban,
            destructive: t.next === "DEACTIVATED",
            menuOnly: true,
            onSelect: async () => {
              await setStationStatus(r.id, t.next)
              router.refresh()
            },
          })),
        ]}
      >
        {canManage && (
          <StationFormDialog
            dealers={dealers}
            products={products}
            station={{
              id: r.id,
              name: r.name,
              code: r.code,
              region: r.region,
              county: r.county,
              address: r.address,
              latitude: r.latitude,
              longitude: r.longitude,
              contactName: r.contactName,
              contactPhone: r.contactPhone,
              contactEmail: r.contactEmail,
              dealerId: r.dealerId,
              productIds: r.products.map((p) => p.productId),
            }}
            trigger={<EditTrigger label={`Edit ${r.name}`} />}
          />
        )}
      </RowActions>
    )),
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
