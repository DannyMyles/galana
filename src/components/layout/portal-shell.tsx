"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Topbar } from "@/components/layout/topbar"
import type { Role } from "@/lib/rbac/roles"

const STORAGE_KEY = "galana:sidebar-open"

/**
 * The sidebar is a drawer (Sheet) rather than a persistent column, toggled
 * from the topbar's menu button. Open/closed state is remembered per
 * browser via localStorage so it doesn't reset on every navigation.
 */
export function PortalShell({
  roles,
  userName,
  primaryRole,
  children,
}: {
  roles: Role[]
  userName: string
  primaryRole?: Role
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    // One-time hydration from localStorage after mount, so the initial
    // client render matches the server's default and avoids a hydration
    // mismatch — not state derived from props/other state.
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setOpen(stored === "true")
    } catch {
      // localStorage unavailable (private mode, etc) — keep the default.
    }
  }, [])

  function updateOpen(next: boolean) {
    setOpen(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar userName={userName} primaryRole={primaryRole} onMenuClick={() => updateOpen(!open)} />

      <Sheet open={open} onOpenChange={updateOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-72 max-w-[85vw] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground data-[side=left]:inset-y-auto data-[side=left]:top-16 data-[side=left]:bottom-0 data-[side=left]:h-auto"
        >
          <SidebarNav
            roles={roles}
            userName={userName}
            primaryRole={primaryRole}
            onNavigate={() => updateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto bg-muted/30 p-6 lg:p-8">{children}</main>
    </div>
  )
}
