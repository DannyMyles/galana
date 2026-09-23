"use client"

import type { ComponentProps } from "react"
import { Plus } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

type AddButtonProps = Omit<ComponentProps<typeof Button>, "children"> & { label: string }

/**
 * Rounded "+" button that smoothly reveals its label on hover / keyboard focus.
 * Ignores injected children so it can safely be used as a dialog/link trigger.
 */
export function AddButton({ label, className, ...props }: AddButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      className={cn("group/add h-10 min-w-10 rounded-full px-[11px] shadow-md shadow-[#EB2239]/30", className)}
      {...props}
    >
      <Plus className="size-[18px] shrink-0 transition-transform duration-300 group-hover/add:rotate-90 group-focus-visible/add:rotate-90" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover/add:ml-2 group-hover/add:mr-1 group-hover/add:max-w-48 group-hover/add:opacity-100 group-focus-visible/add:ml-2 group-focus-visible/add:mr-1 group-focus-visible/add:max-w-48 group-focus-visible/add:opacity-100">
        {label}
      </span>
    </Button>
  )
}
