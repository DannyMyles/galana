"use client"

import type { ComponentProps } from "react"
import { Pencil } from "@/components/icons"
import type { AppIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

type Props = Omit<ComponentProps<typeof Button>, "children"> & { label: string; icon: AppIcon; destructive?: boolean }

/** Icon-only row button matching RowActions styling; safe as a dialog trigger (ignores injected children). */
export function IconActionButton({ label, icon: Icon, destructive, className, ...props }: Props) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className={cn(destructive ? "text-[#6A6C8C] hover:bg-[#EB2239]/10 hover:text-[#EB2239]" : "text-[#6A6C8C] hover:bg-[#1226AA]/[0.08] hover:text-[#1226AA]", className)}
      {...props}
    >
      <Icon className="size-4" />
    </Button>
  )
}

export function EditTrigger({ label, ...props }: Omit<Props, "icon">) {
  return <IconActionButton label={label} icon={Pencil} {...props} />
}
