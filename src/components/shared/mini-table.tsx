import type { ReactNode } from "react"

export interface MiniColumn<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

/** Lightweight server-rendered table for related records on detail pages. */
export function MiniTable<T>({ columns, rows, empty = "Nothing to show yet." }: { columns: MiniColumn<T>[]; rows: T[]; empty?: string }) {
  if (!rows.length) return <p className="rounded-xl bg-[#F6F7FB] px-4 py-6 text-center text-sm text-[#6A6C8C]">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-[#6A6C8C]">
            {columns.map((c) => (
              <th key={c.header} className={`pb-2 pr-4 font-medium ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF0F8]">
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.header} className={`py-2.5 pr-4 ${c.className ?? ""}`}>{c.cell(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
