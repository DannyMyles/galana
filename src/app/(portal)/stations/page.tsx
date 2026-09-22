import { PageHeader } from "@/components/shared/page-header"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { StationsFilters } from "@/components/stations/stations-filters"
import { StationsTable } from "@/components/stations/stations-table"
import { AddStationDialog } from "@/components/stations/add-station-dialog"
import { getStations, getDealersForSelect, getFuelProductsForSelect } from "@/lib/data/stations"
import { stationFiltersSchema } from "@/lib/validations/station"

export default async function StationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const filters = stationFiltersSchema.parse({
    search: rawParams.search,
    region: rawParams.region,
    status: rawParams.status,
    page: rawParams.page,
  })

  const [{ rows, totalRows, pageSize, regions }, dealers, products] = await Promise.all([
    getStations(filters),
    getDealersForSelect(),
    getFuelProductsForSelect(),
  ])

  return (
    <div>
      <PageHeader
        title="Stations"
        description="Manage, monitor, and configure all filling stations across operational regions"
        actions={<AddStationDialog dealers={dealers} products={products} />}
      />
      <StationsSubNav />
      <StationsFilters regions={regions} />
      <StationsTable rows={rows} totalRows={totalRows} pageSize={pageSize} />
    </div>
  )
}
