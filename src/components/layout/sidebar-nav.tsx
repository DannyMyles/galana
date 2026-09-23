"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftDoubleIcon, ArrowRightDoubleIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { hasPermission, type Role } from "@/lib/rbac/roles"
import { PORTAL_NAV } from "@/lib/nav/portal-nav"

export function SidebarNav({
  roles,
  collapsed,
  onToggle,
}: {
  roles: Role[]
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const items = PORTAL_NAV.filter((item) => hasPermission(roles, item.permission))

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 h-screen shrink-0 transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden bg-white shadow-[2px_0_24px_rgba(11,11,51,0.05)]">
        <div className={cn("flex shrink-0 items-center", collapsed ? "h-20 justify-center" : "h-28 px-7")}>
          {collapsed ? (
            <Image src="/logo-icon.png" alt="Galana Energies" width={40} height={36} className="h-9 w-auto" priority />
          ) : (
            <Image
              src="/galana-logo.jpeg"
              alt="Galana Energies"
              width={177}
              height={162}
              className="h-[76px] w-auto"
              priority
            />
          )}
        </div>

        <nav className={cn("flex flex-1 flex-col gap-1 overflow-y-auto py-2", collapsed ? "items-center px-3" : "px-4")}>
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex items-center text-[14px] font-medium transition-all duration-150",
                  collapsed ? "size-11 justify-center rounded-xl" : "gap-3.5 rounded-xl px-3.5 py-3",
                  isActive
                    ? "bg-gradient-to-r from-[#1226AA]/[0.12] to-[#1226AA]/[0.03] text-[#1226AA]"
                    : "text-[#5E6182] hover:bg-[#F3F4FB] hover:text-[#0B0B33]"
                )}
              >
                {isActive && !collapsed && (
                  <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1226AA]" />
                )}
                <Icon className={cn("size-[22px] shrink-0 transition-transform", !isActive && "group-hover:scale-105")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <p className="px-7 py-5 text-[11px] text-[#9A9DB8]">© {new Date().getFullYear()} Galana Energies</p>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-1/2 -right-4 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#000037] shadow-lg ring-1 ring-black/10 transition-all hover:bg-[#EB2239] hover:text-white"
      >
        <HugeiconsIcon icon={collapsed ? ArrowRightDoubleIcon : ArrowLeftDoubleIcon} size={16} strokeWidth={2} />
      </button>
    </aside>
  )
}
