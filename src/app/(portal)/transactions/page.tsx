import { PageHeader } from "@/components/shared/page-header"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { getTransactions } from "@/lib/data/transactions"
import { getStationForUser } from "@/lib/data/pos"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { prisma } from "@/lib/db/client"
import type { TransactionStatus } from "@prisma/client"

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined)

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requirePermission(["transactions:view-all", "transactions:view-station"])
  const params = await searchParams
  const seesAll = hasPermission(user.roles, "transactions:view-all")

  // US-DM-010: dealer managers only ever see their own station's history.
  const scope = seesAll ? undefined : ((await getStationForUser(user.id))?.id ?? "none")
  const [{ rows, totalRows, pageSize }, stations] = await Promise.all([
    getTransactions(
      {
        search: one(params.search),
        status: one(params.status) as TransactionStatus | undefined,
        stationId: one(params.stationId),
        from: one(params.from),
        to: one(params.to),
        page: Number(one(params.page) ?? 0),
      },
      scope
    ),
    seesAll ? prisma.station.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve(undefined),
  ])

  return (
    <div>
      <PageHeader
        title={seesAll ? "Transactions" : "Station transactions"}
        description={seesAll ? "Every fuelling transaction across all stations — search, filter by date or station, and open one to trace it end to end." : "Completed and failed transactions at your station."}
      />
      <TransactionsTable rows={rows} totalRows={totalRows} pageSize={pageSize} stations={stations} />
    </div>
  )
}
