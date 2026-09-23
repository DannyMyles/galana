"use client"

import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { ApprovalActionBar } from "@/components/shared/approval-action-bar"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { StatusBadge } from "@/components/shared/status-badge"
import type { TopUpRequestRow } from "@/lib/data/wallet"
import { approveTopUpRequest, rejectTopUpRequest } from "@/app/(portal)/funding-wallet/actions"
import { RowActions } from "@/components/shared/row-actions"
import { Eye } from "@/components/icons"

export function PendingApprovalsTable({
  rows,
  currentUserId,
}: {
  rows: TopUpRequestRow[]
  currentUserId: string
}) {
  const router = useRouter()

  async function handleApprove(id: string, comment: string) {
    try {
      await approveTopUpRequest(id, comment)
      toast.success("Top-up approved and wallet balance updated.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve request.")
    }
  }

  async function handleReject(id: string, reason: string) {
    try {
      await rejectTopUpRequest(id, reason)
      toast.success("Top-up request rejected.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject request.")
    }
  }

  const columns: ColumnDef<TopUpRequestRow>[] = [
    { header: "Date & Time", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Reference", accessorKey: "reference" },
    {
      header: "Amount (KES)",
      cell: ({ row }) => <MoneyDisplay amount={String(row.original.amount)} />,
    },
    { header: "Account", accessorKey: "fundingAccount" },
    { header: "Requested by", cell: ({ row }) => row.original.maker.name },
    {
      header: "Remarks",
      cell: ({ row }) => <span className="block max-w-[200px] truncate" title={row.original.remarks ?? ""}>{row.original.remarks || "—"}</span>,
    },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Action",
      cell: ({ row }) =>
        row.original.status === "PENDING_APPROVAL" ? (
          <ApprovalActionBar
            disabled={row.original.makerId === currentUserId}
            disabledReason="You created this request, so another checker must approve it."
            onApprove={(comment) => handleApprove(row.original.id, comment)}
            onReject={(reason) => handleReject(row.original.id, reason)}
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {row.original.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
            {row.original.checker?.name ?? "—"}
          </span>
        ),
    },
    actionsColumn<TopUpRequestRow>((r) => <RowActions actions={[{ label: "View request", icon: Eye, href: `/funding-wallet/${r.id}` }]} />),
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyTitle="No pending top-up requests"
      emptyDescription="New requests submitted by Finance Makers will appear here for approval."
    />
  )
}
