"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { createPosDeviceSchema, type CreatePosDeviceInput } from "@/lib/validations/pos-device"
import type { POSStatus } from "@prisma/client"

class ActionError extends Error {}

async function requirePosManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos-devices:manage")) {
    throw new ActionError("You do not have permission to manage POS devices.")
  }
  return session.user
}

export async function createPosDevice(input: CreatePosDeviceInput) {
  const user = await requirePosManager()
  const parsed = createPosDeviceSchema.safeParse(input)

  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid device details.")
  }

  try {
    const device = await prisma.pOSDevice.create({ data: parsed.data })

    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "POS_DEVICE_REGISTERED",
      entityType: "POSDevice",
      entityId: device.id,
      newValues: parsed.data,
      result: "SUCCESS",
    })
  } catch (error) {
    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "POS_DEVICE_REGISTERED",
      entityType: "POSDevice",
      newValues: parsed.data,
      result: "FAILURE",
      failureReason: error instanceof Error ? error.message : "Unknown error",
    })
    throw new ActionError("A device with that ID may already be registered.")
  }

  revalidatePath("/stations/pos-devices")
}

export async function setPosDeviceStatus(deviceId: string, status: POSStatus) {
  const user = await requirePosManager()

  const before = await prisma.pOSDevice.findUniqueOrThrow({ where: { id: deviceId } })
  await prisma.pOSDevice.update({ where: { id: deviceId }, data: { status } })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "POS_DEVICE_STATUS_CHANGED",
    entityType: "POSDevice",
    entityId: deviceId,
    oldValues: { status: before.status },
    newValues: { status },
    result: "SUCCESS",
  })

  revalidatePath("/stations/pos-devices")
}
