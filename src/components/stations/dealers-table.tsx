"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye } from "@/components/icons"
import { RowActions } from "@/components/shared/row-actions"
import { EditTrigger } from "@/components/shared/icon-action-button"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { DealerFormDialog } from "@/components/stations/dealer-form-dialog"
import type { DealerListRow } from "@/lib/data/dealers"

export function DealersTable({ dealers, canManage }: { dealers: DealerListRow[]; canManage: boolean }) {
  const columns: ColumnDef<DealerListRow>[] = [
    { header: "Dealer", cell: ({ row }) => <Link href={`/stations/dealers/${row.original.id}`} className="font-semibold hover:text-[#1226AA] hover:underline">{row.original.name}</Link> },
    { header: "Contact", cell: ({ row }) => row.original.contactName ?? "—" },
    { header: "Phone", cell: ({ row }) => row.original.contactPhone ?? "—" },
    { header: "Email", cell: ({ row }) => row.original.contactEmail ?? "—" },
    { header: "Settlement account", cell: ({ row }) => row.original.settlementAccount ?? "—" },
    { header: "Stations", cell: ({ row }) => row.original._count.stations },
    actionsColumn<DealerListRow>((d) => (
      <RowActions actions={[{ label: "View dealer", icon: Eye, href: `/stations/dealers/${d.id}` }]}>
        {canManage && (
          <DealerFormDialog
            trigger={<EditTrigger label={`Edit ${d.name}`} />}
            dealer={{ id: d.id, name: d.name, contactName: d.contactName ?? "", contactPhone: d.contactPhone ?? "", contactEmail: d.contactEmail ?? "", settlementAccount: d.settlementAccount ?? "" }}
          />
        )}
      </RowActions>
    )),
  ]

  return <DataTable columns={columns} data={dealers} emptyTitle="No dealers yet" emptyDescription="Add a dealer before onboarding their stations." />
}
