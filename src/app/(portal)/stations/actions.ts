"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { queueStationSync } from "@/lib/integrations/jpl"
import { parseCsv } from "@/lib/export/csv"
import { stationSchema, type StationInput } from "@/lib/validations/station"

class ActionError extends Error {}

async function requireStationManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "stations:manage")) throw new ActionError("You do not have permission to manage stations.")
  return session.user
}

function toData(parsed: ReturnType<typeof stationSchema.parse>) {
  const { productIds, dealerId, latitude, longitude, contactEmail, ...rest } = parsed
  return {
    productIds,
    data: {
      ...rest,
      address: rest.address || null,
      contactName: rest.contactName || null,
      contactPhone: rest.contactPhone || null,
      contactEmail: contactEmail || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      dealerId: dealerId || null,
    },
  }
}

export async function saveStation(id: string | null, input: StationInput) {
  const user = await requireStationManager()
  const parsed = stationSchema.safeParse(input)
  if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid station details.")
  const { productIds, data } = toData(parsed.data)

  try {
    if (id) {
      const before = await prisma.station.findUniqueOrThrow({ where: { id }, include: { products: true } })
      await prisma.$transaction([
        prisma.station.update({ where: { id }, data: { ...data, jplSyncStatus: "PENDING" } }),
        prisma.stationProduct.deleteMany({ where: { stationId: id } }),
        prisma.stationProduct.createMany({ data: productIds.map((productId) => ({ stationId: id, productId })) }),
      ])
      await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_UPDATED", entityType: "Station", entityId: id, oldValues: { name: before.name, region: before.region, county: before.county, products: before.products.length }, newValues: parsed.data, result: "SUCCESS" })
    } else {
      const station = await prisma.station.create({ data: { ...data, jplSyncStatus: "PENDING", products: { create: productIds.map((productId) => ({ productId })) } } })
      await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_CREATED", entityType: "Station", entityId: station.id, newValues: parsed.data, result: "SUCCESS" })
    }
  } catch (error) {
    await writeAuditLog({ userId: user.id, role: user.roles[0], action: id ? "STATION_UPDATED" : "STATION_CREATED", entityType: "Station", entityId: id ?? undefined, newValues: parsed.data, result: "FAILURE", failureReason: error instanceof Error ? error.message : "Unknown error" })
    throw new ActionError("Could not save the station — the code may already be in use.")
  }
  revalidatePath("/stations")
}

export async function setStationStatus(stationId: string, status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") {
  const user = await requireStationManager()
  const before = await prisma.station.findUniqueOrThrow({ where: { id: stationId } })
  await prisma.station.update({ where: { id: stationId }, data: { status } })
  await queueStationSync(stationId) // US-ADM-005 / US-OPS-002: status must sync back to JPL OMC.
  await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_STATUS_CHANGED", entityType: "Station", entityId: stationId, oldValues: { status: before.status }, newValues: { status }, result: "SUCCESS" })
  revalidatePath("/stations")
}

const TEMPLATE_COLUMNS = ["name", "code", "region", "county", "address", "latitude", "longitude", "contactName", "contactPhone", "contactEmail", "dealer", "products"]

export async function bulkUploadStations(csv: string) {
  const user = await requireStationManager()
  const rows = parseCsv(csv)
  if (rows.length < 2) return { created: 0, errors: [{ line: 1, message: "The file has no data rows." }] }
  const header = rows[0].map((h) => h.trim())
  const missing = ["name", "code", "region", "county", "products"].filter((c) => !header.includes(c))
  if (missing.length) return { created: 0, errors: [{ line: 1, message: `Missing required column(s): ${missing.join(", ")}. Expected: ${TEMPLATE_COLUMNS.join(", ")}` }] }

  const [products, dealers, existing] = await Promise.all([prisma.fuelProduct.findMany(), prisma.dealer.findMany(), prisma.station.findMany({ select: { code: true } })])
  const seen = new Set(existing.map((s) => s.code))
  const errors: { line: number; message: string }[] = []
  let created = 0

  for (let i = 1; i < rows.length; i++) {
    const cells = Object.fromEntries(header.map((h, idx) => [h, rows[i][idx] ?? ""]))
    const line = i + 1
    const codes = cells.products.split(/[;|]/).map((c) => c.trim().toUpperCase()).filter(Boolean)
    const productIds = codes.map((c) => products.find((p) => p.code === c)?.id)
    const dealer = cells.dealer ? dealers.find((d) => d.name.toLowerCase() === cells.dealer.toLowerCase()) : undefined

    const parsed = stationSchema.safeParse({ ...cells, dealerId: dealer?.id, productIds: productIds.filter((v): v is string => !!v) })
    if (!parsed.success) { errors.push({ line, message: parsed.error.issues[0].message }); continue }
    if (productIds.some((p) => !p)) { errors.push({ line, message: `Unknown product code in "${cells.products}" (use ${products.map((p) => p.code).join(", ")})` }); continue }
    if (cells.dealer && !dealer) { errors.push({ line, message: `Dealer "${cells.dealer}" does not exist` }); continue }
    if (seen.has(parsed.data.code)) { errors.push({ line, message: `Station code ${parsed.data.code} already exists` }); continue }

    const { productIds: ids, data } = toData(parsed.data)
    const station = await prisma.station.create({ data: { ...data, jplSyncStatus: "PENDING", products: { create: ids.map((productId) => ({ productId })) } } })
    seen.add(parsed.data.code)
    created += 1
    await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_CREATED", entityType: "Station", entityId: station.id, newValues: { source: "bulk-upload", code: station.code }, result: "SUCCESS" })
  }

  await writeAuditLog({ userId: user.id, role: user.roles[0], action: "STATION_BULK_UPLOAD", entityType: "Station", newValues: { created, errors: errors.length }, result: errors.length && !created ? "FAILURE" : "SUCCESS", failureReason: errors.length ? `${errors.length} row(s) rejected` : undefined })
  revalidatePath("/stations")
  return { created, errors }
}
