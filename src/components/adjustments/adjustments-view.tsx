"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Plus } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { ApprovalActionBar } from "@/components/shared/approval-action-bar"
import { FilterBar, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import { createAdjustment, decideAdjustment } from "@/app/(portal)/adjustments/actions"

export interface AdjustmentRow {
  id: string
  direction: "CREDIT" | "DEBIT"
  amount: unknown
  reason: string
  status: string
  createdAt: Date
  makerId: string
  maker: { name: string }
  checker: { name: string } | null
  checkerComment: string | null
}

function RequestDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await createAdjustment({ direction, amount: Number(amount), reason })
      toast.success("Adjustment submitted for approval.")
      setOpen(false); setAmount(""); setReason("")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not request adjustment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" />Request adjustment</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request wallet adjustment</DialogTitle>
          <DialogDescription>Manual changes to the fuel wallet need a reason and a second person&apos;s approval, and stay visible to auditors.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => v && setDirection(v as "CREDIT" | "DEBIT")}>
                <SelectTrigger className="w-full"><SelectValue>{(v: string) => (v === "CREDIT" ? "Credit (add to wallet)" : "Debit (remove from wallet)")}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (add to wallet)</SelectItem>
                  <SelectItem value="DEBIT">Debit (remove from wallet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label htmlFor="adj-amount">Amount (KES)</Label><Input id="adj-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          </div>
          <div className="grid gap-2"><Label htmlFor="adj-reason">Reason</Label><Textarea id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this correction needed?" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy || !(Number(amount) > 0) || reason.trim().length < 5} onClick={submit}>{busy ? "Submitting…" : "Submit for approval"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdjustmentsView({ rows, canCreate, canApprove, currentUserId }: { rows: AdjustmentRow[]; canCreate: boolean; canApprove: boolean; currentUserId: string }) {
  const router = useRouter()

  async function decide(id: string, approve: boolean, comment: string) {
    try {
      await decideAdjustment(id, approve, comment)
      toast.success(approve ? "Adjustment approved and applied." : "Adjustment rejected.")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record decision.")
    }
  }

  const columns: ColumnDef<AdjustmentRow>[] = [
    { header: "Requested", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Direction", cell: ({ row }) => <span className={row.original.direction === "CREDIT" ? "font-medium text-[#068A70]" : "font-medium text-[#D01A2F]"}>{row.original.direction === "CREDIT" ? "+ Credit" : "− Debit"}</span> },
    { header: "Amount", cell: ({ row }) => <MoneyDisplay amount={Number(row.original.amount)} /> },
    { header: "Reason", cell: ({ row }) => <span className="block max-w-[280px] truncate" title={row.original.reason}>{row.original.reason}</span> },
    { header: "Requested by", cell: ({ row }) => row.original.maker.name },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Decision",
      cell: ({ row }) =>
        row.original.status === "PENDING_APPROVAL" ? (
          canApprove ? <ApprovalActionBar disabled={row.original.makerId === currentUserId} disabledReason="You requested this adjustment, so another checker must approve it." onApprove={(c) => decide(row.original.id, true, c)} onReject={(r) => decide(row.original.id, false, r)} /> : <span className="text-sm text-muted-foreground">Awaiting checker</span>
        ) : <span className="text-sm text-muted-foreground">{row.original.checker?.name ?? "—"}{row.original.checkerComment ? ` — ${row.original.checkerComment}` : ""}</span>,
    },
  ]

  return (
    <div>
      <FilterBar>
        <SelectFilter param="status" placeholder="All statuses" options={[{ value: "PENDING_APPROVAL", label: "Pending approval" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} />
        <div className="ml-auto flex items-center gap-2">
          <ExportButton dataset="adjustments" />
          {canCreate && <RequestDialog />}
        </div>
      </FilterBar>
      <DataTable columns={columns} data={rows} emptyTitle="No manual adjustments" emptyDescription="Manual wallet corrections and their approvals are listed here for audit." />
    </div>
  )
}
