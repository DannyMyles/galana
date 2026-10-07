import { PageHeader } from "@/components/shared/page-header"
import { JaguarTicketFeed } from "@/components/reconciliation/jaguar-ticket-feed"
import { getJaguarTicketFeed } from "@/lib/data/jaguar-fuel-card"
import { requirePermission } from "@/lib/rbac/guard"

export default async function ReconciliationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission(["reconciliation:manage", "reconciliation:view"])
  const { from, to } = await searchParams
  const jaguarFeed = await getJaguarTicketFeed(from, to)

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Jaguar's ticket records, read live from the fuel card service. Matching POS and ledger records wait for the posting rules."
      />
      <JaguarTicketFeed customer={jaguarFeed.customer} result={jaguarFeed.result} from={jaguarFeed.from} to={jaguarFeed.to} />
    </div>
  )
}
