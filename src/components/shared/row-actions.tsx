"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "@/components/icons"
import type { AppIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Spinner } from "@/components/shared/spinner"
import { cn } from "cn"

export interface RowAction {
  label: string
  icon: AppIcon
  href?: string
  onSelect?: () => void | Promise<void>
  destructive?: boolean
  hidden?: boolean
  /** Show only in the "more" menu even if space is available. */
  menuOnly?: boolean
}

const TONE = "text-[#6A6C8C] hover:bg-[#1226AA]/[0.08] hover:text-[#1226AA]"

/**
 * Standard row-level action cluster: up to two icon buttons with tooltips,
 * the rest in a "more" menu. `children` slot hosts dialog-based actions
 * (e.g. an edit dialog trigger) rendered as inline icon buttons.
 */
export function RowActions({ actions, children, className }: { actions?: RowAction[]; children?: ReactNode; className?: string }) {
  const [pending, setPending] = useState<string | null>(null)
  const visible = (actions ?? []).filter((a) => !a.hidden)
  const inline = visible.filter((a) => !a.menuOnly).slice(0, 2)
  const menu = visible.filter((a) => !inline.includes(a))

  async function run(action: RowAction) {
    if (!action.onSelect) return
    setPending(action.label)
    try {
      await action.onSelect()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${action.label} failed.`)
    } finally {
      setPending(null)
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center justify-end gap-0.5", className)} onClick={(e) => e.stopPropagation()}>
        {inline.map((a) => {
          const Icon = a.icon
          const busy = pending === a.label
          const tone = a.destructive ? "text-[#6A6C8C] hover:bg-[#EB2239]/10 hover:text-[#EB2239]" : TONE
          return (
            <Tooltip key={a.label}>
              <TooltipTrigger
                render={
                  a.href ? (
                    <Button variant="ghost" size="icon-sm" className={tone} aria-label={a.label} nativeButton={false} render={<Link href={a.href} />} />
                  ) : (
                    <Button variant="ghost" size="icon-sm" className={tone} aria-label={a.label} disabled={busy} onClick={() => run(a)} />
                  )
                }
              >
                {busy ? <Spinner /> : <Icon className="size-4" />}
              </TooltipTrigger>
              <TooltipContent>{a.label}</TooltipContent>
            </Tooltip>
          )
        })}
        {children}
        {menu.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className={TONE} aria-label="More actions" />}>
              {pending && menu.some((m) => m.label === pending) ? <Spinner /> : <MoreHorizontal className="size-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menu.map((a) => {
                const Icon = a.icon
                return a.href ? (
                  <DropdownMenuItem key={a.label} render={<Link href={a.href} />}>
                    <Icon className="size-4" />
                    {a.label}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={a.label} variant={a.destructive ? "destructive" : undefined} onClick={() => run(a)}>
                    <Icon className="size-4" />
                    {a.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  )
}
