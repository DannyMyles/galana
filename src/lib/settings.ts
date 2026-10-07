import { getPortalSettings } from "@/lib/integrations/fuel-card-partner"

/** Portal limits and discounts. Stored on Galana Settings in Frappe. */
export const SETTING_DEFAULTS = {
  maxQuantityPerTxnL: 500,
  maxValuePerTxn: 200000,
  underCanopyDiscountPerL: 0,
  jaguarDiscountPerL: 0,
  staleTransactionMinutes: 30,
} as const

export type SettingKey = keyof typeof SETTING_DEFAULTS

export interface PortalSettings {
  maxQuantityPerTxnL: number
  maxValuePerTxn: number
  underCanopyDiscountPerL: number
  jaguarDiscountPerL: number
  staleTransactionMinutes: number
}

export async function getSettings(): Promise<PortalSettings> {
  return getPortalSettings()
}
