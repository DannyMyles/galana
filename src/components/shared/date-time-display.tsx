import { format } from "date-fns"

export function DateTimeDisplay({
  value,
  formatStr = "dd MMM yyyy HH:mm",
}: {
  value: Date | string
  formatStr?: string
}) {
  const date = typeof value === "string" ? new Date(value) : value
  return <time dateTime={date.toISOString()}>{format(date, formatStr)}</time>
}

export function DateDisplay({ value }: { value: Date | string }) {
  return <DateTimeDisplay value={value} formatStr="dd MMM yyyy" />
}
