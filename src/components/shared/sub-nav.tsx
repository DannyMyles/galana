"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { hasPermission, type Permission, type Role } from "@/lib/rbac/roles"

export function SubNav({ tabs }: { tabs: { label: string; href: string; permission?: Permission | Permission[] }[] }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const roles = (session?.user?.roles ?? []) as Role[]
  const visible = tabs.filter((t) => !t.permission || !session || hasPermission(roles, t.permission))

  return (
    <div className="mb-6 max-w-full overflow-x-auto">
      <div className="inline-flex gap-1 rounded-2xl bg-[#ECEEFA] p-1">
        {visible.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150",
                isActive
                  ? "bg-white text-[#1226AA] shadow-sm"
                  : "text-[#5E6182] hover:bg-white/60 hover:text-[#0B0B33]"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Tabs driven by a query parameter (e.g. ?level=TICKET) rather than a route. */
export function QueryTabs({ param, tabs }: { param: string; tabs: { label: string; value: string }[] }) {
  const pathname = usePathname()
  const search = useSearchParams()
  const current = search.get(param) ?? tabs[0].value

  return (
    <div className="mb-5 max-w-full overflow-x-auto">
      <div className="inline-flex gap-1 rounded-2xl bg-[#ECEEFA] p-1">
        {tabs.map((tab) => {
          const params = new URLSearchParams(search.toString())
          params.delete("page")
          if (tab.value === tabs[0].value) params.delete(param)
          else params.set(param, tab.value)
          const isActive = current === tab.value
          return (
            <Link
              key={tab.value}
              href={params.size ? `${pathname}?${params}` : pathname}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150",
                isActive ? "bg-white text-[#1226AA] shadow-sm" : "text-[#5E6182] hover:bg-white/60 hover:text-[#0B0B33]"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
