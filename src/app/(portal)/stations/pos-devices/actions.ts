"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { createPosDeviceSchema, type CreatePosDeviceInput } from "@/lib/validations/pos-device"
import {
  addApprovedVersion as addVersionRecord,
  createPosDevice as createDeviceRecord,
  getPosDeviceRecord,
  removeApprovedVersion as removeVersionRecord,
  setPosDeviceStatus as setStatusRecord,
  type PosDeviceStatusCode,
} from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function requirePosManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos-devices:manage")) {
    throw new ActionError("You do not have permission to manage POS devices.")
  }
  if (!session.user.email) throw new ActionError("Your session has no email address, so the change cannot be recorded.")
  return session.user
}

export async function createPosDevice(input: CreatePosDeviceInput) {
  const user = await requirePosManager()
  const parsed = createPosDeviceSchema.safeParse(input)
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid device details.")
  }

  try {
    const device = await createDeviceRecord(user.email as string, {
      deviceId: parsed.data.deviceId,
      stationId: parsed.data.stationId,
      softwareVersion: parsed.data.softwareVersion || undefined,
    })
    await writeAuditLog({ userId: user.id, role: user.roles[0], action: "POS_DEVICE_CREATED", entityType: "POSDevice", entityId: device.id, newValues: parsed.data, result: "SUCCESS" })
  } catch (error) {
    await writeAuditLog({ userId: user.id, role: user.roles[0], action: "POS_DEVICE_CREATED", entityType: "POSDevice", newValues: parsed.data, result: "FAILURE", failureReason: error instanceof Error ? error.message : "Unknown error" })
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not register the device.")
  }
  revalidatePath("/stations/pos-devices")
}

export async function setPosDeviceStatus(deviceId: string, status: PosDeviceStatusCode) {
  const user = await requirePosManager()
  const before = await getPosDeviceRecord(deviceId)
  await setStatusRecord(user.email as string, deviceId, status)

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

export async function addApprovedVersion(version: string, notes?: string) {
  const user = await requirePosManager()
  const v = version.trim()
  if (!v) throw new ActionError("Enter a software version.")
  try {
    await addVersionRecord(user.email as string, v, notes?.trim() || undefined)
  } catch {
    throw new ActionError("That version is already approved.")
  }
  revalidatePath("/stations/pos-devices")
}

export async function removeApprovedVersion(id: string) {
  const user = await requirePosManager()
  await removeVersionRecord(user.email as string, id)
  revalidatePath("/stations/pos-devices")
}
