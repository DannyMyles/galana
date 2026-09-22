"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { createStationSchema, type CreateStationInput } from "@/lib/validations/station"

class ActionError extends Error {}

async function requireStationManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "stations:manage")) {
    throw new ActionError("You do not have permission to manage stations.")
  }
  return session.user
}

export async function createStation(input: CreateStationInput) {
  const user = await requireStationManager()
  const parsed = createStationSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid station details.")
  }

  const { productIds, ...stationFields } = parsed.data

  try {
    const station = await prisma.station.create({
      data: {
        ...stationFields,
        products: { create: productIds.map((productId) => ({ productId })) },
      },
    })

    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "STATION_CREATED",
      entityType: "Station",
      entityId: station.id,
      newValues: parsed.data,
      result: "SUCCESS",
    })
  } catch (error) {
    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "STATION_CREATED",
      entityType: "Station",
      newValues: parsed.data,
      result: "FAILURE",
      failureReason: error instanceof Error ? error.message : "Unknown error",
    })
    throw new ActionError("A station with that code may already exist.")
  }

  revalidatePath("/stations")
}

export async function setStationStatus(
  stationId: string,
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
) {
  const user = await requireStationManager()

  const before = await prisma.station.findUniqueOrThrow({ where: { id: stationId } })
  await prisma.station.update({ where: { id: stationId }, data: { status } })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "STATION_STATUS_CHANGED",
    entityType: "Station",
    entityId: stationId,
    oldValues: { status: before.status },
    newValues: { status },
    result: "SUCCESS",
  })

  revalidatePath("/stations")
}
