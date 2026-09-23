"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PortalSettings } from "@/lib/settings"
import { saveSettings } from "@/app/(portal)/administration/settings/actions"
import { LoadingButton } from "@/components/shared/loading-button"

const GROUPS: { title: string; note: string; fields: { key: keyof PortalSettings; label: string; unit: string; help: string }[] }[] = [
  {
    title: "Transaction limits",
    note: "Enforced at authorisation on every redemption (US-TXN-006).",
    fields: [
      { key: "maxQuantityPerTxnL", label: "Max quantity per transaction", unit: "L", help: "Larger requests are declined at the station." },
      { key: "maxValuePerTxn", label: "Max value per transaction", unit: "KES", help: "Quantity × EPRA price may not exceed this." },
    ],
  },
  {
    title: "Discounts",
    note: "Applied when a transaction completes to calculate settlements and Jaguar credit notes (US-FIN-002/003).",
    fields: [
      { key: "underCanopyDiscountPct", label: "Station under-canopy discount", unit: "%", help: "Deducted from the dealer's net payable; raised as a credit note to Jaguar." },
      { key: "jaguarDiscountPct", label: "Jaguar contractual discount", unit: "%", help: "Raised as a credit note; the wallet is still loaded with the full prepaid amount." },
    ],
  },
  {
    title: "Reconciliation",
    note: "Defines an ambiguous transaction for the reconciliation queue (US-TXN-012).",
    fields: [{ key: "staleTransactionMinutes", label: "Stale transaction threshold", unit: "min", help: "Authorised or fuelling transactions with no progress for this long are queued for investigation." }],
  },
]

export function SettingsForm({ initial }: { initial: PortalSettings }) {
  const router = useRouter()
  const [values, setValues] = useState<Record<keyof PortalSettings, string>>(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])) as Record<keyof PortalSettings, string>)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await saveSettings(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])) as unknown as PortalSettings)
      toast.success("Settings saved.")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{group.note}</p>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {group.fields.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <div className="relative">
                  <Input id={f.key} type="number" step="0.01" value={values[f.key]} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} className="pr-12" />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-medium text-muted-foreground">{f.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground">{f.help}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end"><LoadingButton disabled={busy} onClick={submit} loading={busy} loadingText="Saving…">{"Save settings"}</LoadingButton></div>
    </div>
  )
}
