"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { parseCsv } from "@/lib/export/csv"
import { stationSchema, type StationInput } from "@/lib/validations/station"
import { getStation, listDealers, listFuelProducts, listStations, saveStation as saveStationRecord, setStationStatus as setStatusRecord, type StationStatusCode } from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function requireStationManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "stations:manage")) throw new ActionError("You do not have permission to manage stations.")
  return session.user
}

function actorOf(user: { email?: string | null }) {
  if (!user.email) throw new ActionError("Your session has no email address, so the change cannot be recorded.")
  return user.email
}

/** Form input -> Frappe station payload. Products are Frappe Item names. */
function toPayload(parsed: ReturnType<typeof stationSchema.parse>) {
  const { productIds, dealerId, latitude, longitude, contactEmail, ...rest } = parsed
  return {
    dealer: dealerId || undefined,
    name: rest.name,
    code: rest.code,
    region: rest.region,
    county: rest.county,
    address: rest.address || null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    contactName: rest.contactName || null,
    contactPhone: rest.contactPhone || null,
    contactEmail: contactEmail || null,
    productIds,
  }
}

export async function saveStation(id: string | null, input: StationInput) {
  const user = await requireStationManager()
  const actor = actorOf(user)
  const parsed = stationSchema.safeParse(input)
  if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid station details.")
  const payload = toPayload(parsed.data)

  try {
    if (id) {
      const before = await getStation(id)
      await saveStationRecord(actor, id, payload)
      await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_UPDATED", entityType: "Station", entityId: id, oldValues: { name: before.name, region: before.region, county: before.county, products: before.productIds.length }, newValues: parsed.data, result: "SUCCESS" })
    } else {
      const station = await saveStationRecord(actor, null, payload)
      await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_CREATED", entityType: "Station", entityId: station.id, newValues: parsed.data, result: "SUCCESS" })
    }
  } catch (error) {
    await writeAuditLog({ userId: user.id, role: user.roles[0], action: id ? "STATION_UPDATED" : "STATION_CREATED", entityType: "Station", entityId: id ?? undefined, newValues: parsed.data, result: "FAILURE", failureReason: error instanceof Error ? error.message : "Unknown error" })
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not save the station.")
  }
  revalidatePath("/stations")
}

export async function setStationStatus(stationId: string, status: StationStatusCode) {
  const user = await requireStationManager()
  const before = await getStation(stationId)
  // US-ADM-005 / US-OPS-002: the Frappe record is set to PENDING so the status syncs back to JPL OMC.
  await setStatusRecord(actorOf(user), stationId, status)
  await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_STATUS_CHANGED", entityType: "Station", entityId: stationId, oldValues: { status: before.status }, newValues: { status }, result: "SUCCESS" })
  revalidatePath("/stations")
}

const TEMPLATE_COLUMNS = ["name", "code", "region", "county", "address", "latitude", "longitude", "contactName", "contactPhone", "contactEmail", "dealer", "products"]

export async function bulkUploadStations(csv: string) {
  const user = await requireStationManager()
  const actor = actorOf(user)
  const rows = parseCsv(csv)
  if (rows.length < 2) return { created: 0, errors: [{ line: 1, message: "The file has no data rows." }] }
  const header = rows[0].map((h) => h.trim())
  const missing = ["name", "code", "region", "county", "products"].filter((c) => !header.includes(c))
  if (missing.length) return { created: 0, errors: [{ line: 1, message: `Missing required column(s): ${missing.join(", ")}. Expected: ${TEMPLATE_COLUMNS.join(", ")}` }] }

  const [products, dealers, existing] = await Promise.all([
    listFuelProducts(),
    listDealers(),
    listStations({ pageSize: 1000 }),
  ])
  const seen = new Set(existing.rows.map((s) => s.code))
  const errors: { line: number; message: string }[] = []
  let created = 0

  for (let i = 1; i < rows.length; i++) {
    const cells = Object.fromEntries(header.map((h, idx) => [h, rows[i][idx] ?? ""]))
    const line = i + 1
    const codes = cells.products.split(/[;|]/).map((c) => c.trim()).filter(Boolean)
    const productIds = codes.map((c) => products.find((p) => p.code.toLowerCase() === c.toLowerCase() || p.name.toLowerCase() === c.toLowerCase())?.id)
    const dealer = cells.dealer ? dealers.find((d) => d.name.toLowerCase() === cells.dealer.toLowerCase()) : undefined

    const parsed = stationSchema.safeParse({ ...cells, dealerId: dealer?.id, productIds: productIds.filter((v): v is string => !!v) })
    if (!parsed.success) { errors.push({ line, message: parsed.error.issues[0].message }); continue }
    if (productIds.some((p) => !p)) { errors.push({ line, message: `Unknown product in "${cells.products}" (use ${products.map((p) => p.code).join(", ")})` }); continue }
    if (cells.dealer && !dealer) { errors.push({ line, message: `Dealer "${cells.dealer}" does not exist` }); continue }
    if (seen.has(parsed.data.code)) { errors.push({ line, message: `Station code ${parsed.data.code} already exists` }); continue }

    try {
      const station = await saveStationRecord(actor, null, toPayload(parsed.data))
      seen.add(parsed.data.code)
      created += 1
      await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_CREATED", entityType: "Station", entityId: station.id, newValues: { source: "bulk-upload", code: parsed.data.code }, result: "SUCCESS" })
    } catch (error) {
      errors.push({ line, message: error instanceof Error ? error.message : "Could not create the station" })
    }
  }

  await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_BULK_UPLOAD", entityType: "Station", newValues: { created, errors: errors.length }, result: errors.length && !created ? "FAILURE" : "SUCCESS", failureReason: errors.length ? `${errors.length} row(s) rejected` : undefined })
  revalidatePath("/stations")
  return { created, errors }
}
