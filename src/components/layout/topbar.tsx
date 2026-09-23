"use client"

import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, LogOut, Settings, ChevronDownIcon } from "@/components/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { hasPermission, ROLE_LABELS, type Role } from "@/lib/rbac/roles"
import { PORTAL_NAV } from "@/lib/nav/portal-nav"

export interface TopbarNotification {
  id: string
  title: string
  description: string
  href: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const SETTINGS_LINKS = [
  { label: "Users & access", href: "/administration/users", permission: "users:manage" as const },
  { label: "Stations & devices", href: "/stations", permission: "stations:manage" as const },
  { label: "EPRA prices", href: "/stations/epra-prices", permission: "epra-prices:manage" as const },
  { label: "Audit log", href: "/administration/audit-log", permission: "audit-log:view" as const },
]

const iconButton =
  "relative flex size-10 items-center justify-center rounded-full bg-white text-[#3B3E63] ring-1 ring-[#E6E8F3] transition-all hover:bg-[#F3F4FB] hover:text-[#1226AA] focus-visible:ring-2 focus-visible:ring-[#1226AA] outline-none"

export function Topbar({
  userName,
  primaryRole,
  roles,
  notifications,
}: {
  userName: string
  primaryRole?: Role
  roles: Role[]
  notifications: TopbarNotification[]
}) {
  const pathname = usePathname()
  const router = useRouter()

  const current = [...PORTAL_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname.startsWith(item.href))
  const title = current?.label ?? "Galana Portal"
  const settings = SETTINGS_LINKS.filter((link) => hasPermission(roles, link.permission))

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-[#E6E8F3] bg-white/85 px-4 backdrop-blur-md lg:px-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <span className="text-[#9A9DB8]">Galana</span>
        <span className="text-[#C4C6DA]">/</span>
        <span className="font-semibold text-[#0B0B33]">{title}</span>
      </nav>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className={iconButton} aria-label="Settings">
            <Settings className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {settings.length === 0 && (
                <p className="px-2 py-2 text-sm text-muted-foreground">No settings available for your role.</p>
              )}
              {settings.map((link) => (
                <DropdownMenuItem key={link.href} onClick={() => router.push(link.href)}>
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={iconButton} aria-label="Notifications">
            <Bell className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#EB2239] text-[10px] font-semibold text-white ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
              )}
              {notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className="flex-col items-start gap-0.5 py-2.5"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-8 w-px bg-[#E6E8F3]" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-full py-1 pr-3 pl-1 transition-colors outline-none hover:bg-[#F3F4FB] focus-visible:ring-2 focus-visible:ring-[#1226AA]">
            <Avatar className="size-10">
              <AvatarFallback className="bg-gradient-to-br from-[#1226AA] to-[#000037] text-sm font-semibold text-white">
                {initials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm leading-tight font-semibold text-[#0B0B33]">{userName}</p>
              {primaryRole && <p className="text-xs text-[#7B7E9C]">{ROLE_LABELS[primaryRole]}</p>}
            </div>
            <ChevronDownIcon className="hidden size-4 text-[#7B7E9C] sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
