"use client"

import { useState, type ReactElement, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createDealerSchema, type CreateDealerInput } from "@/lib/validations/dealer"
import { createDealer, updateDealer } from "@/app/(portal)/stations/dealers/actions"

export interface DealerValues extends Required<{ [K in keyof CreateDealerInput]: string }> {
  id?: string
}

const EMPTY: DealerValues = { name: "", contactName: "", contactPhone: "", contactEmail: "", settlementAccount: "" }

export function DealerFormDialog({ trigger, triggerContent, dealer }: { trigger: ReactElement; triggerContent: ReactNode; dealer?: DealerValues }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState<DealerValues>(dealer ?? EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (key: keyof CreateDealerInput, value: string) => setV((p) => ({ ...p, [key]: value }))

  async function submit() {
    setError(null)
    const input: CreateDealerInput = { name: v.name, contactName: v.contactName, contactPhone: v.contactPhone, contactEmail: v.contactEmail, settlementAccount: v.settlementAccount }
    const parsed = createDealerSchema.safeParse(input)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      if (dealer?.id) await updateDealer(dealer.id, input)
      else await createDealer(input)
      toast.success(dealer ? `${v.name} updated.` : `${v.name} added.`)
      setOpen(false)
      if (!dealer) setV(EMPTY)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save dealer.")
    } finally {
      setBusy(false)
    }
  }

  const fields: { key: keyof CreateDealerInput; label: string; placeholder?: string; type?: string }[] = [
    { key: "name", label: "Dealer name", placeholder: "Galana Westlands Dealer Ltd" },
    { key: "contactName", label: "Contact name" },
    { key: "contactPhone", label: "Contact phone", placeholder: "+254…" },
    { key: "contactEmail", label: "Contact email", type: "email" },
    { key: "settlementAccount", label: "Settlement account", placeholder: "Bank account for dealer settlements" },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setV(dealer ?? EMPTY); setError(null) } }}>
      <DialogTrigger render={trigger}>{triggerContent}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{dealer ? "Edit dealer" : "Add dealer"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          {fields.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={`d-${f.key}`}>{f.label}</Label>
              <Input id={`d-${f.key}`} type={f.type} placeholder={f.placeholder} value={v[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            </div>
          ))}
        </div>
        {error && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-2.5 text-sm text-[#D01A2F]">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy} onClick={submit}>{busy ? "Saving…" : dealer ? "Save changes" : "Add dealer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
