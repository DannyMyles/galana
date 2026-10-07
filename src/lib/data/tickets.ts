import { listTickets, type GalanaTicketStatus, type TicketListRow as PartnerTicket } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

const PAGE_SIZE = 8

/** Frappe ticket status -> Galana ticket status shown in the portal. */
const GALANA_STATUS: Record<string, GalanaTicketStatus> = {
  Reserved: "ISSUED",
  Dispensing: "PARTIALLY_REDEEMED",
  Consumed: "REDEEMED",
  Expired: "EXPIRED",
  Refunded: "CANCELLED",
}

export type TicketListRow = {
  id: string
  ticketNo: string
  customer: { name: string }
  vehicle: { regNo: string } | null
  authorisedAmount: number
  consumedAmount: number | null
  status: GalanaTicketStatus
  expiresAt: Date | null
  transactionNumber: string | null
}

export function toTicketRow(t: PartnerTicket): TicketListRow {
  return {
    id: t.ticket_reference,
    ticketNo: t.ticket_reference,
    customer: { name: t.customer ?? "—" },
    vehicle: t.vehicle ? { regNo: t.vehicle } : null,
    authorisedAmount: t.authorised_amount,
    consumedAmount: t.consumed_amount,
    status: GALANA_STATUS[t.status] ?? "ISSUED",
    expiresAt: t.expires_on ? new Date(t.expires_on) : null,
    transactionNumber: t.transaction_number,
  }
}

/** Fuel tickets for the monitoring page, read from the fuel card service (Frappe). */
export async function getTickets({ search, status, page = 0 }: { search?: string; status?: GalanaTicketStatus; page?: number }) {
  const result = await listTickets({ search: search || undefined, status, page, pageSize: PAGE_SIZE })
  return { rows: toPlain(result.tickets.map(toTicketRow)), totalRows: result.total, pageSize: PAGE_SIZE }
}

export type { GalanaTicketStatus }
