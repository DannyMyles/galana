"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal } from "@/components/icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StationStatus } from "@prisma/client"
import { setStationStatus } from "@/app/(portal)/stations/actions"

const TRANSITIONS: Record<StationStatus, { label: string; next: StationStatus }[]> = {
  ACTIVE: [{ label: "Suspend", next: "SUSPENDED" }, { label: "Deactivate", next: "DEACTIVATED" }],
  SUSPENDED: [{ label: "Reactivate", next: "ACTIVE" }, { label: "Deactivate", next: "DEACTIVATED" }],
  DEACTIVATED: [{ label: "Reactivate", next: "ACTIVE" }],
}

export function StationStatusMenu({
  stationId,
  status,
}: {
  stationId: string
  status: StationStatus
}) {
  const router = useRouter()

  async function handleChange(next: StationStatus) {
    try {
      await setStationStatus(stationId, next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update station.")
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
