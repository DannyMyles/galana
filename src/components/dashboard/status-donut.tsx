"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const COLORS: Record<string, string> = {
  COMPLETED: "#0AC6A2",
  AUTHORISED: "#1226AA",
  FUELLING_IN_PROGRESS: "#1226AA",
  INITIATED: "#7C8BE0",
  TICKET_VALIDATED: "#7C8BE0",
  FUEL_AUTHORISATION_PENDING: "#F5C400",
  PENDING_RECONCILIATION: "#F5C400",
  FAILED: "#EB2239",
  REJECTED: "#EB2239",
  CANCELLED: "#B6B8CF",
  EXPIRED: "#B6B8CF",
  REVERSED: "#F75B8C",
}

function label(status: string) {
  return status.toLowerCase().split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
}

export function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const completed = data.find((d) => d.status === "COMPLETED")?.count ?? 0
  const pct = total ? Math.round((completed / total) * 100) : 0

  if (total === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No transactions yet.</p>
  }

  return (
    <div>
      <div className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={data.length > 1 ? 3 : 0}
              cornerRadius={8}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.status} fill={COLORS[d.status] ?? "#B6B8CF"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value), label(String(name))]}
              contentStyle={{ borderRadius: 12, border: "none", background: "#000037", color: "#fff", fontSize: 12 }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-3xl font-bold text-[#0B0B33]">{pct}%</span>
          <span className="text-xs text-[#7B7E9C]">Completed</span>
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#5E6182]">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[d.status] ?? "#B6B8CF" }} />
            {label(d.status)} <span className="font-semibold text-[#0B0B33]">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
