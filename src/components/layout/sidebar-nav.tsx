"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { hasPermission, ROLE_LABELS, type Role } from "@/lib/rbac/roles"
import { PORTAL_NAV_GROUPS } from "@/lib/nav/portal-nav"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function SidebarNav({
  roles,
  userName,
  primaryRole,
  onNavigate,
}: {
  roles: Role[]
  userName: string
  primaryRole?: Role
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const groups = PORTAL_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(roles, item.permission)),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6">
        <div className="rounded-md bg-white px-3 py-1.5">
          <Image src="/logo-full.png" alt="Galana Energies" width={140} height={46} className="h-7 w-auto" priority />
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-1 first:mt-0">
            <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/35 uppercase first:pt-1">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            {primaryRole && (
              <p className="truncate text-xs text-sidebar-foreground/50">{ROLE_LABELS[primaryRole]}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
