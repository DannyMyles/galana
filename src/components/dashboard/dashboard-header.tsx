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

export function DashboardHeader({ firstName, actions }: { firstName: string; actions?: ReactNode }) {
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
    <div className="flex flex-col gap-4 pb-7 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight tracking-tight text-[#0B0B33]">
          {now ? greetingFor(now) : "Welcome"}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-[#6A6C8C]">
          Here&apos;s what&apos;s happening with your fuel card solution today.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        {actions}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-[#E6E8F3]">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#1226AA]/10 text-[#1226AA]">
            <Clock className="size-5" />
          </div>
          <div className="min-w-[104px]">
            <p className="text-lg leading-tight font-semibold tracking-tight tabular-nums text-[#0B0B33]">
              {now ? format(now, "hh:mm:ss a") : "--:--:--"}
            </p>
            <p className="text-xs text-[#7B7E9C]">{now ? format(now, "EEE, d MMM yyyy") : " "}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
