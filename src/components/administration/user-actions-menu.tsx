"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { UserStatus } from "@prisma/client"
import { setUserStatus, resetUserPassword } from "@/app/(portal)/administration/users/actions"

export function UserActionsMenu({ userId, status }: { userId: string; status: UserStatus }) {
  const router = useRouter()
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleStatus(next: UserStatus) {
    try {
      await setUserStatus(userId, next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user.")
    }
  }

  async function handleReset() {
    try {
      const result = await resetUserPassword(userId)
      setTempPassword(result.tempPassword)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password.")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "ACTIVE" ? (
            <DropdownMenuItem onClick={() => handleStatus("INACTIVE")}>Deactivate</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleStatus("ACTIVE")}>Activate</DropdownMenuItem>
          )}
          {status !== "SUSPENDED" && (
            <DropdownMenuItem onClick={() => handleStatus("SUSPENDED")}>Suspend</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleReset}>Reset Password</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Share this temporary password securely — it will not be shown again.
          </p>
          <code className="rounded-md bg-muted px-3 py-2 text-sm font-mono">{tempPassword}</code>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
