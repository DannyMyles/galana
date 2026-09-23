"use client"

import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FilterBar, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import type { SettlementListRow } from "@/lib/data/settlements"
import { markSettlementSettled } from "@/app/(portal)/settlements/actions"
import { RowActions } from "@/components/shared/row-actions"
import { Eye } from "@/components/icons"
import { CheckCircle2 } from "@/components/icons"
import { IconActionButton } from "@/components/shared/icon-action-button"

export function SettlementsTable({ rows, totalRows, pageSize, stations, canManage }: { rows: SettlementListRow[]; totalRows: number; pageSize: number; stations?: { id: string; name: string }[]; canManage: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
    { header: "Transaction", cell: ({ row }) => <Link href={`/transactions/${row.original.transaction.id}`} className="font-semibold text-[#1226AA] hover:underline">{row.original.transaction.reference}</Link> },
    { header: "Gross", cell: ({ row }) => <MoneyDisplay amount={Number(row.original.grossAmount)} /> },
    { header: "Under-canopy", cell: ({ row }) => <span className="text-[#D01A2F]">− <MoneyDisplay amount={Number(row.original.underCanopyDiscount)} /></span> },
    { header: "Net payable", cell: ({ row }) => <span className="font-semibold"><MoneyDisplay amount={Number(row.original.netPayableToDealer)} /></span> },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    actionsColumn<SettlementListRow>((r) => (
      <RowActions actions={[{ label: "View settlement", icon: Eye, href: `/settlements/${r.id}` }]}>
        {canManage && r.status === "PENDING" && (
          <ConfirmDialog trigger={<IconActionButton label="Mark settled" icon={CheckCircle2} />} title="Mark this settlement as settled?" description="This confirms the dealer has been paid for this transaction." confirmLabel="Mark settled" onConfirm={() => handleSettle(r.id)} />
        )}
      </RowActions>
    )),
  ]

  return (
    <div>
      <FilterBar>
        <SelectFilter param="status" placeholder="All statuses" options={[{ value: "PENDING", label: "Pending" }, { value: "SETTLED", label: "Settled" }, { value: "REVERSED", label: "Reversed" }]} />
        {stations && <SelectFilter param="stationId" placeholder="All stations" options={stations.map((s) => ({ value: s.id, label: s.name }))} />}
        <div className="ml-auto"><ExportButton dataset="settlements" /></div>
      </FilterBar>
      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No settlements found"
        emptyDescription="Dealer settlements are created automatically when a transaction completes."
        pagination={{
          pageIndex: Number(searchParams.get("page") ?? 0),
          pageSize,
          totalRows,
          onPageChange: (next) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("page", String(next))
            router.push(`${pathname}?${params}`)
          },
        }}
      />
    </div>
  )
}
