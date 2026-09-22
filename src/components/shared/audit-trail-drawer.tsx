"use client"

import type { ReactElement } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { StatusBadge } from "@/components/shared/status-badge"

export interface AuditTrailEntry {
  id: string
  action: string
  actorName: string
  role: string
  createdAt: string | Date
  result: "SUCCESS" | "FAILURE"
  oldValues?: unknown
  newValues?: unknown
}

/**
 * Slide-over showing the immutable audit trail for a single record
 * (a transaction, ticket, top-up request, station, etc). Used from any
 * detail view so auditors and reviewers can inspect who-did-what without
 * leaving the page — see US-AUD-001..006.
 */
export function AuditTrailDrawer({
  trigger,
  title = "Audit Trail",
  entries,
}: {
  trigger: ReactElement
  title?: string
  entries: AuditTrailEntry[]
}) {
  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">No audit events recorded.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{entry.action}</span>
                <StatusBadge status={entry.result === "SUCCESS" ? "COMPLETED" : "FAILED"} />
              </div>
              <p className="mt-1 text-muted-foreground">
                {entry.actorName} · {entry.role}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <DateTimeDisplay value={entry.createdAt} />
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
