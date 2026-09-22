import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Union of every status string used across the portal's state machines
 * (transactions, tickets, top-ups, settlements, reconciliation, exceptions).
 * Centralising the mapping here keeps colour semantics consistent no matter
 * which module renders a badge.
 */
export type PortalStatus =
  // Transaction engine
  | "INITIATED"
  | "TICKET_VALIDATED"
  | "FUEL_AUTHORISATION_PENDING"
  | "AUTHORISED"
  | "FUELLING_IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED"
  | "REVERSED"
  | "PENDING_RECONCILIATION"
  // Top-up / approval
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PENDING"
  // Station / device / ticket
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED"
  | "INACTIVE"
  | "ISSUED"
  | "PARTIALLY_REDEEMED"
  | "REDEEMED"
  // Reconciliation / exceptions
  | "MATCHED"
  | "EXCEPTION"
  | "RESOLVED"
  | "OPEN"
  | "IN_PROGRESS"
  // Settlement
  | "SETTLED"

const STATUS_STYLES: Record<PortalStatus, string> = {
  INITIATED: "bg-slate-100 text-slate-600 border-transparent",
  TICKET_VALIDATED: "bg-blue-50 text-blue-600 border-transparent",
  FUEL_AUTHORISATION_PENDING: "bg-amber-50 text-amber-600 border-transparent",
  AUTHORISED: "bg-blue-50 text-blue-600 border-transparent",
  FUELLING_IN_PROGRESS: "bg-amber-50 text-amber-600 border-transparent",
  COMPLETED: "bg-emerald-50 text-emerald-600 border-transparent",
  REJECTED: "bg-red-50 text-red-600 border-transparent",
  CANCELLED: "bg-slate-100 text-slate-500 border-transparent",
  EXPIRED: "bg-slate-100 text-slate-500 border-transparent",
  FAILED: "bg-red-50 text-red-600 border-transparent",
  REVERSED: "bg-purple-50 text-purple-600 border-transparent",
  PENDING_RECONCILIATION: "bg-amber-50 text-amber-600 border-transparent",

  PENDING_APPROVAL: "bg-amber-50 text-amber-600 border-transparent",
  APPROVED: "bg-emerald-50 text-emerald-600 border-transparent",
  PENDING: "bg-amber-50 text-amber-600 border-transparent",

  ACTIVE: "bg-emerald-50 text-emerald-600 border-transparent",
  SUSPENDED: "bg-amber-50 text-amber-600 border-transparent",
  DEACTIVATED: "bg-slate-100 text-slate-500 border-transparent",
  INACTIVE: "bg-slate-100 text-slate-500 border-transparent",
  ISSUED: "bg-blue-50 text-blue-600 border-transparent",
  PARTIALLY_REDEEMED: "bg-amber-50 text-amber-600 border-transparent",
  REDEEMED: "bg-emerald-50 text-emerald-600 border-transparent",

  MATCHED: "bg-emerald-50 text-emerald-600 border-transparent",
  EXCEPTION: "bg-red-50 text-red-600 border-transparent",
  RESOLVED: "bg-emerald-50 text-emerald-600 border-transparent",
  OPEN: "bg-red-50 text-red-600 border-transparent",
  IN_PROGRESS: "bg-amber-50 text-amber-600 border-transparent",

  SETTLED: "bg-emerald-50 text-emerald-600 border-transparent",
}

function toLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

export function StatusBadge({
  status,
  className,
}: {
  status: PortalStatus | (string & {})
  className?: string
}) {
  const style = STATUS_STYLES[status as PortalStatus] ?? "bg-slate-100 text-slate-700 border-slate-200"

  return (
    <Badge variant="outline" className={cn("font-medium", style, className)}>
      {toLabel(status)}
    </Badge>
  )
}
