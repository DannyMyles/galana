/**
 * Client for the Jaguar fuel card partner API in the jpl_fuel_card Frappe app
 * (/api/method/jpl_fuel_card.api.partner.v1.*). Server-side only: the partner
 * credentials never reach the browser.
 *
 * Configuration (environment):
 *   FUEL_CARD_API_URL          base URL of the Frappe site, e.g. https://crm.example.co.ke
 *                              Falls back to DEFAULT_FUEL_CARD_API_URL below when unset — most
 *                              useful for deployments (e.g. Vercel Preview) that don't have this
 *                              variable scoped to them. A deployment that DOES set it, correctly,
 *                              to an environment whose backend isn't deployed yet still fails the
 *                              same way the explicit value would — this fallback doesn't change that.
 *   FUEL_CARD_PARTNER_USERNAME partner API user (holds the "Galana Partner API" role)
 *   FUEL_CARD_PARTNER_PASSWORD its password
 */

const METHOD_PREFIX = "/api/method/jpl_fuel_card.api.partner.v1."
const DEFAULT_FUEL_CARD_API_URL = "https://erpstaging.jaguar-petroleum.com"

export class FuelCardPartnerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = "FuelCardPartnerError"
  }
}

/** The portal's own service login to Frappe failed. This is a configuration problem, not a user's wrong password. */
export class FuelCardServiceAuthError extends FuelCardPartnerError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = "FuelCardServiceAuthError"
  }
}

export function isFuelCardPartnerConfigured() {
  // FUEL_CARD_API_URL always resolves (falls back to DEFAULT_FUEL_CARD_API_URL), so only the
  // credentials actually gate whether a call can be attempted.
  return Boolean(process.env.FUEL_CARD_PARTNER_USERNAME && process.env.FUEL_CARD_PARTNER_PASSWORD)
}

type Tokens = { accessToken: string; expiresAt: number }
let cached: Tokens | null = null

function baseUrl() {
  const url = process.env.FUEL_CARD_API_URL || DEFAULT_FUEL_CARD_API_URL
  return url.replace(/\/$/, "")
}

async function login(): Promise<Tokens> {
  const res = await fetch(`${baseUrl()}${METHOD_PREFIX}login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usr: process.env.FUEL_CARD_PARTNER_USERNAME,
      pwd: process.env.FUEL_CARD_PARTNER_PASSWORD,
    }),
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.tokens?.access_token) {
    throw new FuelCardServiceAuthError(
      "The fuel card service login failed. Check FUEL_CARD_PARTNER_USERNAME and FUEL_CARD_PARTNER_PASSWORD in .env.local.",
      res.status || 502,
    )
  }
  // Refresh a minute early so a token never expires mid-request.
  const expiresAt = Date.now() + (Number(body.tokens.expires_in) - 60) * 1000
  return { accessToken: body.tokens.access_token, expiresAt }
}

async function getAccessToken(forceNew = false): Promise<string> {
  if (forceNew || !cached || cached.expiresAt <= Date.now()) {
    cached = await login()
  }
  return cached.accessToken
}

async function request<T>(
  httpMethod: "GET" | "POST",
  method: string,
  params: Record<string, unknown>,
  retried = false,
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]),
  )
  const url = `${baseUrl()}${METHOD_PREFIX}${method}${httpMethod === "GET" && query.size ? `?${query}` : ""}`
  const res = await fetch(url, {
    method: httpMethod,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(httpMethod === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: httpMethod === "POST" ? JSON.stringify(params) : undefined,
    cache: "no-store",
  })

  // Token revoked or expired early: log in again once.
  if (res.status === 401 && !retried) {
    cached = null
    await getAccessToken(true)
    return request<T>(httpMethod, method, params, true)
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new FuelCardPartnerError(frappeErrorMessage(body) ?? `Partner API ${method} failed`, res.status)
  }
  return body.message as T
}

function get<T>(method: string, params: Record<string, unknown>) {
  return request<T>("GET", method, params)
}

function post<T>(method: string, params: Record<string, unknown>) {
  return request<T>("POST", method, params)
}

/** Frappe puts the user-facing message in _server_messages (a JSON list of JSON strings). */
function frappeErrorMessage(body: Record<string, unknown>): string | null {
  try {
    const messages = JSON.parse(String(body._server_messages ?? "[]")) as string[]
    const first = messages.length ? JSON.parse(messages[0]) : null
    if (first?.message) return String(first.message)
  } catch {
    // fall through to the plain fields
  }
  const plain = body.error ?? body.exception
  return plain ? String(plain) : null
}

// ── Response types (mirror jpl_fuel_card/api/partner/ops.py and service.py) ──

export type CustomerSummary = {
  customer: string
  as_of: string
  currency: string
  payment_type: "Prepaid" | "Credit"
  float: number
  available: number
  active_tickets: number
  consumption: { transactions: number; litres: number; amount: number }
  from_date: string | null
  to_date: string | null
}

export type TicketStatus =
  | "Reserved"
  | "Dispensing"
  | "Consumed"
  | "Expired"
  | "Refunded"

export type ReconciliationTicket = {
  ticket_reference: string
  authorization_code: string | null
  vehicle: string | null
  authorised_amount: number
  status: TicketStatus
  portal_status: string
  pts_id: string | null
  transaction_number: string | null
  consumed_amount: number | null
  dispensed_litres: number | null
  created_on: string
}

export type TicketReconciliation = {
  customer: string
  from_date: string
  to_date: string
  count: number
  status_counts: Partial<Record<TicketStatus, number>>
  tickets: ReconciliationTicket[]
}

export function getCustomerSummary(customer: string, fromDate?: string, toDate?: string) {
  return get<CustomerSummary>("customer_summary", { customer, from_date: fromDate, to_date: toDate })
}

export function getTicketReconciliation(customer: string, fromDate: string, toDate: string) {
  return get<TicketReconciliation>("ticket_reconciliation", { customer, from_date: fromDate, to_date: toDate })
}

export type EpraPrice = {
  product: string
  price_per_litre: number
  currency: string
  effective_from: string
  effective_to: string | null
}

export type PosDeviceCheck = {
  serial_number: string
  status: "Active" | "Deactivated"
  stations: string[]
  software_version: string
  make: string | null
  model: string | null
}

export type TicketValidation = {
  valid: boolean
  reason: string | null
  ticket_reference: string
  status: TicketStatus
  portal_status: string
  customer: string | null
  vehicle_number: string | null
  fuel_type: string | null
  authorised_amount: number
  remaining_amount: number
  expires_on: string | null
}

export type VehicleDetails = {
  vehicle_number: string
  customer: string
  fuel_type: string | null
  approval_status: string
  vehicle_status: string
  limit: { type: string | null; value: number; unit: string | null }
  drivers: { id: string; name: string }[]
}

export function getVehicleDetails(vehicleNumber: string) {
  return get<VehicleDetails>("vehicle_details", { vehicle_number: vehicleNumber })
}

export type AuditTrail = {
  customer: string
  count: number
  changes: { version: string; doctype: string; document: string; changed_by: string; changed_on: string; data: unknown }[]
}

export function getEpraPrices() {
  return get<{ as_of: string; prices: EpraPrice[] }>("epra_prices", {})
}

export function checkPosDevice(serialNumber: string, softwareVersion: string) {
  return get<PosDeviceCheck>("pos_device", { serial_number: serialNumber, software_version: softwareVersion })
}

export function validateTicket(ticketReference?: string, authorizationCode?: string) {
  return get<TicketValidation>("validate_ticket", { ticket_reference: ticketReference, authorization_code: authorizationCode })
}

export function getAuditTrail(customer: string, fromDate?: string, toDate?: string, limit = 20) {
  return get<AuditTrail>("audit_trail", { customer, from_date: fromDate, to_date: toDate, limit: String(limit) })
}

export type TicketStatusInfo = {
  ticket_reference: string
  authorization_code: string | null
  customer: string | null
  vehicle: string | null
  status: TicketStatus
  portal_status: string
  authorised_amount: number
  remaining_amount: number
  expires_on: string | null
  dispensed_litres: number | null
  consumed_amount: number | null
  unit_price: number | null
  station: string | null
  completed_on: string | null
  failure_reason: string | null
  transaction_number: string | null
}

export function getTicketStatus(ticketReference?: string, authorizationCode?: string) {
  return get<TicketStatusInfo>("ticket_status", { ticket_reference: ticketReference, authorization_code: authorizationCode })
}

/** The partner API raises "Ticket not found" (404) when a reference matches nothing. */
export function isTicketNotFound(error: unknown) {
  return error instanceof FuelCardPartnerError && error.status === 404 && /not found/i.test(error.message)
}

// ── Galana portal login (Frappe is the user store) ──────────────────────────

export type PortalProfile = {
  user: string
  full_name: string
  enabled: boolean
  roles: string[]
}

/** Checks a portal user's password in Frappe. Throws FuelCardPartnerError (401) on a wrong password. */
export function portalLogin(usr: string, pwd: string) {
  return post<PortalProfile>("portal_login", { usr, pwd })
}

/** Current enabled flag and portal roles for a user, read on every session check. */
export function portalProfile(usr: string) {
  return get<PortalProfile>("portal_profile", { usr })
}

export type TicketListRow = {
  ticket_reference: string
  authorization_code: string | null
  customer: string | null
  vehicle: string | null
  authorised_amount: number
  status: TicketStatus
  portal_status: string
  expires_on: string | null
  dispensed_litres: number | null
  consumed_amount: number | null
  transaction_number: string | null
  failure_reason: string | null
  created_on: string
}

export type TicketList = { tickets: TicketListRow[]; total: number; page: number; page_size: number }

/** Galana ticket statuses accepted by the list filter. */
export type GalanaTicketStatus = "ISSUED" | "PARTIALLY_REDEEMED" | "REDEEMED" | "EXPIRED" | "CANCELLED"

export function listTickets(params: { search?: string; status?: GalanaTicketStatus; page?: number; pageSize?: number }) {
  return get<TicketList>("tickets", {
    search: params.search,
    status: params.status,
    page: params.page !== undefined ? String(params.page) : undefined,
    page_size: params.pageSize !== undefined ? String(params.pageSize) : undefined,
  })
}

/** Customers Galana serves, from Galana Settings in Frappe. Nothing is hardcoded on the portal side. */
export async function getGalanaCustomers(): Promise<string[]> {
  const res = await get<{ customers: string[] }>("galana_customers", {})
  return res.customers
}


// ── Galana portal: stations, POS devices, dealers, approved software ─────────
// Every write takes `actor`: the Galana user who made the change, recorded in Activity Log.

export type StationStatusCode = "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
export type PosDeviceStatusCode = "ACTIVE" | "INACTIVE" | "DECOMMISSIONED"

export type PortalStation = {
  id: string
  name: string
  code: string
  region: string | null
  county: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  status: StationStatusCode
  dealer: string | null
  jplSyncStatus: "NOT_SYNCED" | "PENDING" | "SYNCED" | "FAILED"
  jplStationRef: string | null
  productIds: string[]
}

export type StationInput = {
  dealer?: string
  name: string
  code: string
  region: string
  county: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  status?: StationStatusCode
  jplStationRef?: string | null
  productIds: string[]
}

export type PortalDevice = {
  id: string
  deviceId: string
  make: string | null
  model: string | null
  softwareVersion: string | null
  status: PosDeviceStatusCode
  lastSeenAt: string | null
  station: { id: string; name: string; code: string } | null
}

export type PortalDealer = {
  id: string
  name: string
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  settlementAccount: string | null
  workflowState: string
  stationCount: number
}

export type PortalProduct = { id: string; code: string; name: string }
export type ApprovedVersion = { id: string; version: string; notes: string | null }

export function listStations(params: { search?: string; region?: string; status?: StationStatusCode; page?: number; pageSize?: number }) {
  return get<{ rows: PortalStation[]; totalRows: number; pageSize: number; regions: string[] }>("stations", {
    search: params.search,
    region: params.region,
    status: params.status,
    page: params.page,
    page_size: params.pageSize,
  })
}

export function getStation(stationId: string) {
  return get<PortalStation>("station", { station_id: stationId })
}

export function saveStation(actor: string, stationId: string | null, data: StationInput) {
  return post<PortalStation>("save_station", { actor, station_id: stationId ?? undefined, data })
}

export function setStationStatus(actor: string, stationId: string, status: StationStatusCode) {
  return post<PortalStation>("set_station_status", { actor, station_id: stationId, status })
}

export function listPosDevices() {
  return get<{ rows: PortalDevice[] }>("pos_devices", {}).then((r) => r.rows)
}

export function getPosDeviceRecord(deviceId: string) {
  return get<PortalDevice>("pos_device_record", { device_id: deviceId })
}

export function createPosDevice(actor: string, input: { deviceId: string; stationId: string; softwareVersion?: string; make?: string; model?: string }) {
  return post<PortalDevice>("create_pos_device", {
    actor,
    device_id: input.deviceId,
    station_id: input.stationId,
    software_version: input.softwareVersion,
    make: input.make,
    model: input.model,
  })
}

export function setPosDeviceStatus(actor: string, deviceId: string, status: PosDeviceStatusCode) {
  return post<PortalDevice>("set_pos_device_status", { actor, device_id: deviceId, status })
}

export function listApprovedVersions() {
  return get<ApprovedVersion[]>("approved_versions", {})
}

export function addApprovedVersion(actor: string, version: string, notes?: string) {
  return post<ApprovedVersion[]>("add_approved_version", { actor, version, notes })
}

export function removeApprovedVersion(actor: string, rowName: string) {
  return post<ApprovedVersion[]>("remove_approved_version", { actor, row_name: rowName })
}

export function listDealers() {
  return get<{ rows: PortalDealer[] }>("dealers", {}).then((r) => r.rows)
}

export function getDealer(dealerId: string) {
  return get<PortalDealer>("dealer", { dealer_id: dealerId })
}

export function updateDealer(actor: string, dealerId: string, data: { contactName?: string | null; contactPhone?: string | null; contactEmail?: string | null; settlementAccount?: string | null }) {
  return post<PortalDealer>("update_dealer", { actor, dealer_id: dealerId, data })
}

export function createDealer(actor: string, data: { name: string; contactName?: string | null; contactPhone?: string | null; contactEmail?: string | null; settlementAccount?: string | null }) {
  return post<PortalDealer>("create_dealer", {
    actor, dealer_name: data.name, contact_name: data.contactName,
    contact_phone: data.contactPhone, contact_email: data.contactEmail, settlement_account: data.settlementAccount,
  })
}

export function listFuelProducts() {
  return get<PortalProduct[]>("fuel_products", {})
}

export function writePortalAudit(input: {
  actor: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: unknown
  newValues?: unknown
  result: "SUCCESS" | "FAILURE"
  failureReason?: string
}) {
  return post<{ ok: boolean }>("audit", {
    actor: input.actor,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    old: input.oldValues,
    new: input.newValues,
    result: input.result,
    reason: input.failureReason,
  })
}

export type EpraPriceRow = {
  id: string
  productId: string
  product: { id: string; name: string }
  pricePerLitre: number
  currency: string
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
}

export function listEpraPriceHistory() {
  return get<EpraPriceRow[]>("epra_price_history", {})
}

/** Sets a new price from the given date. The previous price for the product closes the day before. */
export function addEpraPrice(actor: string, product: string, price: number, effectiveFrom: string) {
  return post<EpraPriceRow[]>("add_epra_price", { actor, product, price, effective_from: effectiveFrom })
}

export type RecordAuditEntry = {
  id: string
  action: string
  by: string
  when: string
  result: "SUCCESS" | "FAILURE"
  failureReason: string | null
}

export function listRecordAudit(entityId: string, limit = 10) {
  return get<RecordAuditEntry[]>("record_audit", { entity_id: entityId, limit: String(limit) })
}

export type AuditLogEntry = {
  id: string
  createdAt: string
  user: { name: string; email: string } | null
  role: string | null
  action: string
  entityType: string
  entityId: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  device: string | null
  result: "SUCCESS" | "FAILURE"
  failureReason: string | null
}

export type AuditLogParams = {
  searchUser?: string
  action?: string
  entityType?: string
  result?: "SUCCESS" | "FAILURE"
  preset?: "financial" | "adjustments" | "exceptions"
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}

export function listAuditLog(params: AuditLogParams) {
  return get<{ rows: AuditLogEntry[]; totalRows: number; pageSize: number; entityTypes: string[] }>("audit_log", {
    search_user: params.searchUser,
    action: params.action,
    entity_type: params.entityType,
    result: params.result,
    preset: params.preset,
    from_date: params.fromDate,
    to_date: params.toDate,
    page: params.page,
    page_size: params.pageSize,
  })
}

// ── Galana portal users (Frappe users with Galana roles) ────────────────────

export type PortalUserStatus = "ACTIVE" | "INACTIVE"
export type PortalUserRow = {
  id: string
  name: string
  email: string
  phone: string | null
  status: PortalUserStatus
  roles: { role: { name: string } }[]
  stationId: string | null
  station: { id: string; name: string } | null
}

export function listPortalUsers() {
  return get<{ rows: PortalUserRow[] }>("portal_users", {}).then((r) => r.rows)
}

export function getPortalUser(email: string) {
  return get<PortalUserRow>("portal_user", { email })
}

export function createPortalUser(actor: string, input: { email: string; name: string; phone?: string; roleNames: string[]; status: PortalUserStatus; stationId?: string }) {
  return post<PortalUserRow>("create_portal_user", {
    actor, email: input.email, name: input.name, phone: input.phone, role_names: input.roleNames,
    status: input.status, station_id: input.stationId,
  })
}

export function updatePortalUser(actor: string, input: { email: string; name: string; phone?: string; roleNames: string[]; status: PortalUserStatus; stationId?: string }) {
  return post<PortalUserRow>("update_portal_user", {
    actor, email: input.email, name: input.name, phone: input.phone, role_names: input.roleNames,
    status: input.status, station_id: input.stationId,
  })
}

export function setPortalUserStatus(actor: string, email: string, status: PortalUserStatus) {
  return post<PortalUserRow>("set_portal_user_status", { actor, email, status })
}

/** Frappe emails the user a link to set a new password. The portal never sees or shows a password. */
export function resetPortalUserPassword(actor: string, email: string) {
  return post<{ emailed: boolean }>("reset_portal_user_password", { actor, email })
}

// ── Galana portal settings (limits and discounts, on Galana Settings) ───────

export function getPortalSettings() {
  return get<{
    maxQuantityPerTxnL: number
    maxValuePerTxn: number
    underCanopyDiscountPerL: number
    jaguarDiscountPerL: number
    staleTransactionMinutes: number
  }>("portal_settings", {})
}

export function savePortalSettings(actor: string, data: Partial<Record<string, number>> | object) {
  return post<Record<string, number>>("save_portal_settings", { actor, data })
}

// ── Galana portal: fuelling transactions (Fuel Card Transaction Log) ────────

export type TransactionStatusCode = "COMPLETED" | "FAILED" | "PENDING"

export type PortalTransaction = {
  id: string
  reference: string
  ticketReference: string | null
  customer: string | null
  vehicle: string | null
  driver: string | null
  station: string | null
  status: TransactionStatusCode
  litres: number | null
  unitPrice: number | null
  amount: number | null
  fuelAmount: number | null
  failureReason: string | null
  ptsId: string | null
  happenedAt: string
}

export function listTransactions(params: { search?: string; status?: "COMPLETED" | "FAILED"; station?: string; fromDate?: string; toDate?: string; page?: number; pageSize?: number }) {
  return get<{ rows: PortalTransaction[]; totalRows: number; pageSize: number }>("transactions", {
    search: params.search,
    status: params.status,
    station: params.station,
    from_date: params.fromDate,
    to_date: params.toDate,
    page: params.page,
    page_size: params.pageSize,
  })
}

export function getTransaction(transactionId: string) {
  return get<PortalTransaction>("transaction", { transaction_id: transactionId })
}

// ── Galana portal: customers, dashboard and reports (scope is applied in Frappe, by the signed-in user) ──

export type PortalCustomerSummary = {
  customer: string
  accountType: "Prepaid" | "Credit" | null
  accountStatus: string | null
  float: number | null
  available: number
  sufficient: boolean
  activeTickets: number
  vehicles: number
}

export function listPortalCustomers(actor: string) {
  return get<{ rows: PortalCustomerSummary[] }>("portal_customers", { actor }).then((r) => r.rows)
}

export type PortalCustomerDetail = PortalCustomerSummary & {
  vehicleList: { vehicle_number: string; fuel_type: string | null; approval_status: string; vehicle_status: string; limit_value: number; limit_unit: string | null; limit_type: string | null }[]
  recentTickets: { ticketReference: string; vehicle: string | null; authorisedAmount: number; status: string; expiresOn: string | null; createdOn: string }[]
}

export function getPortalCustomer(actor: string, name: string) {
  return get<PortalCustomerDetail>("portal_customer", { actor, name })
}

export type PortalDashboard = {
  scope: "all" | "station"
  station: string | null
  sections: ("ops" | "finance" | "jaguar" | "dealer")[]
  as_of: string
  trend?: { date: string; litres: number; amount: number }[]
  outcomes?: { completed: number; failed: number }
  ticketStatus?: Record<string, number>
  operations?: {
    activeStations: number
    activePosDevices: number
    today: { transactions: number; litres: number; amount: number }
    failedTransactions: { count: number; recent: { reference: string; date: string; reason: string | null }[] }
    topStations: { station: string; litres: number; amount: number; transactions: number }[]
    ticketsNearingExpiry: { ticketReference: string; vehicle: string | null; authorisedAmount: number; expiresOn: string }[]
  }
  finance?: {
    totalConsumption: { transactions: number; litres: number; amount: number }
    fuelWalletBalance: number
    /** All-time approved top-ups, across every Galana customer. */
    totalJaguarFunding: number
    /** Running total of net payable to dealers across every settlement (all PENDING — nothing is posted). */
    dealerSettlementLiability: number
  }
  jaguar?: {
    prepaidBalance: number
    consumption: { transactions: number; litres: number; amount: number }
    activeTickets: number
    byVehicle: { vehicle: string; litres: number; amount: number }[]
    byStation: { station: string; litres: number; amount: number }[]
  }
  dealer?: {
    stationName: string
    consumption: { transactions: number; litres: number; amount: number }
    failedTransactions: number
    transactionHistory: { reference: string; date: string; vehicle: string | null; litres: number; amount: number }[]
    currentDealerCredits: Unavailable
    settlementStatus: Unavailable
  }
}

export type Unavailable = { label: string; available: false; reason: string }

export function getPortalDashboard(actor: string, days = 30) {
  return get<PortalDashboard>("portal_dashboard", { actor, days: String(days) })
}

export type PortalReport = {
  from: string
  to: string
  scope: "all" | "station"
  station: string | null
  totals: { transactions: number; litres: number; amount: number; ticketsIssued: number; failedTransactions: number }
  byStation: { station: string; transactions: number; litres: number; amount: number }[]
  byCustomer: { customer: string; transactions: number; litres: number; amount: number }[]
  byDay: { date: string; transactions: number; litres: number; amount: number }[]
  unavailable: Unavailable[]
}

export function getPortalReport(actor: string, fromDate: string, toDate: string) {
  return get<PortalReport>("portal_report", { actor, from_date: fromDate, to_date: toDate })
}

// ── Galana portal: wallet top-up requests (maker-checker; approval credits the fuel wallet) ──

export type TopUpStatus = "Pending Approval" | "Approved" | "Rejected"
export type TopUpRow = {
  id: string
  customer: string
  amount: number
  fundingAccount: string
  reference: string
  remarks: string | null
  status: TopUpStatus
  requestedBy: string
  requestedAt: string
  decidedBy: string | null
  decidedAt: string | null
  checkerComment: string | null
  walletCredited: boolean
}

export function listTopUps(actor: string, status?: TopUpStatus) {
  return get<{ rows: TopUpRow[] }>("topups", { actor, status }).then((r) => r.rows)
}

/** reference is optional — the backend generates one (TOPUP-YYYYMMDD-XXXX) when omitted. */
export function createTopUp(actor: string, input: { customer: string; amount: number; fundingAccount: string; reference?: string; remarks?: string }) {
  return post<TopUpRow>("create_topup", {
    actor, customer: input.customer, amount: input.amount, funding_account: input.fundingAccount,
    reference: input.reference, remarks: input.remarks,
  })
}

export function decideTopUp(actor: string, requestId: string, decision: "Approved" | "Rejected", comment?: string) {
  return post<TopUpRow>("decide_topup", { actor, request_id: requestId, decision, comment })
}

export function listGalanaCustomerNames() {
  return getGalanaCustomers()
}

// ── Galana portal: manual adjustments (maker-checker; approved credits and debits change the fuel wallet) ──

export type AdjustmentRow = {
  id: string
  customer: string
  direction: "Credit" | "Debit"
  amount: number
  reason: string
  status: "Pending Approval" | "Approved" | "Rejected"
  requestedBy: string
  requestedAt: string
  decidedBy: string | null
  decidedAt: string | null
  checkerComment: string | null
  walletChanged: boolean
}

export function listAdjustments(actor: string, status?: AdjustmentRow["status"]) {
  return get<{ rows: AdjustmentRow[] }>("adjustments", { actor, status }).then((r) => r.rows)
}

export function createAdjustment(actor: string, input: { customer: string; direction: "Credit" | "Debit"; amount: number; reason: string }) {
  return post<AdjustmentRow>("create_adjustment", { actor, ...input })
}

export function decideAdjustment(actor: string, requestId: string, decision: "Approved" | "Rejected", comment?: string) {
  return post<AdjustmentRow>("decide_adjustment", { actor, request_id: requestId, decision, comment })
}

// ── Galana portal: reversals of completed fuellings (maker-checker; approval recorded, wallet not changed yet) ──

export type ReversalRow = {
  id: string
  transaction: string
  customer: string
  amount: number
  reason: string
  status: "Pending Approval" | "Approved" | "Rejected"
  requestedBy: string
  requestedAt: string
  decidedBy: string | null
  decidedAt: string | null
  checkerComment: string | null
  walletChanged: boolean
}

export function listReversals(actor: string, status?: ReversalRow["status"]) {
  return get<{ rows: ReversalRow[] }>("reversals", { actor, status }).then((r) => r.rows)
}

export function createReversal(actor: string, input: { transaction: string; reason: string }) {
  return post<ReversalRow>("create_reversal", { actor, ...input })
}

export function decideReversal(actor: string, requestId: string, decision: "Approved" | "Rejected", comment?: string) {
  return post<ReversalRow>("decide_reversal", { actor, request_id: requestId, decision, comment })
}

// ── Galana portal: dealer settlements (provisional discount model) ──

export type CreditNoteSummary = { type: "UNDER_CANOPY" | "CONTRACTUAL"; amount: number; status: "PENDING" }

export type SettlementRow = {
  id: string
  reference: string
  date: string
  station: string
  vehicle: string | null
  litres: number
  gross: number
  underCanopyDiscount: number
  jaguarDiscount: number
  netPayableToDealer: number
  creditNotes: CreditNoteSummary[]
  status: "PENDING"
}

export function listSettlements(params: { search?: string; station?: string; fromDate?: string; toDate?: string; page?: number }) {
  return get<{ rows: SettlementRow[]; totalRows: number; pageSize: number; rates: { under_canopy: number; jaguar: number } | null; provisional?: boolean }>("settlements", {
    search: params.search,
    station: params.station,
    from_date: params.fromDate,
    to_date: params.toDate,
    page: params.page,
  })
}

/** One settlement (one completed fuelling), by its id. */
export function getSettlement(settlementId: string) {
  return get<SettlementRow>("settlement", { settlement_id: settlementId })
}

export type CreditNoteLine = {
  id: string
  settlement: string
  settlementId: string
  date: string
  station: string
  type: "UNDER_CANOPY" | "CONTRACTUAL"
  amount: number
  status: "PENDING"
}

export function listCreditNotes(params: { fromDate?: string; toDate?: string; page?: number }) {
  return get<{ rows: CreditNoteLine[]; totalRows: number; pageSize: number; totals: Record<string, number>; rates: { under_canopy: number; jaguar: number } }>("credit_notes", {
    from_date: params.fromDate,
    to_date: params.toDate,
    page: params.page,
  })
}

/** One credit note line, by `<settlement id>:<UNDER_CANOPY|CONTRACTUAL>`. */
export function getCreditNote(creditNoteId: string) {
  return get<CreditNoteLine & { vehicle: string | null; litres: number }>("credit_note", { credit_note_id: creditNoteId })
}
