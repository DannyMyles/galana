"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { RefreshCw } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, CheckCircle2 } from "@/components/icons"
import { RowActions } from "@/components/shared/row-actions"
import { DataTable, actionsColumn } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { ReconciliationRow } from "@/lib/data/reconciliation"
import { runReconciliationCheck, resolveReconciliationRecord } from "@/app/(portal)/reconciliation/actions"
import { LoadingButton } from "@/components/shared/loading-button"

interface Details { subject?: string; expected?: string; actual?: string }

export function ReconciliationTable({ rows, canManage }: { rows: ReconciliationRow[]; canManage: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [running, setRunning] = useState(false)
  const [resolving, setResolving] = useState<ReconciliationRow | null>(null)
  const [notes, setNotes] = useState("")

  async function handleRun() {
    setRunning(true)
    try {
      const r = await runReconciliationCheck()
      toast.success(`Checked ${r.checked} items — ${r.matched} matched, ${r.exceptions} exceptions${r.ambiguous ? `, ${r.ambiguous} ambiguous transaction(s) queued` : ""}.`)
      startTransition(() => router.refresh())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reconciliation failed.")
    } finally {
      setRunning(false)
    }
  }

  async function handleResolve() {
    if (!resolving) return
    try {
      await resolveReconciliationRecord(resolving.id, notes)
      toast.success("Exception resolved and recorded in the audit trail.")
      setResolving(null)
      setNotes("")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resolve.")
    }
  }

  const d = (row: ReconciliationRow) => (row.details ?? {}) as Details

  const columns: ColumnDef<ReconciliationRow>[] = [
    { header: "Checked", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Level", cell: ({ row }) => row.original.level.charAt(0) + row.original.level.slice(1).toLowerCase() },
    { header: "Subject", cell: ({ row }) => <span className="font-medium">{d(row.original).subject ?? row.original.transaction?.reference ?? "—"}</span> },
    { header: "Expected", cell: ({ row }) => <span className="block max-w-[220px] truncate text-xs" title={d(row.original).expected}>{d(row.original).expected ?? "—"}</span> },
    { header: "Found", cell: ({ row }) => <span className="block max-w-[220px] truncate text-xs" title={d(row.original).actual}>{d(row.original).actual ?? "—"}</span> },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Resolution",
      cell: ({ row }) =>
        row.original.status === "EXCEPTION" ? (
          <span className="text-sm text-[#D01A2F]">Open exception</span>
        ) : row.original.status === "RESOLVED" ? (
          <span className="block max-w-[240px] truncate text-sm text-muted-foreground" title={row.original.resolutionNotes ?? ""}>{row.original.resolutionNotes}</span>
        ) : <span className="text-sm text-muted-foreground">—</span>,
    },
    actionsColumn<ReconciliationRow>((r) => (
      <RowActions
        actions={[
          { label: "Resolve exception", icon: CheckCircle2, hidden: !(canManage && r.status === "EXCEPTION"), onSelect: () => setResolving(r) },
          { label: "View transaction", icon: Eye, hidden: !r.transaction, href: r.transaction ? `/transactions/${r.transaction.id}` : undefined },
        ]}
      />
    )),
  ]

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <LoadingButton onClick={handleRun} loading={running || isPending} loadingText="Running…">
            <RefreshCw className="size-4" />
            Run reconciliation
          </LoadingButton>
        </div>
      )}
      <DataTable columns={columns} data={rows} emptyTitle="Nothing reconciled yet" emptyDescription="Run a reconciliation to compare tickets, transactions and the financial ledger." />

      <Dialog open={!!resolving} onOpenChange={(o) => !o && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve exception</DialogTitle>
            <DialogDescription>{resolving ? `${d(resolving).subject}: expected ${d(resolving).expected}, found ${d(resolving).actual}.` : ""}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="res-notes">How was it resolved?</Label>
            <Textarea id="res-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Record the investigation and the corrective action" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>Cancel</Button>
            <Button disabled={notes.trim().length < 5} onClick={handleResolve}>Mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
