"use client"

import { useEffect, useState, type ReactNode } from "react"
import { LiveClock } from "@/components/dashboard/live-clock"
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

      <div className="flex w-full flex-col sm:flex-row lg:w-[600px]">
        {quote}
        <LiveClock now={now} />
      </div>
    </div>
  )
}
