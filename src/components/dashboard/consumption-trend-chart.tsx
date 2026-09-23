"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"

interface TrendPoint {
  date: string
  litres: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length || !label) return null

  return (
    <div className="rounded-xl bg-[#000037] px-3.5 py-2.5 text-xs shadow-xl">
      <p className="text-white/70">{format(new Date(label), "dd MMM yyyy")}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">
        {payload[0].value.toLocaleString("en-KE", { maximumFractionDigits: 0 })} L
      </p>
    </div>
  )
}

export function ConsumptionTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1226AA" />
            <stop offset="100%" stopColor="#F75B8C" />
          </linearGradient>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1226AA" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#F75B8C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EEF0F8" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(new Date(value), "d MMM")}
          tick={{ fill: "#8B8EAA", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          minTickGap={36}
          dy={8}
        />
        <YAxis
          tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}K` : `${value}`)}
          tick={{ fill: "#8B8EAA", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1226AA", strokeDasharray: "4 4", strokeOpacity: 0.4 }} />
        <Area
          type="monotone"
          dataKey="litres"
          stroke="url(#trendStroke)"
          strokeWidth={3}
          fill="url(#trendFill)"
          activeDot={{ r: 6, fill: "#fff", stroke: "#1226AA", strokeWidth: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
