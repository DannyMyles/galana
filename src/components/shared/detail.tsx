import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "@/components/icons"
import type { AppIcon } from "@/components/icons"
import { cn } from "cn"

export function DetailPage({
  backHref,
  backLabel,
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  main,
  aside,
  children,
}: {
  backHref: string
  backLabel: string
  title: string
  subtitle?: ReactNode
  icon?: AppIcon
  badge?: ReactNode
  actions?: ReactNode
  main?: ReactNode
  aside?: ReactNode
  children?: ReactNode
}) {
  return (
    <div>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#6A6C8C] transition-colors hover:text-[#1226AA]">
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1226AA]/[0.08] text-[#1226AA]">
              <Icon className="size-7" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] leading-tight tracking-tight text-[#0B0B33]">{title}</h1>
              {badge}
            </div>
            {subtitle && <div className="mt-1 text-sm text-[#6A6C8C]">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {(main || aside) && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className={cn("flex flex-col gap-5", aside ? "lg:col-span-2" : "lg:col-span-3")}>{main}</div>
          {aside && <div className="flex flex-col gap-5">{aside}</div>}
        </div>
      )}
      {children && <div className="mt-5 flex flex-col gap-5">{children}</div>}
    </div>
  )
}

export function DetailSection({ title, description, actions, children, className }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-[#EEF0F8] bg-white p-6 shadow-[0_2px_12px_rgba(18,38,170,0.04)]", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base text-[#0B0B33]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#6A6C8C]">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

export interface DetailFieldItem {
  label: string
  value: ReactNode
}

export function DetailFields({ items, columns = 2 }: { items: DetailFieldItem[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-8 gap-y-4", columns === 1 && "grid-cols-1", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-2 xl:grid-cols-3")}>
      {items.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#6A6C8C]">{f.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-[#0B0B33]">{f.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DetailStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F8] bg-white px-5 py-4 shadow-[0_2px_12px_rgba(18,38,170,0.04)]">
      <p className="text-xs text-[#6A6C8C]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#0B0B33]">{value}</p>
    </div>
  )
}
