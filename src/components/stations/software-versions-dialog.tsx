"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Cpu, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { addApprovedVersion, removeApprovedVersion } from "@/app/(portal)/stations/pos-devices/actions"

export function SoftwareVersionsDialog({ versions }: { versions: { id: string; version: string }[] }) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      setValue("")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Cpu className="size-4" />
        Approved versions
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approved POS software versions</DialogTitle>
          <DialogDescription>Devices running any other version are flagged in the device list.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. GTK-V2.5" onKeyDown={(e) => e.key === "Enter" && value.trim() && run(() => addApprovedVersion(value), "Version approved.")} />
          <Button disabled={busy || !value.trim()} onClick={() => run(() => addApprovedVersion(value), "Version approved.")}>Add</Button>
        </div>
        <ul className="flex flex-col gap-2">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-xl bg-[#F6F7FB] px-4 py-2.5 text-sm">
              <span className="font-medium">{v.version}</span>
              <button type="button" aria-label={`Revoke ${v.version}`} className="rounded-full p-1 text-muted-foreground hover:bg-white hover:text-[#EB2239]" onClick={() => run(() => removeApprovedVersion(v.id), "Version revoked.")}>
                <X className="size-4" />
              </button>
            </li>
          ))}
          {versions.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No versions approved yet — every device is flagged.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
