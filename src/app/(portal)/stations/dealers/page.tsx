import { PageHeader } from "@/components/shared/page-header"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { AddDealerDialog } from "@/components/stations/add-dealer-dialog"
import { DealersTable } from "@/components/stations/dealers-table"
import { getDealers } from "@/lib/data/dealers"

export default async function DealersPage() {
  const dealers = await getDealers()

  return (
    <div>
      <PageHeader
        title="Dealers"
        description="Station ownership and settlement information"
        actions={<AddDealerDialog />}
      />
      <StationsSubNav />
      <DealersTable dealers={dealers} />
    </div>
  )
}
