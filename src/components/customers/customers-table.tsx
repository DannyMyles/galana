"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { MoneyDisplay } from "@/components/shared/money-display"
import type { CustomerListRow } from "@/lib/data/customers"

const columns: ColumnDef<CustomerListRow>[] = [
  {
    header: "Customer",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  { header: "Tier", cell: ({ row }) => row.original.tier ?? "—" },
  {
    header: "Wallet Balance",
    cell: ({ row }) => (row.original.wallet ? <MoneyDisplay amount={String(row.original.wallet.balance)} /> : "—"),
  },
  { header: "Vehicles", cell: ({ row }) => row.original._count.vehicles },
  { header: "Tickets", cell: ({ row }) => row.original._count.tickets },
]

export function CustomersTable({ customers }: { customers: CustomerListRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={customers}
      emptyTitle="No customers yet"
      emptyDescription="Customers are onboarded via the Jaguar integration."
    />
  )
}
