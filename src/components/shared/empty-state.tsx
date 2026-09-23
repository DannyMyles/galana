import type { AppIcon } from "@/components/icons"
import type { ReactNode } from "react"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: AppIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      {Icon && (
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#1226AA]/[0.08]">
          <Icon className="size-6 text-[#1226AA]" />
        </div>
      )}
      <p className="text-base font-semibold text-[#0B0B33]">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
