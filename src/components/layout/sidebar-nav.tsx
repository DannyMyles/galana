"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasPermission, type Role } from "@/lib/rbac/roles"
import { PORTAL_NAV } from "@/lib/nav/portal-nav"

export function SidebarNav({
  roles,
  onNavigate,
}: {
  roles: Role[]
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const items = PORTAL_NAV.filter((item) => hasPermission(roles, item.permission))

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6">
        <div className="rounded-md bg-white px-3 py-1.5">
          <Image src="/logo-full.png" alt="Galana Energies" width={140} height={46} className="h-7 w-auto" priority />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <p className="px-6 py-4 text-xs text-sidebar-foreground/50">
        © {new Date().getFullYear()} Galana Energies
      </p>
    </div>
  )
}
