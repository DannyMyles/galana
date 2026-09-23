"use client"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { cn } from "cn"
import { ChevronLeft, ChevronRight, ListChecks, type AppIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { TableSkeleton } from "@/components/shared/skeletons"

/** Standard right-aligned "Actions" column; render a <RowActions/> inside. */
export function actionsColumn<T>(cell: (row: T) => React.ReactNode): ColumnDef<T> {
  return {
    id: "actions",
    header: () => <span className="block text-right">Actions</span>,
    cell: ({ row }) => cell(row.original),
  }
}

const CARD_ROW =
  "border-0 hover:bg-transparent [&>td]:border-y [&>td]:border-[#EEF0F8] [&>td]:bg-white [&>td]:py-2.5 [&>td]:transition-colors [&>td:first-child]:rounded-l-2xl [&>td:first-child]:border-l [&>td:last-child]:rounded-r-2xl [&>td:last-child]:border-r hover:[&>td]:bg-[#FAFAFF]"

interface ServerPagination {
  pageIndex: number
  pageSize: number
  totalRows: number
  onPageChange: (pageIndex: number) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onRowClick?: (row: TData) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: AppIcon
  emptyAction?: React.ReactNode
  pagination?: ServerPagination
  variant?: "cards" | "plain"
}

/**
 * Thin wrapper around TanStack Table for the portal's list/audit views
 * (transactions, tickets, stations, settlements, reconciliation, audit log).
 * Pagination is server-driven by design — these tables back onto large,
 * financially significant datasets that should not be fetched in full.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription,
  emptyIcon = ListChecks,
  emptyAction,
  pagination,
  variant = "cards",
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: !!pagination,
  })

  const pageCount = pagination
    ? Math.max(1, Math.ceil(pagination.totalRows / pagination.pageSize))
    : 1

  if (isLoading) return <TableSkeleton cols={Math.max(1, columns.length - 1)} />
  if (error) return <ErrorState compact title="Couldn't load records" description={error} onRetry={onRetry} />

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#DADCEB] bg-white/60">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={variant === "plain" ? "overflow-hidden" : ""}>
        <Table className={variant === "cards" ? "border-separate border-spacing-y-1.5" : undefined}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={variant === "cards" ? "border-0 hover:bg-transparent" : undefined}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} onClick={onRowClick ? () => onRowClick(row.original) : undefined} className={cn(variant === "cards" ? CARD_ROW : undefined, onRowClick && "cursor-pointer")}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className={variant === "cards" ? CARD_ROW : undefined}>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing{" "}
            {pagination.totalRows === 0
              ? 0
              : pagination.pageIndex * pagination.pageSize + 1}
            –
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              pagination.totalRows
            )}{" "}
            of {pagination.totalRows}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex === 0}
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span>
              Page {pagination.pageIndex + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex + 1 >= pageCount}
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
