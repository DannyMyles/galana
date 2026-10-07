import { PageHeader } from "@/components/shared/page-header"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { getTransactions } from "@/lib/data/transactions"
import { requirePermission } from "@/lib/rbac/guard"

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission(["transactions:view-all", "transactions:view-station"])
  const raw = await searchParams
  const status = raw.status === "COMPLETED" || raw.status === "FAILED" ? raw.status : undefined
  const page = Math.max(Number(raw.page ?? 0) || 0, 0)
  const filters = { search: raw.search, status, from: raw.from, to: raw.to }
  const result = await getTransactions({ search: filters.search, status, from: filters.from, to: filters.to, page })

  return (
    <div>
      <PageHeader title="Transactions" description="Fuelling transactions for Jaguar customers, read from the fuel card service." />
      <TransactionsList rows={result.rows} totalRows={result.totalRows} pageSize={result.pageSize} page={page} filters={{ ...filters, status }} />
    </div>
  )
}
