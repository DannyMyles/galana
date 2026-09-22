"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateDisplay } from "@/components/shared/date-time-display"
import { StatusBadge } from "@/components/shared/status-badge"
import type { EpraPriceListRow } from "@/lib/data/epra-prices"

const columns: ColumnDef<EpraPriceListRow>[] = [
  { header: "Product", cell: ({ row }) => row.original.product.name },
  {
    header: "Price per Litre",
    cell: ({ row }) => <MoneyDisplay amount={String(row.original.pricePerLitre)} />,
  },
  { header: "Effective From", cell: ({ row }) => <DateDisplay value={row.original.effectiveFrom} /> },
  {
    header: "Effective To",
    cell: ({ row }) =>
      row.original.effectiveTo ? <DateDisplay value={row.original.effectiveTo} /> : <StatusBadge status="ACTIVE" />,
  },
]

export function EpraPricesTable({ prices }: { prices: EpraPriceListRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={prices}
      emptyTitle="No prices configured"
      emptyDescription="Add the current EPRA price for each fuel product."
    />
  )
}
