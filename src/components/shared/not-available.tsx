import { PageHeader } from "@/components/shared/page-header"
import { AlertTriangle } from "@/components/icons"

/** Placeholder for portal modules whose rules are not settled yet (see docs/prisma-to-frappe-map.md). */
export function NotAvailable({ title, description, reason }: { title: string; description?: string; reason: string }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex items-start gap-3 rounded-xl bg-[#F6F7FB] px-5 py-4 text-sm text-[#3B3E63]">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#6A6C8C]" />
        <p>{reason}</p>
      </div>
    </div>
  )
}
