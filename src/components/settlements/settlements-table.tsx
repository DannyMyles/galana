"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import type { SettlementListRow } from "@/lib/data/settlements"
import { markSettlementSettled } from "@/app/(portal)/settlements/actions"

export function SettlementsTable({
  rows,
  totalRows,
  pageSize,
}: {
  rows: SettlementListRow[]
  totalRows: number
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageIndex = Number(searchParams.get("page") ?? 0)

  async function handleSettle(id: string) {
    try {
      await markSettlementSettled(id)
      toast.success("Settlement marked as settled.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settlement.")
    }
  }

  const columns: ColumnDef<SettlementListRow>[] = [
    { header: "Date", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Station", cell: ({ row }) => row.original.station.name },
    { header: "Transaction Ref", cell: ({ row }) => row.original.transaction.reference },
    { header: "Gross Amount", cell: ({ row }) => <MoneyDisplay amount={String(row.original.grossAmount)} /> },
    {
      header: "Net Payable",
      cell: ({ row }) => <MoneyDisplay amount={String(row.original.netPayableToDealer)} />,
    },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Action",
      cell: ({ row }) =>
        row.original.status === "PENDING" ? (
          <ConfirmDialog
            trigger={<Button size="sm">Mark Settled</Button>}
            title="Mark this settlement as settled?"
            description="This confirms the dealer has been paid for this transaction."
            onConfirm={() => handleSettle(row.original.id)}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No settlements yet"
      emptyDescription="Dealer settlements are created automatically when a transaction completes."
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
