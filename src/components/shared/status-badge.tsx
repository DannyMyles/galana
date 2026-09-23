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
  TICKET_VALIDATED: "bg-[#1226AA]/10 text-[#1226AA] border-transparent",
  FUEL_AUTHORISATION_PENDING: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",
  AUTHORISED: "bg-[#1226AA]/10 text-[#1226AA] border-transparent",
  FUELLING_IN_PROGRESS: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",
  COMPLETED: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",
  REJECTED: "bg-[#EB2239]/10 text-[#D01A2F] border-transparent",
  CANCELLED: "bg-slate-100 text-slate-500 border-transparent",
  EXPIRED: "bg-slate-100 text-slate-500 border-transparent",
  FAILED: "bg-[#EB2239]/10 text-[#D01A2F] border-transparent",
  REVERSED: "bg-[#F75B8C]/15 text-[#C4275F] border-transparent",
  PENDING_RECONCILIATION: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",

  PENDING_APPROVAL: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",
  APPROVED: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",
  PENDING: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",

  ACTIVE: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",
  SUSPENDED: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",
  DEACTIVATED: "bg-slate-100 text-slate-500 border-transparent",
  INACTIVE: "bg-slate-100 text-slate-500 border-transparent",
  ISSUED: "bg-[#1226AA]/10 text-[#1226AA] border-transparent",
  PARTIALLY_REDEEMED: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",
  REDEEMED: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",

  MATCHED: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",
  EXCEPTION: "bg-[#EB2239]/10 text-[#D01A2F] border-transparent",
  RESOLVED: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",
  OPEN: "bg-[#EB2239]/10 text-[#D01A2F] border-transparent",
  IN_PROGRESS: "bg-[#F5C400]/20 text-[#8A6A00] border-transparent",

  SETTLED: "bg-[#0AC6A2]/15 text-[#068A70] border-transparent",
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
  const style = STATUS_STYLES[status as PortalStatus] ?? "bg-slate-100 text-slate-600 border-transparent"

  return (
    <Badge variant="outline" className={cn("font-medium px-2.5", style, className)}>
      {toLabel(status)}
    </Badge>
  )
}
