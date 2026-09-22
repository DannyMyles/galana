"use client"

import { LogOut, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS, type Role } from "@/lib/rbac/roles"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function Topbar({
  userName,
  primaryRole,
  onMenuClick,
}: {
  userName: string
  primaryRole?: Role
  onMenuClick: () => void
}) {
  return (
    <header className="relative z-[60] flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Toggle navigation">
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">
            Good morning, {userName.split(" ")[0]}
          </p>
          <p className="hidden text-xs text-muted-foreground/70 sm:block">
            Here&apos;s what&apos;s happening with your fuel card solution today.
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-md p-1.5 hover:bg-accent">
          <Avatar className="size-8">
            <AvatarFallback>{initials(userName)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm sm:block">
            <p className="font-medium leading-none">{userName}</p>
            {primaryRole && (
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[primaryRole]}</p>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
