"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import type { DealerListRow } from "@/lib/data/dealers"

const columns: ColumnDef<DealerListRow>[] = [
  { header: "Dealer Name", accessorKey: "name" },
  { header: "Contact", cell: ({ row }) => row.original.contactName ?? "—" },
  { header: "Phone", cell: ({ row }) => row.original.contactPhone ?? "—" },
  { header: "Email", cell: ({ row }) => row.original.contactEmail ?? "—" },
  { header: "Stations", cell: ({ row }) => row.original._count.stations },
]

export function DealersTable({ dealers }: { dealers: DealerListRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={dealers}
      emptyTitle="No dealers yet"
      emptyDescription="Add a dealer before onboarding their stations."
    />
  )
}
