import { prisma } from "@/lib/db/client"

export const SETTING_DEFAULTS = {
  maxQuantityPerTxnL: "500",
  maxValuePerTxn: "200000",
  underCanopyDiscountPct: "1.5",
  jaguarDiscountPct: "2",
  staleTransactionMinutes: "30",
} as const

export type SettingKey = keyof typeof SETTING_DEFAULTS

export interface PortalSettings {
  maxQuantityPerTxnL: number
  maxValuePerTxn: number
  underCanopyDiscountPct: number
  jaguarDiscountPct: number
  staleTransactionMinutes: number
}

export async function getSettings(): Promise<PortalSettings> {
  const rows = await prisma.systemSetting.findMany()
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const num = (key: SettingKey) => Number(map.get(key) ?? SETTING_DEFAULTS[key])
  return {
    maxQuantityPerTxnL: num("maxQuantityPerTxnL"),
    maxValuePerTxn: num("maxValuePerTxn"),
    underCanopyDiscountPct: num("underCanopyDiscountPct"),
    jaguarDiscountPct: num("jaguarDiscountPct"),
    staleTransactionMinutes: num("staleTransactionMinutes"),
  }
}
