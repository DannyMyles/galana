"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Overview", href: "/funding-wallet" },
  { label: "New Top-up Request", href: "/funding-wallet/topup" },
  { label: "Approvals", href: "/funding-wallet/approvals" },
]

export function WalletSubNav() {
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
