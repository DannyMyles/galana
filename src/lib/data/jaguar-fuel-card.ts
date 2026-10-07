import {
  FuelCardPartnerError,
  checkPosDevice,
  getAuditTrail,
  getCustomerSummary,
  getGalanaCustomers,
  getTicketReconciliation,
  getTicketStatus,
  isFuelCardPartnerConfigured,
  isTicketNotFound,
  validateTicket,
  type AuditTrail,
  type CustomerSummary,
  type PosDeviceCheck,
  type TicketStatusInfo,
  type TicketValidation,
} from "@/lib/integrations/fuel-card-partner"

/** Outcome of a partner API read: the page shows the state instead of failing. */
export type PartnerResult<T> =
  | { state: "not_configured" }
  | { state: "error"; message: string }
  | { state: "ok"; data: T }

async function readPartner<T>(call: () => Promise<T>): Promise<PartnerResult<T>> {
  if (!isFuelCardPartnerConfigured()) return { state: "not_configured" }
  try {
    return { state: "ok", data: await call() }
  } catch (error) {
    const message = error instanceof FuelCardPartnerError ? error.message : "The fuel card service did not respond"
    return { state: "error", message }
  }
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Ticket feed for one Galana customer and date range. Defaults to the first customer Galana
 * serves (Galana Settings) and the last 30 days. Returns the customer and range used.
 */
export async function getJaguarTicketFeed(from?: string, to?: string, customer?: string) {
  const end = to ?? isoDate(new Date())
  const start = from ?? isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  if (!isFuelCardPartnerConfigured()) {
    return { customer: null, from: start, to: end, result: { state: "not_configured" } as const }
  }
  try {
    const customers = await getGalanaCustomers()
    const chosen = customer && customers.includes(customer) ? customer : customers[0]
    if (!chosen) {
      return { customer: null, from: start, to: end, result: { state: "error", message: "No customers are set up for Galana in Galana Settings." } as const }
    }
    const result = await readPartner(() => getTicketReconciliation(chosen, start, end))
    return { customer: chosen, from: start, to: end, result }
  } catch (error) {
    const message = error instanceof FuelCardPartnerError ? error.message : "The fuel card service did not respond"
    return { customer: null, from: start, to: end, result: { state: "error", message } as const }
  }
}

/** True when the customer is one Galana serves. Other customers are never shown. */
async function isGalanaCustomer(customerName: string) {
  try {
    return (await getGalanaCustomers()).includes(customerName)
  } catch {
    return false
  }
}

/** Float and fuelling totals for one Galana customer. Null for customers Galana does not serve. */
export async function getFuelCardSummaryForCustomer(customerName: string): Promise<PartnerResult<CustomerSummary> | null> {
  if (!(await isGalanaCustomer(customerName))) return null
  return readPartner(() => getCustomerSummary(customerName))
}

/** Is this POS device allowed to transact on the given software version? Errors carry the reason. */
export function getPartnerDeviceCheck(serial: string, softwareVersion: string): Promise<PartnerResult<PosDeviceCheck>> {
  return readPartner(() => checkPosDevice(serial, softwareVersion))
}

/** Read-only check of a Jaguar fuel ticket (does not consume it). */
export function getPartnerTicketValidation(ticketReference?: string, authorizationCode?: string): Promise<PartnerResult<TicketValidation>> {
  return readPartner(() => validateTicket(ticketReference, authorizationCode))
}

/** Recent change history for one Galana customer. Null for customers Galana does not serve. */
export async function getJaguarAuditTrail(customerName: string): Promise<PartnerResult<AuditTrail> | null> {
  if (!(await isGalanaCustomer(customerName))) return null
  return readPartner(() => getAuditTrail(customerName, undefined, undefined, 10))
}

/**
 * Status of a Galana ticket in the fuel card service. The Galana ticket number is tried as the
 * authorisation code, then as the Frappe ticket reference. "not_linked" means neither matched.
 */
export async function getJaguarTicketStatus(ticketNo: string): Promise<PartnerResult<TicketStatusInfo> | { state: "not_linked" }> {
  if (!isFuelCardPartnerConfigured()) return { state: "not_configured" }
  try {
    return { state: "ok", data: await getTicketStatus(undefined, ticketNo) }
  } catch (error) {
    if (!isTicketNotFound(error)) {
      return readPartner(async () => { throw error })
    }
  }
  try {
    return { state: "ok", data: await getTicketStatus(ticketNo) }
  } catch (error) {
    if (isTicketNotFound(error)) return { state: "not_linked" }
    return readPartner(async () => { throw error })
  }
}
