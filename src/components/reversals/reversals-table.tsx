"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { ApprovalActionBar } from "@/components/shared/approval-action-bar"
import { FilterBar, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import { decideReversal } from "@/app/(portal)/reversals/actions"

export interface ReversalRow {
  id: string
  status: string
  reason: string
  decisionComment: string | null
  createdAt: Date
  requestedById: string
  requestedBy: { name: string }
  decidedBy: { name: string } | null
  transaction: { id: string; reference: string; totalAmount: unknown }
}

export function ReversalsTable({ rows, canApprove, currentUserId }: { rows: ReversalRow[]; canApprove: boolean; currentUserId: string }) {
  const router = useRouter()

  async function decide(id: string, approve: boolean, comment: string) {
    try {
      await decideReversal(id, approve, comment)
      toast.success(approve ? "Reversal approved — balances restored." : "Reversal rejected.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record decision.")
    }
  }

  const columns: ColumnDef<ReversalRow>[] = [
    { header: "Requested", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Transaction", cell: ({ row }) => <Link href={`/transactions/${row.original.transaction.id}`} className="font-semibold text-[#1226AA] hover:underline">{row.original.transaction.reference}</Link> },
    { header: "Amount", cell: ({ row }) => (row.original.transaction.totalAmount ? <MoneyDisplay amount={Number(row.original.transaction.totalAmount)} /> : "—") },
    { header: "Reason", cell: ({ row }) => <span className="block max-w-[260px] truncate" title={row.original.reason}>{row.original.reason}</span> },
    { header: "Requested by", cell: ({ row }) => row.original.requestedBy.name },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Decision",
      cell: ({ row }) =>
        row.original.status === "PENDING_APPROVAL" ? (
          canApprove ? (
            <ApprovalActionBar
              disabled={row.original.requestedById === currentUserId}
              disabledReason="You requested this reversal, so another checker must decide it."
              onApprove={(c) => decide(row.original.id, true, c)}
              onReject={(r) => decide(row.original.id, false, r)}
            />
          ) : (
            <span className="text-sm text-muted-foreground">Awaiting checker</span>
          )
        ) : (
          <span className="text-sm text-muted-foreground">{row.original.decidedBy?.name ?? "—"}{row.original.decisionComment ? ` — ${row.original.decisionComment}` : ""}</span>
        ),
    },
  ]

  return (
    <div>
      <FilterBar>
        <SelectFilter param="status" placeholder="All statuses" options={[{ value: "PENDING_APPROVAL", label: "Pending approval" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} />
        <div className="ml-auto"><ExportButton dataset="reversals" /></div>
      </FilterBar>
      <DataTable columns={columns} data={rows} emptyTitle="No reversals" emptyDescription="Reversal requests for completed transactions appear here for approval." />
    </div>
  )
}
