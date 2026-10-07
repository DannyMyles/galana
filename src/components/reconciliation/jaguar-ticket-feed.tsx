import { CheckCircle2, AlertTriangle, Plug } from "@/components/icons"
import { KpiCard } from "@/components/shared/kpi-card"
import { MiniTable } from "@/components/shared/mini-table"
import { StatusBadge, type PortalStatus } from "@/components/shared/status-badge"
import { LitresDisplay, MoneyDisplay } from "@/components/shared/money-display"
import type { PartnerResult } from "@/lib/data/jaguar-fuel-card"
import type { ReconciliationTicket, TicketReconciliation, TicketStatus } from "@/lib/integrations/fuel-card-partner"

// Jaguar ticket status (Frappe) -> portal status badge.
const STATUS_BADGE: Record<TicketStatus, PortalStatus> = {
  Reserved: "AUTHORISED",
  Dispensing: "FUELLING_IN_PROGRESS",
  Consumed: "COMPLETED",
  Expired: "EXPIRED",
  Refunded: "CANCELLED",
}

/** Server-rendered view of Jaguar's ticket feed (US-REC-001/002), read from the partner API. */
export function JaguarTicketFeed({ customer, result, from, to }: { customer: string | null; result: PartnerResult<TicketReconciliation>; from: string; to: string }) {
  return (
    <section className="mb-6 rounded-xl border border-[#E4E7F2] bg-white p-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#1B1D3A]">Jaguar fuel tickets</h2>
          <p className="text-xs text-[#6A6C8C]">{customer ?? "No customer"} · {from} to {to}</p>
        </div>
      </header>

      {result.state === "not_configured" && (
        <p className="flex items-start gap-2 rounded-xl bg-[#F6F7FB] px-4 py-3 text-sm text-[#3B3E63]">
          <Plug className="mt-0.5 size-4 shrink-0 text-[#6A6C8C]" />
          The fuel card service is not configured. Set FUEL_CARD_API_URL and the partner credentials to show Jaguar&apos;s tickets.
        </p>
      )}

      {result.state === "error" && (
        <p className="flex items-start gap-2 rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Could not load Jaguar&apos;s tickets: {result.message}
        </p>
      )}

      {result.state === "ok" && (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <KpiCard label="Tickets in range" value={result.data.count.toString()} icon={Plug} iconTint="blue" />
            <KpiCard label="Consumed" value={(result.data.status_counts.Consumed ?? 0).toString()} icon={CheckCircle2} iconTint="emerald" />
            <KpiCard label="Expired or cancelled" value={((result.data.status_counts.Expired ?? 0) + (result.data.status_counts.Refunded ?? 0)).toString()} icon={AlertTriangle} iconTint="red" />
          </div>
          <MiniTable<ReconciliationTicket>
            rows={result.data.tickets}
            empty="No Jaguar tickets were raised in this period."
            columns={[
              { header: "Ticket", cell: (t) => <span className="font-medium">{t.ticket_reference}</span> },
              { header: "Vehicle", cell: (t) => t.vehicle ?? "—" },
              { header: "Authorised", cell: (t) => <MoneyDisplay amount={t.authorised_amount} /> },
              { header: "Litres", cell: (t) => (t.dispensed_litres ? <LitresDisplay litres={t.dispensed_litres} /> : "—") },
              { header: "Consumed", cell: (t) => (t.consumed_amount ? <MoneyDisplay amount={t.consumed_amount} /> : "—") },
              { header: "Created", cell: (t) => t.created_on.slice(0, 16) },
              { header: "Status", cell: (t) => <StatusBadge status={STATUS_BADGE[t.status]} /> },
            ]}
          />
        </>
      )}
    </section>
  )
}
