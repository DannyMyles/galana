"use client"

import { useState, type ReactElement } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { stationSchema } from "@/lib/validations/station"
import { saveStation } from "@/app/(portal)/stations/actions"

export interface StationFormValues {
  id?: string
  name: string
  code: string
  region: string
  county: string
  address: string | null
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  dealerId: string | null
  productIds: string[]
}

const NO_DEALER = "__none__"
const EMPTY: StationFormValues = { name: "", code: "", region: "", county: "", address: "", latitude: null, longitude: null, contactName: "", contactPhone: "", contactEmail: "", dealerId: null, productIds: [] }

function Field({ label, htmlFor, children, span2 }: { label: string; htmlFor?: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`grid gap-1.5 ${span2 ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export function StationFormDialog({
  trigger,
  triggerContent,
  station,
  dealers,
  products,
}: {
  trigger: ReactElement
  triggerContent?: React.ReactNode
  station?: StationFormValues
  dealers: { id: string; name: string }[]
  products: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState<StationFormValues>(station ?? EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof StationFormValues>(key: K, value: StationFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }))

  async function submit() {
    setError(null)
    const input = { ...v, latitude: v.latitude === null ? "" : String(v.latitude), longitude: v.longitude === null ? "" : String(v.longitude), address: v.address ?? "", contactName: v.contactName ?? "", contactPhone: v.contactPhone ?? "", contactEmail: v.contactEmail ?? "", dealerId: v.dealerId ?? undefined }
    const parsed = stationSchema.safeParse(input)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      await saveStation(station?.id ?? null, input)
      toast.success(station ? `${v.name} updated. JPL OMC sync queued.` : `${v.name} added. JPL OMC sync queued.`)
      setOpen(false)
      if (!station) setV(EMPTY)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save station.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setV(station ?? EMPTY); setError(null) } }}>
      <DialogTrigger render={trigger}>{triggerContent}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{station ? "Edit station" : "Add station"}</DialogTitle>
          <DialogDescription>Station master data. Changes are queued to sync back to JPL OMC onboarding.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Station name" htmlFor="st-name" span2><Input id="st-name" value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Galana Westlands" /></Field>
          <Field label="Station code" htmlFor="st-code"><Input id="st-code" value={v.code} onChange={(e) => set("code", e.target.value)} placeholder="SW001" /></Field>
          <Field label="Dealer">
            <Select value={v.dealerId ?? NO_DEALER} onValueChange={(d) => set("dealerId", !d || d === NO_DEALER ? null : d)}>
              <SelectTrigger className="w-full"><SelectValue>{(d: string) => (d === NO_DEALER ? "No dealer assigned" : dealers.find((x) => x.id === d)?.name ?? d)}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DEALER}>No dealer assigned</SelectItem>
                {dealers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Region" htmlFor="st-region"><Input id="st-region" value={v.region} onChange={(e) => set("region", e.target.value)} placeholder="Nairobi" /></Field>
          <Field label="County" htmlFor="st-county"><Input id="st-county" value={v.county} onChange={(e) => set("county", e.target.value)} placeholder="Nairobi" /></Field>
          <Field label="Address" htmlFor="st-address" span2><Input id="st-address" value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Street / landmark" /></Field>
          <Field label="GPS latitude" htmlFor="st-lat"><Input id="st-lat" inputMode="decimal" value={v.latitude ?? ""} onChange={(e) => set("latitude", e.target.value === "" ? null : (e.target.value as unknown as number))} placeholder="-1.2676" /></Field>
          <Field label="GPS longitude" htmlFor="st-lng"><Input id="st-lng" inputMode="decimal" value={v.longitude ?? ""} onChange={(e) => set("longitude", e.target.value === "" ? null : (e.target.value as unknown as number))} placeholder="36.8108" /></Field>
          <Field label="Contact person" htmlFor="st-cn"><Input id="st-cn" value={v.contactName ?? ""} onChange={(e) => set("contactName", e.target.value)} /></Field>
          <Field label="Contact phone" htmlFor="st-cp"><Input id="st-cp" value={v.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+254…" /></Field>
          <Field label="Contact email" htmlFor="st-ce" span2><Input id="st-ce" type="email" value={v.contactEmail ?? ""} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
          <Field label="Products dispensed" span2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-[#F6F7FB] px-4 py-3">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={v.productIds.includes(p.id)} onCheckedChange={(c) => set("productIds", c ? [...v.productIds, p.id] : v.productIds.filter((x) => x !== p.id))} />
                  {p.name}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {error && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-2.5 text-sm text-[#D01A2F]">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy} onClick={submit}>{busy ? "Saving…" : station ? "Save changes" : "Add station"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
