"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, CheckCircle2, X as Ban, ShieldCheck } from "@/components/icons"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { EditTrigger } from "@/components/shared/icon-action-button"
import { UserFormDialog, type UserValues } from "@/components/administration/user-form-dialog"
type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"
import { setUserStatus, resetUserPassword } from "@/app/(portal)/administration/users/actions"

export function UserRowActions({ user, stations, isSelf }: { user: UserValues & { id: string }; stations: { id: string; name: string }[]; isSelf: boolean }) {
  const router = useRouter()
  const status = user.status as UserStatus

  const setStatus = (next: UserStatus) => async () => {
    await setUserStatus(user.id, next === "ACTIVE" ? "ACTIVE" : "INACTIVE")
    toast.success("User updated.")
    router.refresh()
  }

  const actions: RowAction[] = [
    { label: "View user", icon: Eye, href: `/administration/users/${user.id}` },
    { label: status === "ACTIVE" ? "Deactivate" : "Activate", icon: status === "ACTIVE" ? Ban : CheckCircle2, menuOnly: true, hidden: isSelf, destructive: status === "ACTIVE", onSelect: setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE") },
    {
      label: "Reset password",
      icon: ShieldCheck,
      menuOnly: true,
      hidden: isSelf,
      onSelect: async () => {
        await resetUserPassword(user.id)
        toast.success(`A password reset link was emailed to ${user.email}.`)
      },
    },
  ]

  return (
    <>
      <RowActions actions={actions}>
        <UserFormDialog stations={stations} user={user} trigger={<EditTrigger label={`Edit ${user.name}`} />} />
      </RowActions>
    </>
  )
}
