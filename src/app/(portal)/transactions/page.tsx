import { PageHeader } from "@/components/shared/page-header"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { getTransactions } from "@/lib/data/transactions"
import type { TransactionStatus } from "@prisma/client"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { rows, totalRows, pageSize } = await getTransactions({
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? (params.status as TransactionStatus) : undefined,
    page: params.page ? Number(params.page) : 0,
  })

  return (
    <div>
      <PageHeader title="Transactions" description="All fuelling transactions across every station" />
      <TransactionsTable rows={rows} totalRows={totalRows} pageSize={pageSize} />
    </div>
  )
}
