"use client"

import { useSearchParams } from "next/navigation"
import { Download } from "@/components/icons"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Downloads the current filtered view as CSV. Filters travel in the query string so the export matches the screen. */
export function ExportButton({ dataset, label = "Export CSV" }: { dataset: string; label?: string }) {
  const params = useSearchParams()
  const query = new URLSearchParams(params.toString())
  query.delete("page")
  const href = `/api/export/${dataset}${query.size ? `?${query}` : ""}`

  return (
    <a href={href} className={cn(buttonVariants({ variant: "outline" }))} download>
      <Download className="size-4" />
      {label}
    </a>
  )
}
