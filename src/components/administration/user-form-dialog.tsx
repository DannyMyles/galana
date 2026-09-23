"use client"

import { useState, type ReactElement, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROLES, ROLE_LABELS, type Role } from "@/lib/rbac/roles"
import { userSchema } from "@/lib/validations/user"
import { saveUser } from "@/app/(portal)/administration/users/actions"

export interface UserValues {
  id?: string
  name: string
  email: string
  phone: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  roleNames: Role[]
  stationId: string
}

const EMPTY: UserValues = { name: "", email: "", phone: "", status: "ACTIVE", roleNames: [], stationId: "" }

export function UserFormDialog({ trigger, triggerContent, user, stations }: { trigger: ReactElement; triggerContent: ReactNode; user?: UserValues; stations: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState<UserValues>(user ?? EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [temp, setTemp] = useState<string | null>(null)
  const set = <K extends keyof UserValues>(k: K, val: UserValues[K]) => setV((p) => ({ ...p, [k]: val }))
  const isManager = v.roleNames.includes("STATION_DEALER_MANAGER")

  function close(next: boolean) {
    setOpen(next)
    if (next) { setV(user ?? EMPTY); setError(null); setTemp(null) }
    else setTemp(null)
  }

  async function submit() {
    setError(null)
    const parsed = userSchema.safeParse(v)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      const result = await saveUser(user?.id ?? null, v)
      router.refresh()
      if (result.tempPassword) setTemp(result.tempPassword)
      else { toast.success("User updated."); setOpen(false) }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save user.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger render={trigger}>{triggerContent}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>{user ? "Change details, roles or access. Every change is audited." : "A temporary password is generated and shown once."}</DialogDescription>
        </DialogHeader>

        {temp ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">User created. Share this temporary password securely — it will not be shown again.</p>
            <code className="rounded-xl bg-[#F6F7FB] px-4 py-3 text-base font-semibold tracking-wider">{temp}</code>
            <DialogFooter><Button onClick={() => close(false)}>Done</Button></DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="u-name">Full name</Label><Input id="u-name" value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" value={v.email} disabled={!!user} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="u-phone">Phone</Label><Input id="u-phone" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+254…" /></div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={v.status} onValueChange={(s) => s && set("status", s as UserValues["status"])}>
                  <SelectTrigger className="w-full"><SelectValue>{(s: string) => s.charAt(0) + s.slice(1).toLowerCase()}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {isManager && (
                <div className="grid gap-1.5">
                  <Label>Station</Label>
                  <Select value={v.stationId} onValueChange={(s) => s && set("stationId", s)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select station">{(s: string) => stations.find((x) => x.id === s)?.name ?? "Select station"}</SelectValue></SelectTrigger>
                    <SelectContent>{stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2 sm:col-span-2">
                <Label>Roles</Label>
                <div className="grid gap-2 rounded-xl bg-[#F6F7FB] p-4 sm:grid-cols-2">
                  {ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={v.roleNames.includes(role)} onCheckedChange={(c) => set("roleNames", c ? [...v.roleNames, role] : v.roleNames.filter((r) => r !== role))} />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-2.5 text-sm text-[#D01A2F]">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button disabled={busy} onClick={submit}>{busy ? "Saving…" : user ? "Save changes" : "Create user"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
