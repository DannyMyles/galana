"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Categorical hues from the validated reference palette (light surface #fcfcfb, all checks pass).
// Assigned in fixed order; a category keeps its colour on every chart.
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
const INK = "#0b0b0b"
const INK_2 = "#52514e"
const GRID = "#e4e3df"

const fmtNumber = (n: number) => n.toLocaleString("en-KE", { maximumFractionDigits: 1 })
const fmtKes = (n: number) => `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`

function ChartFrame({ title, description, children, table }: {
  title: string
  description?: string
  children: React.ReactNode
  table: React.ReactNode
}) {
  return (
    <figure className="rounded-xl border border-[#E4E7F2] bg-white p-4">
      <figcaption className="mb-3">
        <p className="text-sm font-semibold text-[#1B1D3A]">{title}</p>
        {description && <p className="text-xs text-[#6A6C8C]">{description}</p>}
      </figcaption>
      {children}
      <details className="mt-3 text-xs text-[#6A6C8C]">
        <summary className="cursor-pointer select-none">Table view</summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </figure>
  )
}

/** Donut with the total in the centre and a labelled legend. Shares are shown, so no colour is needed to read it. */
export function DonutChart({ title, description, data }: { title: string; description?: string; data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const rows = data.map((d, i) => ({ ...d, color: SERIES[i % SERIES.length], share: total ? (d.value / total) * 100 : 0 }))
  return (
    <ChartFrame
      title={title}
      description={description}
      table={
        <table className="w-full text-left">
          <thead><tr><th className="pb-1">Category</th><th className="pb-1 text-right">Value</th><th className="pb-1 text-right">Share</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.name}><td>{r.name}</td><td className="text-right">{fmtNumber(r.value)}</td><td className="text-right">{r.share.toFixed(1)}%</td></tr>)}</tbody>
        </table>
      }
    >
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-[#6A6C8C]">No data in this period.</p>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-2">
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="#fcfcfb" strokeWidth={2}>
                  {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtNumber(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-[#0b0b0b]">{fmtNumber(total)}</span>
              <span className="text-xs text-[#6A6C8C]">total</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {rows.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className="inline-block size-2.5 rounded-sm" style={{ background: r.color }} />{r.name}</span>
                <span className="tabular-nums text-[#52514e]">{fmtNumber(r.value)} <span className="text-[#6A6C8C]">({r.share.toFixed(0)}%)</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartFrame>
  )
}

/** Horizontal bars: one category per row, sorted as given. Rounded data ends, labelled values. */
export function BarsChart({ title, description, data, unit = "L" }: { title: string; description?: string; data: { label: string; value: number }[]; unit?: "L" | "KES" }) {
  const fmt = unit === "KES" ? fmtKes : (n: number) => `${fmtNumber(n)} L`
  const height = Math.max(data.length * 36 + 24, 120)
  return (
    <ChartFrame
      title={title}
      description={description}
      table={
        <table className="w-full text-left">
          <thead><tr><th className="pb-1">Category</th><th className="pb-1 text-right">Value</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td className="text-right">{fmt(d.value)}</td></tr>)}</tbody>
        </table>
      }
    >
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6A6C8C]">No data in this period.</p>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12, fill: INK_2 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(Number(v))} cursor={{ fill: "#f3f2ef" }} />
              <Bar dataKey="value" fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={18} label={{ position: "right", formatter: (v: unknown) => fmtNumber(Number(v)), fontSize: 12, fill: INK }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  )
}

/** Daily trend. Line plus a light fill, one axis, the latest value labelled. */
export function TrendChart({ title, description, data, unit = "L" }: { title: string; description?: string; data: { date: string; value: number }[]; unit?: "L" | "KES" }) {
  const fmt = unit === "KES" ? fmtKes : (n: number) => `${fmtNumber(n)} L`
  return (
    <ChartFrame
      title={title}
      description={description}
      table={
        <table className="w-full text-left">
          <thead><tr><th className="pb-1">Date</th><th className="pb-1 text-right">Value</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.date}><td>{d.date}</td><td className="text-right">{fmt(d.value)}</td></tr>)}</tbody>
        </table>
      }
    >
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6A6C8C]">No data in this period.</p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: INK_2 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: INK_2 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={(l) => String(l)} />
              <Area type="monotone" dataKey="value" stroke={SERIES[0]} strokeWidth={2} fill="url(#trendFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  )
}
