import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ICON_TINTS = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
} as const

interface KpiCardProps {
  label: string
  value: ReactNode
  icon?: LucideIcon
  iconTint?: keyof typeof ICON_TINTS
  trend?: { value: string; direction: "up" | "down"; positiveIsGood?: boolean }
  helperText?: string
  className?: string
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconTint = "blue",
  trend,
  helperText,
  className,
}: KpiCardProps) {
  const trendIsGood = trend
    ? trend.direction === "up" === (trend.positiveIsGood ?? true)
    : null

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="flex items-center gap-4">
        {Icon && (
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", ICON_TINTS[iconTint])}>
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          {trend && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs",
                trendIsGood ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.value}
            </p>
          )}
          {helperText && (
            <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
