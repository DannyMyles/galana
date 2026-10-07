import { listPosDevices, listStations } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export async function getPosDevices() {
  const devices = await listPosDevices()
  return toPlain(
    devices.map((d) => ({
      id: d.id,
      deviceId: d.deviceId,
      make: d.make,
      model: d.model,
      softwareVersion: d.softwareVersion,
      status: d.status,
      lastSeenAt: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
      station: d.station,
    })),
  )
}

export async function getStationsForSelect() {
  const result = await listStations({ status: "ACTIVE", pageSize: 1000 })
  return result.rows
    .map((s) => ({ id: s.id, name: s.name, code: s.code }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export type PosDeviceListRow = Awaited<ReturnType<typeof getPosDevices>>[number]
