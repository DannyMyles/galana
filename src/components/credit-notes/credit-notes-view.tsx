"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { ApprovalActionBar } from "@/components/shared/approval-action-bar"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import { createCreditNote, decideCreditNote } from "@/app/(portal)/credit-notes/actions"
import { RowActions } from "@/components/shared/row-actions"
import { Eye } from "@/components/icons"
import { LoadingButton } from "@/components/shared/loading-button"
import { AddButton } from "@/components/shared/add-button"

export interface CreditNoteRow {
  id: string
  type: string
  status: string
  amount: unknown
  reason: string | null
  reference: string | null
  createdAt: Date
  makerId: string | null
  maker: { name: string } | null
  checker: { name: string } | null
  checkerComment: string | null
  settlement: { transaction: { id: string; reference: string } } | null
}

const TYPE_LABEL: Record<string, string> = { MANUAL: "Manual", UNDER_CANOPY: "Under-canopy", CONTRACTUAL: "Jaguar contractual" }
const NONE = "__none__"

function RecordDialog({ settlements }: { settlements: { id: string; label: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [settlementId, setSettlementId] = useState(NONE)
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await createCreditNote({ settlementId: settlementId === NONE ? undefined : settlementId, amount: Number(amount), reason, reference })
      toast.success("Credit note recorded and sent for approval.")
      setOpen(false)
      setAmount(""); setReason(""); setReference(""); setSettlementId(NONE)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record credit note.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<AddButton label="Record credit note" />} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record credit note</DialogTitle>
          <DialogDescription>Linked to a settlement so Jaguar discounts trace back to the consumption they relate to.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Linked settlement</Label>
            <Select value={settlementId} onValueChange={(v) => v && setSettlementId(v)}>
              <SelectTrigger className="w-full"><SelectValue>{(v: string) => (v === NONE ? "Not linked to a settlement" : settlements.find((s) => s.id === v)?.label ?? v)}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not linked to a settlement</SelectItem>
                {settlements.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="cn-amount">Amount (KES)</Label><Input id="cn-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="cn-ref">Credit note no.</Label><Input id="cn-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div className="grid gap-2"><Label htmlFor="cn-reason">Reason</Label><Textarea id="cn-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <LoadingButton loading={busy} loadingText="Saving…" disabled={!(Number(amount) > 0) || !reason.trim()} onClick={submit}>Submit for approval</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CreditNotesView({ rows, settlements, canCreate, canApprove, currentUserId }: { rows: CreditNoteRow[]; settlements: { id: string; label: string }[]; canCreate: boolean; canApprove: boolean; currentUserId: string }) {
  const router = useRouter()

  async function decide(id: string, approve: boolean, comment: string) {
    try {
      await decideCreditNote(id, approve, comment)
      toast.success(approve ? "Credit note approved." : "Credit note rejected.")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record decision.")
    }
  }

  const columns: ColumnDef<CreditNoteRow>[] = [
    { header: "Raised", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Type", cell: ({ row }) => TYPE_LABEL[row.original.type] ?? row.original.type },
    { header: "Amount", cell: ({ row }) => <MoneyDisplay amount={Number(row.original.amount)} /> },
    { header: "Linked to", cell: ({ row }) => row.original.settlement ? <Link href={`/transactions/${row.original.settlement.transaction.id}`} className="font-semibold text-[#1226AA] hover:underline">{row.original.settlement.transaction.reference}</Link> : "—" },
    { header: "Reason", cell: ({ row }) => <span className="block max-w-[240px] truncate" title={row.original.reason ?? ""}>{row.original.reason ?? "—"}</span> },
    { header: "Raised by", cell: ({ row }) => row.original.maker?.name ?? "System (auto)" },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Decision",
      cell: ({ row }) =>
        row.original.status === "PENDING" ? (
          canApprove ? (
            <ApprovalActionBar disabled={row.original.makerId === currentUserId} disabledReason="You recorded this credit note, so another checker must approve it." onApprove={(c) => decide(row.original.id, true, c)} onReject={(r) => decide(row.original.id, false, r)} />
          ) : <span className="text-sm text-muted-foreground">Awaiting checker</span>
        ) : <span className="text-sm text-muted-foreground">{row.original.checker?.name ?? "—"}{row.original.checkerComment ? ` — ${row.original.checkerComment}` : ""}</span>,
    },
    actionsColumn<CreditNoteRow>((r) => <RowActions actions={[{ label: "View credit note", icon: Eye, href: `/credit-notes/${r.id}` }]} />),
  ]

  return (
    <div>
      <FilterBar>
        <SearchFilter placeholder="Search reason or credit note no…" />
        <SelectFilter param="status" placeholder="All statuses" options={[{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} />
        <SelectFilter param="type" placeholder="All types" options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
        <div className="ml-auto flex items-center gap-2">
          <ExportButton dataset="credit-notes" />
          {canCreate && <RecordDialog settlements={settlements} />}
        </div>
      </FilterBar>
      <DataTable columns={columns} data={rows} emptyTitle="No credit notes" emptyDescription="Discount credit notes are raised automatically when transactions complete; manual ones appear here too." />
    </div>
  )
}
