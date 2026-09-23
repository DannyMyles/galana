"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { DateFilter, FilterBar, SearchFilter, SelectFilter } from "@/components/shared/filters"
import { ExportButton } from "@/components/shared/export-button"
import { QueryTabs } from "@/components/shared/sub-nav"
import type { AuditLogRow } from "@/lib/data/audit-log"

const pretty = (value: unknown) => (value == null ? "—" : JSON.stringify(value, null, 2))

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium break-words">{children}</div>
    </div>
  )
}

export function AuditLogTable({ rows, totalRows, pageSize, entityTypes }: { rows: AuditLogRow[]; totalRows: number; pageSize: number; entityTypes: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<AuditLogRow | null>(null)

  const columns: ColumnDef<AuditLogRow>[] = [
    { header: "Timestamp", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} formatStr="dd MMM yyyy HH:mm:ss" /> },
    { header: "User", cell: ({ row }) => row.original.user?.name ?? "System" },
    { header: "Role", cell: ({ row }) => <span className="text-xs">{row.original.role?.replace(/_/g, " ").toLowerCase() ?? "—"}</span> },
    { header: "Action", cell: ({ row }) => <span className="font-medium">{row.original.action}</span> },
    { header: "Object", cell: ({ row }) => `${row.original.entityType}${row.original.entityId ? ` · ${row.original.entityId.slice(0, 8)}` : ""}` },
    { header: "Result", cell: ({ row }) => <StatusBadge status={row.original.result === "SUCCESS" ? "COMPLETED" : "FAILED"} /> },
    { header: "", id: "open", cell: ({ row }) => <Button variant="ghost" size="sm" onClick={() => setSelected(row.original)}>Details</Button> },
  ]

  return (
    <div>
      <QueryTabs
        param="preset"
        tabs={[
          { label: "All activity", value: "all" },
          { label: "Financial changes", value: "financial" },
          { label: "Manual adjustments", value: "adjustments" },
          { label: "Failures & reversals", value: "exceptions" },
        ]}
      />
      <FilterBar>
        <SearchFilter param="user" placeholder="Search by user name or email…" />
        <SelectFilter param="entityType" placeholder="All objects" options={entityTypes.map((e) => ({ value: e, label: e }))} />
        <SelectFilter param="result" placeholder="Any result" className="w-full sm:w-40" options={[{ value: "SUCCESS", label: "Success" }, { value: "FAILURE", label: "Failure" }]} />
        <DateFilter />
        <ExportButton dataset="audit-log" label="Export audit report" />
      </FilterBar>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No audit events match"
        emptyDescription="Adjust the filters or date range."
        pagination={{
          pageIndex: Number(searchParams.get("page") ?? 0),
          pageSize,
          totalRows,
          onPageChange: (next) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("page", String(next))
            router.push(`${pathname}?${params}`)
          },
        }}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selected.action}</SheetTitle>
                <SheetDescription>{selected.entityType}{selected.entityId ? ` · ${selected.entityId}` : ""}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Detail label="When"><DateTimeDisplay value={selected.createdAt} formatStr="dd MMM yyyy HH:mm:ss" /></Detail>
                  <Detail label="Result"><StatusBadge status={selected.result === "SUCCESS" ? "COMPLETED" : "FAILED"} /></Detail>
                  <Detail label="User">{selected.user?.name ?? "System"}</Detail>
                  <Detail label="Role">{selected.role?.replace(/_/g, " ").toLowerCase() ?? "—"}</Detail>
                  <Detail label="IP address">{selected.ipAddress ?? "—"}</Detail>
                  <Detail label="Device">{selected.device ? <span className="text-xs">{selected.device}</span> : "—"}</Detail>
                </div>
                {selected.failureReason && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">{selected.failureReason}</p>}
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Old values</p>
                  <pre className="overflow-x-auto rounded-xl bg-[#F6F7FB] p-3 text-xs">{pretty(selected.oldValues)}</pre>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">New values</p>
                  <pre className="overflow-x-auto rounded-xl bg-[#F6F7FB] p-3 text-xs">{pretty(selected.newValues)}</pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
