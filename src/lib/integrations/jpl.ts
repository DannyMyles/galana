import { prisma } from "@/lib/db/client"

/**
 * JPL OMC onboarding sync (US-ADM-005, US-OPS-001/002). The OMC API contract
 * is still open, so this only marks the station as awaiting sync; the worker
 * that calls JPL and flips it to SYNCED/FAILED is wired in later.
 */
export async function queueStationSync(stationId: string) {
  await prisma.station.update({ where: { id: stationId }, data: { jplSyncStatus: "PENDING" } })
}
