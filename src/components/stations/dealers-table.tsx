"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { DealerFormDialog } from "@/components/stations/dealer-form-dialog"
import type { DealerListRow } from "@/lib/data/dealers"

export function DealersTable({ dealers, canManage }: { dealers: DealerListRow[]; canManage: boolean }) {
  const columns: ColumnDef<DealerListRow>[] = [
    { header: "Dealer", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
    { header: "Contact", cell: ({ row }) => row.original.contactName ?? "—" },
    { header: "Phone", cell: ({ row }) => row.original.contactPhone ?? "—" },
    { header: "Email", cell: ({ row }) => row.original.contactEmail ?? "—" },
    { header: "Settlement account", cell: ({ row }) => row.original.settlementAccount ?? "—" },
    { header: "Stations", cell: ({ row }) => row.original._count.stations },
    ...(canManage
      ? [{
          header: "Actions",
          cell: ({ row }: { row: { original: DealerListRow } }) => (
            <DealerFormDialog
              trigger={<Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.original.name}`} />}
              triggerContent={<Pencil className="size-4" />}
              dealer={{
                id: row.original.id,
                name: row.original.name,
                contactName: row.original.contactName ?? "",
                contactPhone: row.original.contactPhone ?? "",
                contactEmail: row.original.contactEmail ?? "",
                settlementAccount: row.original.settlementAccount ?? "",
              }}
            />
          ),
        } as ColumnDef<DealerListRow>]
      : []),
  ]

  return <DataTable columns={columns} data={dealers} emptyTitle="No dealers yet" emptyDescription="Add a dealer before onboarding their stations." />
}
