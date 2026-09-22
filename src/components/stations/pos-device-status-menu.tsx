"use client"

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
import type { POSStatus } from "@prisma/client"
import { setPosDeviceStatus } from "@/app/(portal)/stations/pos-devices/actions"

const TRANSITIONS: Record<POSStatus, { label: string; next: POSStatus }[]> = {
  ACTIVE: [
    { label: "Mark Inactive", next: "INACTIVE" },
    { label: "Decommission", next: "DECOMMISSIONED" },
  ],
  INACTIVE: [
    { label: "Reactivate", next: "ACTIVE" },
    { label: "Decommission", next: "DECOMMISSIONED" },
  ],
  DECOMMISSIONED: [{ label: "Reactivate", next: "ACTIVE" }],
}

export function PosDeviceStatusMenu({ deviceId, status }: { deviceId: string; status: POSStatus }) {
  const router = useRouter()

  async function handleChange(next: POSStatus) {
    try {
      await setPosDeviceStatus(deviceId, next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update device.")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {TRANSITIONS[status].map((transition) => (
          <DropdownMenuItem key={transition.next} onClick={() => handleChange(transition.next)}>
            {transition.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
