import { notFound } from "next/navigation"
import { getTransaction, listTransactions, type PortalTransaction } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

export const TRANSACTIONS_PAGE_SIZE = 10

export type TransactionFilters = { search?: string; status?: "COMPLETED" | "FAILED"; from?: string; to?: string; page?: number }

/** Fuelling transactions for Galana customers, from the fuel card transaction log in Frappe. */
export async function getTransactions(filters: TransactionFilters) {
  const result = await listTransactions({
    search: filters.search || undefined,
    status: filters.status,
    fromDate: filters.from || undefined,
    toDate: filters.to || undefined,
    page: filters.page ?? 0,
    pageSize: TRANSACTIONS_PAGE_SIZE,
  })
  return toPlain({ rows: result.rows as PortalTransaction[], totalRows: result.totalRows, pageSize: result.pageSize })
}

export async function getTransactionDetail(id: string) {
  const t = await getTransaction(id).catch(() => null)
  if (!t) notFound()
  return toPlain(t)
}

export type TransactionListRow = Awaited<ReturnType<typeof getTransactions>>["rows"][number]
