"use server"

import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { getPartnerTicketValidation, type PartnerResult } from "@/lib/data/jaguar-fuel-card"
import type { TicketValidation } from "@/lib/integrations/fuel-card-partner"

/** Read-only check of a Jaguar ticket by its reference or authorisation code. Does not consume it. */
export async function checkJaguarTicket(input: {
  ticketReference?: string
  authorizationCode?: string
}): Promise<PartnerResult<TicketValidation>> {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:validate-ticket")) {
    return { state: "error", message: "You are not allowed to validate tickets." }
  }
  const ref = input.ticketReference?.trim() || undefined
  const code = input.authorizationCode?.trim() || undefined
  if (!ref && !code) return { state: "error", message: "Enter a ticket reference or authorisation code." }
  return getPartnerTicketValidation(ref, code)
}
