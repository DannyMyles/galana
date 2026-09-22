"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import type { AuditLogRow } from "@/lib/data/audit-log"

const columns: ColumnDef<AuditLogRow>[] = [
  { header: "Timestamp", cell: ({ row }) => <DateTimeDisplay value={row.original.createdAt} /> },
  { header: "User", cell: ({ row }) => row.original.user?.name ?? "System" },
  { header: "Role", cell: ({ row }) => row.original.role ?? "—" },
  { header: "Action", accessorKey: "action" },
  { header: "Entity", cell: ({ row }) => `${row.original.entityType}${row.original.entityId ? ` (${row.original.entityId.slice(0, 8)})` : ""}` },
  {
    header: "Result",
    cell: ({ row }) => (
      <StatusBadge status={row.original.result === "SUCCESS" ? "COMPLETED" : "FAILED"} />
    ),
  },
]

export function AuditLogTable({
  rows,
  totalRows,
  pageSize,
  entityTypes,
}: {
  rows: AuditLogRow[]
  totalRows: number
  pageSize: number
  entityTypes: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageIndex = Number(searchParams.get("page") ?? 0)

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-4">
        <Select
          value={searchParams.get("entityType") ?? undefined}
          onValueChange={(value) => updateParam("entityType", value)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Entity Types" />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No audit events yet"
        emptyDescription="Actions taken across the portal will be recorded here."
        pagination={{
          pageIndex,
          pageSize,
          totalRows,
          onPageChange: (nextPage) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("page", String(nextPage))
            router.push(`${pathname}?${params.toString()}`)
          },
        }}
      />
    </div>
  )
}
