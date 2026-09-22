"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Stations", href: "/stations" },
  { label: "Dealers", href: "/stations/dealers" },
  { label: "POS Devices", href: "/stations/pos-devices" },
  { label: "EPRA Prices", href: "/stations/epra-prices" },
]

export function StationsSubNav() {
  const pathname = usePathname()

  return (
    <div className="mb-6 flex gap-1 border-b">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 pb-2 text-sm font-medium",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
