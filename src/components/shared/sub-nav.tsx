"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function SubNav({ tabs }: { tabs: { label: string; href: string }[] }) {
  const pathname = usePathname()

  return (
    <div className="mb-6 max-w-full overflow-x-auto">
      <div className="inline-flex gap-1 rounded-2xl bg-[#ECEEFA] p-1">
        {tabs.map((tab) => {
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
