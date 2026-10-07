"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { checkJaguarTicket } from "@/app/(portal)/validate-ticket/jaguar-actions"
import type { PartnerResult } from "@/lib/data/jaguar-fuel-card"
import type { TicketValidation } from "@/lib/integrations/fuel-card-partner"
import { PartnerNotice } from "@/components/shared/partner-notice"

/** Look up a Jaguar fuel ticket in the fuel card service. Read-only: the ticket is not consumed. */
export function JaguarTicketCheck() {
  const [reference, setReference] = useState("")
  const [code, setCode] = useState("")
  const [result, setResult] = useState<PartnerResult<TicketValidation> | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCheck() {
    startTransition(async () => {
      setResult(await checkJaguarTicket({ ticketReference: reference, authorizationCode: code }))
    })
  }

  return (
    <section className="mt-10 rounded-xl border border-[#E4E7F2] bg-white p-5">
      <h2 className="mb-1 text-base font-semibold text-[#1B1D3A]">Check a Jaguar ticket</h2>
      <p className="mb-4 text-xs text-[#6A6C8C]">Looks the ticket up in the fuel card service. Checking does not use the ticket.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Ticket reference" value={reference} onChange={(e) => setReference(e.target.value)} />
        <Input placeholder="Authorisation code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button onClick={handleCheck} disabled={isPending || (!reference && !code)}>
          {isPending ? "Checking…" : "Check ticket"}
        </Button>
      </div>

      {result?.state === "ok" && (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${result.data.valid ? "bg-[#0AC6A2]/15 text-[#068A70]" : "bg-[#EB2239]/10 text-[#D01A2F]"}`}>
          {result.data.valid ? "Valid for fuelling" : `Not valid: ${result.data.reason}`}
          <dl className="mt-2 grid gap-1 text-[#3B3E63] sm:grid-cols-2">
            <div>Ticket: {result.data.ticket_reference}</div>
            <div>Status: {result.data.portal_status}</div>
            <div>Vehicle: {result.data.vehicle_number ?? "—"}</div>
            <div>Fuel: {result.data.fuel_type ?? "—"}</div>
            <div>Authorised: KES {result.data.authorised_amount.toFixed(2)}</div>
            <div>Expires: {result.data.expires_on ?? "—"}</div>
          </dl>
        </div>
      )}
      {result && result.state !== "ok" && (
        <div className="mt-4">
          <PartnerNotice state={result.state} message={result.state === "error" ? result.message : undefined} />
        </div>
      )}
    </section>
  )
}
