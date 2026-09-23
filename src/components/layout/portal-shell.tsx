"use client"

import { useEffect, useState, type ReactNode } from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Topbar, type TopbarNotification } from "@/components/layout/topbar"
import type { Role } from "@/lib/rbac/roles"

const STORAGE_KEY = "galana:sidebar-collapsed"

export function PortalShell({
  roles,
  userName,
  primaryRole,
  notifications,
  children,
}: {
  roles: Role[]
  userName: string
  primaryRole?: Role
  notifications: TopbarNotification[]
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // Hydrate after mount so the first client render matches the server HTML.
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setCollapsed(stored === "true")
      else if (window.innerWidth < 1024) setCollapsed(true)
    } catch {
      // localStorage unavailable — keep the default.
    }
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F6F7FB]">
      <SidebarNav roles={roles} collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={userName} primaryRole={primaryRole} roles={roles} notifications={notifications} />
        <main className="min-w-0 flex-1 p-4 lg:px-5 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
