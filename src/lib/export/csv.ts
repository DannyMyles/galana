export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return ""
    const text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value)
    // Prefix formula-looking values so spreadsheets don't execute them (CSV injection).
    const safe = /^[=+\-@]/.test(text) && Number.isNaN(Number(text)) ? `'${text}` : text
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\r\n")
}

/** Minimal RFC-4180 parser for bulk uploads. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") { row.push(cell.trim()); cell = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell.trim()); cell = ""
      if (row.some((c) => c !== "")) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some((c) => c !== "")) rows.push(row)
  return rows
}
