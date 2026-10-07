"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { savePortalSettings } from "@/lib/integrations/fuel-card-partner"
import { getSettings, type PortalSettings } from "@/lib/settings"

class ActionError extends Error {}

const RULES: Record<keyof PortalSettings, { min: number; max: number; label: string }> = {
  maxQuantityPerTxnL: { min: 1, max: 10000, label: "Max quantity per transaction" },
  maxValuePerTxn: { min: 1, max: 10_000_000, label: "Max value per transaction" },
  underCanopyDiscountPerL: { min: 0, max: 1000, label: "Under-canopy discount per litre" },
  jaguarDiscountPerL: { min: 0, max: 1000, label: "Jaguar contractual discount per litre" },
  staleTransactionMinutes: { min: 5, max: 1440, label: "Stale transaction threshold" },
}

/**
 * Settings are stored on Galana Settings in Frappe, and the change is audited there.
 * Galana Finance (discounts:manage) may change only the two discount rates; every other
 * field keeps its stored value.
 */
export async function saveSettings(input: PortalSettings) {
  const session = await auth()
  if (!session?.user) throw new ActionError("You do not have permission to change settings.")
  const canManageAll = hasPermission(session.user.roles, "settings:manage")
  const canManageDiscounts = hasPermission(session.user.roles, "discounts:manage")
  if (!canManageAll && !canManageDiscounts) throw new ActionError("You do not have permission to change settings.")
  if (!session.user.email) throw new ActionError("Your session has no email address, so the change cannot be recorded.")

  const next: PortalSettings = canManageAll
    ? input
    : {
        ...(await getSettings()),
        underCanopyDiscountPerL: input.underCanopyDiscountPerL,
        jaguarDiscountPerL: input.jaguarDiscountPerL,
      }

  for (const [key, rule] of Object.entries(RULES)) {
    const value = next[key as keyof PortalSettings]
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) throw new ActionError(`${rule.label} must be between ${rule.min} and ${rule.max}.`)
  }

  await savePortalSettings(session.user.email, next)
  revalidatePath("/administration/settings")
}
