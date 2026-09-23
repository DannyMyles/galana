"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search } from "@/components/icons"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { EmptyState } from "@/components/shared/empty-state"
import type { ExceptionQueueRow } from "@/lib/data/exceptions"
import { resolveException } from "@/app/(portal)/failed-transactions/actions"

export function ExceptionWorkspace({ items }: { items: ExceptionQueueRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const filtered = items.filter(
    (item) =>
      !search ||
      item.transaction?.reference.toLowerCase().includes(search.toLowerCase()) ||
      item.transaction?.station.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = items.find((item) => item.id === selectedId) ?? null

  async function handleResolve(method: "RETRY" | "NOTIFY" | "OVERRIDE" | "RESOLVE") {
    if (!selected) return
    setPendingAction(method)
    try {
      await resolveException(selected.id, method)
      toast.success("Exception updated.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update exception.")
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Discrepancy Ledger</CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ref/station..."
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              title="No open exceptions"
              description="Failed and reversed transactions requiring action will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    data-selected={item.id === selectedId}
                    className="cursor-pointer data-[selected=true]:bg-muted"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <TableCell>
                      <DateTimeDisplay value={item.createdAt} />
                    </TableCell>
                    <TableCell>{item.transaction?.reference ?? "—"}</TableCell>
                    <TableCell>{item.transaction?.station.name ?? "—"}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" onClick={() => setSelectedId(item.id)}>
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a row to inspect.</p>
          ) : (
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{selected.transaction?.reference}</span>
                <StatusBadge status={selected.status} />
              </div>
              <p className="rounded-md bg-muted p-3 text-xs">
                {selected.transaction?.failureReason ?? selected.reason}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Fleet Customer</p>
                  <p className="font-medium">{selected.transaction?.ticket.customer.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selected.transaction?.ticket.vehicle?.regNo ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested Amount</p>
                  <p className="font-medium">
                    <MoneyDisplay
                      amount={
                        Number(selected.transaction?.authorisedQtyL ?? 0) *
                        Number(selected.transaction?.unitTariff ?? 0)
                      }
                    />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Station</p>
                  <p className="font-medium">{selected.transaction?.station.name}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">EXECUTE RESOLUTION</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingAction !== null}
                  onClick={() => handleResolve("RETRY")}
                >
                  {pendingAction === "RETRY" ? "Retrying…" : "Retry Authorization"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingAction !== null}
                  onClick={() => handleResolve("NOTIFY")}
                >
                  {pendingAction === "NOTIFY" ? "Notifying…" : "Notify Customer Maker"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingAction !== null}
                  onClick={() => handleResolve("OVERRIDE")}
                >
                  {pendingAction === "OVERRIDE" ? "Overriding…" : "Override with Admin Approval"}
                </Button>
                <Button
                  size="sm"
                  disabled={pendingAction !== null}
                  onClick={() => handleResolve("RESOLVE")}
                >
                  {pendingAction === "RESOLVE" ? "Saving…" : "Mark as Resolved"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
