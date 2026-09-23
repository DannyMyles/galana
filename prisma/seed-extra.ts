import type { PrismaClient } from "@prisma/client"

/** Idempotent additions on top of the base seed: lubricants, approved software, QR token, device check-in. */
export async function seedExtras(prisma: PrismaClient) {
  const lubricants = await prisma.fuelProduct.upsert({ where: { code: "LUBRICANTS" }, update: {}, create: { code: "LUBRICANTS", name: "Lubricants" } })

  const station = await prisma.station.findUnique({ where: { code: "SW001" } })
  if (station) {
    await prisma.stationProduct.upsert({ where: { stationId_productId: { stationId: station.id, productId: lubricants.id } }, update: {}, create: { stationId: station.id, productId: lubricants.id } })
    await prisma.station.update({ where: { id: station.id }, data: { contactName: "John M.", contactPhone: "+254700000000", latitude: -1.2676, longitude: 36.8108, address: "Waiyaki Way, Westlands" } })
    await prisma.pOSDevice.updateMany({ where: { stationId: station.id }, data: { lastSeenAt: new Date() } })
  }

  const hasPrice = await prisma.epraPrice.findFirst({ where: { productId: lubricants.id } })
  if (!hasPrice) await prisma.epraPrice.create({ data: { productId: lubricants.id, pricePerLitre: 650, effectiveFrom: new Date() } })

  await prisma.approvedSoftwareVersion.upsert({ where: { version: "GTK-V2.4" }, update: {}, create: { version: "GTK-V2.4", notes: "Current production build" } })
  await prisma.ticket.updateMany({ where: { ticketNo: "GTK-001234", qrCodeToken: null }, data: { qrCodeToken: "QR-GTK-001234" } })
}
