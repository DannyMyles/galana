import { headers } from "next/headers"
import { prisma } from "@/lib/db/client"
import type { Role } from "@/lib/rbac/roles"

interface WriteAuditLogInput {
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
 * Writes one immutable audit entry. Every server action that mutates
 * financial or master data must call this — see US-ADM-008 / US-AUD-001..006
 * for the fields auditors expect to be able to trace.
 */
export async function writeAuditLog(input: WriteAuditLogInput) {
  const headerList = await headers()

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      role: input.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues ?? undefined,
      newValues: input.newValues ?? undefined,
      result: input.result,
      failureReason: input.failureReason,
      ipAddress: headerList.get("x-forwarded-for") ?? undefined,
      device: headerList.get("user-agent") ?? undefined,
    },
  })
}
