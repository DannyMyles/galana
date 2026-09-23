"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, CheckCircle2, X as Ban, ShieldCheck } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { EditTrigger } from "@/components/shared/icon-action-button"
import { UserFormDialog, type UserValues } from "@/components/administration/user-form-dialog"
import type { UserStatus } from "@prisma/client"
import { setUserStatus, resetUserPassword } from "@/app/(portal)/administration/users/actions"

export function UserRowActions({ user, stations, isSelf }: { user: UserValues & { id: string }; stations: { id: string; name: string }[]; isSelf: boolean }) {
  const router = useRouter()
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const status = user.status as UserStatus

  const setStatus = (next: UserStatus) => async () => {
    await setUserStatus(user.id, next)
    toast.success("User updated.")
    router.refresh()
  }

  const actions: RowAction[] = [
    { label: "View user", icon: Eye, href: `/administration/users/${user.id}` },
    { label: status === "ACTIVE" ? "Deactivate" : "Activate", icon: status === "ACTIVE" ? Ban : CheckCircle2, menuOnly: true, hidden: isSelf, destructive: status === "ACTIVE", onSelect: setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE") },
    { label: "Suspend", icon: Ban, menuOnly: true, hidden: isSelf || status === "SUSPENDED", destructive: true, onSelect: setStatus("SUSPENDED") },
    {
      label: "Reset password",
      icon: ShieldCheck,
      menuOnly: true,
      hidden: isSelf,
      onSelect: async () => {
        const result = await resetUserPassword(user.id)
        setTempPassword(result.tempPassword)
      },
    },
  ]

  return (
    <>
      <RowActions actions={actions}>
        <UserFormDialog stations={stations} user={user} trigger={<EditTrigger label={`Edit ${user.name}`} />} />
      </RowActions>
      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Password reset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Share this temporary password securely — it will not be shown again.</p>
          <code className="rounded-md bg-muted px-3 py-2 text-sm font-semibold tracking-wider">{tempPassword}</code>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
