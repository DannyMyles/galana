import { headers } from "next/headers"
import { auth } from "@/auth"
import { writePortalAudit } from "@/lib/integrations/fuel-card-partner"
import type { Role } from "@/lib/rbac/roles"

interface WriteAuditLogInput {
  /** Ignored: the actor is the signed-in portal user. Kept so existing callers compile. */
  userId?: string
  role?: Role
  action: string
  entityType: string
  entityId?: string
  oldValues?: unknown
  newValues?: unknown
  result: "SUCCESS" | "FAILURE"
  failureReason?: string
}

/**
 * Writes one audit entry to Frappe's Activity Log (see docs/prisma-to-frappe-map.md).
 * Every server action that mutates financial or master data must call this.
 * The entry records the signed-in user's email, the IP and the device.
 */
export async function writeAuditLog(input: WriteAuditLogInput) {
  const session = await auth()
  const actor = session?.user?.email
  if (!actor) throw new Error("Cannot write an audit entry without a signed-in user")

  const headerList = await headers()
  await writePortalAudit({
    actor,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValues: { ...(input.oldValues as object | undefined), _role: input.role },
    newValues: { ...(input.newValues as object | undefined), _ip: headerList.get("x-forwarded-for") ?? undefined, _device: headerList.get("user-agent") ?? undefined },
    result: input.result,
    failureReason: input.failureReason,
  })
}
