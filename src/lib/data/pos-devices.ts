import { prisma } from "@/lib/db/client"

export async function getPosDevices() {
  return prisma.pOSDevice.findMany({
    include: { station: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getStationsForSelect() {
  return prisma.station.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  })
}

export type PosDeviceListRow = Awaited<ReturnType<typeof getPosDevices>>[number]
