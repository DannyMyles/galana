"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Clock } from "@/components/icons"
import { format } from "date-fns"

function greetingFor(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function DashboardHeader({
  firstName,
  actions,
  quote,
}: {
  firstName: string
  actions?: ReactNode
  quote?: ReactNode
}) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  return (
    <div className="flex flex-col gap-5 pb-7 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight tracking-tight text-[#0B0B33]">
          {now ? greetingFor(now) : "Welcome"}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-[#6A6C8C]">
          Here&apos;s what&apos;s happening with your fuel card solution today.
        </p>
        {actions && <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div>}
      </div>

      <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(18,38,170,0.07)] ring-1 ring-[#E6E8F3] sm:flex-row lg:w-[560px]">
        {quote}
        <div className="flex shrink-0 items-center gap-3 border-t border-[#E6E8F3] px-5 py-3.5 sm:border-t-0 sm:border-l">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#1226AA]/10 text-[#1226AA]">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-lg leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums text-[#0B0B33]">
              {now ? format(now, "hh:mm:ss a") : "--:--:--"}
            </p>
            <p className="text-xs whitespace-nowrap text-[#7B7E9C]">{now ? format(now, "EEE, d MMM yyyy") : "\u00a0"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
