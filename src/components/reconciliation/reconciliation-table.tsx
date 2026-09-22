"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import type { ReconciliationRow } from "@/lib/data/reconciliation"
import { runReconciliationCheck, resolveReconciliationRecord } from "@/app/(portal)/reconciliation/actions"

export function ReconciliationTable({ rows }: { rows: ReconciliationRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)

  async function handleRun() {
    setIsRunning(true)
    try {
      const result = await runReconciliationCheck()
      toast.success(
        `Checked ${result.checked} transactions — ${result.matched} matched, ${result.exceptions} exceptions.`
      )
      startTransition(() => router.refresh())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run reconciliation.")
    } finally {
      setIsRunning(false)
    }
  }

  async function handleResolve(id: string) {
    try {
      await resolveReconciliationRecord(id, "Resolved from reconciliation workspace.")
      toast.success("Marked as resolved.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resolve.")
    }
  }

  const columns: ColumnDef<ReconciliationRow>[] = [
    { header: "Checked At", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
    { header: "Level", cell: ({ row }) => row.original.level },
    { header: "Transaction Ref", cell: ({ row }) => row.original.transaction?.reference ?? "—" },
    { header: "Station", cell: ({ row }) => row.original.transaction?.station.name ?? "—" },
    { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Action",
      cell: ({ row }) =>
        row.original.status === "EXCEPTION" ? (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="outline">
                Mark Resolved
              </Button>
            }
            title="Resolve this reconciliation exception?"
            onConfirm={() => handleResolve(row.original.id)}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleRun} disabled={isRunning || isPending}>
          <RefreshCw className="size-4" />
          {isRunning ? "Running…" : "Run Reconciliation Check"}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No reconciliation records yet"
        emptyDescription="Run a reconciliation check to compare completed transactions against dealer settlements."
      />
    </div>
  )
}
