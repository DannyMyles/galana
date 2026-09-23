import { cn } from "@/lib/utils"

const KES_FORMATTER = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 2,
})

export function MoneyDisplay({
  amount,
  currency = "KES",
  decimals = 2,
  className,
}: {
  amount: number | string
  currency?: "KES"
  decimals?: number
  className?: string
}) {
  const value = typeof amount === "string" ? Number(amount) : amount
  void currency // reserved for future multi-currency support

  return (
    <span className={cn("tabular-nums", className)}>
      {decimals === 2 ? KES_FORMATTER.format(value) : value.toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
    </span>
  )
}

export function LitresDisplay({
  litres,
  className,
}: {
  litres: number | string
  className?: string
}) {
  const value = typeof litres === "string" ? Number(litres) : litres

  return (
    <span className={cn("tabular-nums", className)}>
      {value.toLocaleString("en-KE", { maximumFractionDigits: 2 })} L
    </span>
  )
}
