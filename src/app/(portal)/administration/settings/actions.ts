"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { getSettings, type PortalSettings } from "@/lib/settings"

class ActionError extends Error {}

const RULES: Record<keyof PortalSettings, { min: number; max: number; label: string }> = {
  maxQuantityPerTxnL: { min: 1, max: 10000, label: "Max quantity per transaction" },
  maxValuePerTxn: { min: 1, max: 10_000_000, label: "Max value per transaction" },
  underCanopyDiscountPct: { min: 0, max: 100, label: "Under-canopy discount" },
  jaguarDiscountPct: { min: 0, max: 100, label: "Jaguar contractual discount" },
  staleTransactionMinutes: { min: 5, max: 1440, label: "Stale transaction threshold" },
}

export async function saveSettings(input: PortalSettings) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "settings:manage")) throw new ActionError("You do not have permission to change settings.")

  for (const [key, rule] of Object.entries(RULES)) {
    const value = input[key as keyof PortalSettings]
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) throw new ActionError(`${rule.label} must be between ${rule.min} and ${rule.max}.`)
  }

  const before = await getSettings()
  await prisma.$transaction(
    (Object.keys(RULES) as (keyof PortalSettings)[]).map((key) =>
      prisma.systemSetting.upsert({ where: { key }, update: { value: String(input[key]), updatedById: session.user.id }, create: { key, value: String(input[key]), updatedById: session.user.id } })
    )
  )
  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "SETTINGS_UPDATED", entityType: "SystemSetting", oldValues: before, newValues: input, result: "SUCCESS" })
  revalidatePath("/administration/settings")
}
