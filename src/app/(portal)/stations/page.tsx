import { Plus } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { BulkUploadDialog } from "@/components/shared/bulk-upload-dialog"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { StationsFilters } from "@/components/stations/stations-filters"
import { StationsTable } from "@/components/stations/stations-table"
import { StationFormDialog } from "@/components/stations/station-form-dialog"
import { getStations, getDealersForSelect, getFuelProductsForSelect } from "@/lib/data/stations"
import { stationFiltersSchema } from "@/lib/validations/station"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { bulkUploadStations } from "@/app/(portal)/stations/actions"

const TEMPLATE = `name,code,region,county,address,latitude,longitude,contactName,contactPhone,contactEmail,dealer,products
Galana Karen,KR002,Nairobi,Nairobi,Ngong Road,-1.3,36.7,Jane Doe,+254700000001,karen@example.com,Galana Westlands Dealer Ltd,PMS;AGO
`

export default async function StationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePermission(["stations:monitor", "stations:manage"])
  const raw = await searchParams
  const filters = stationFiltersSchema.parse({ search: raw.search, region: raw.region, status: raw.status, page: raw.page })

  const [{ rows, totalRows, pageSize, regions }, dealers, products] = await Promise.all([getStations(filters), getDealersForSelect(), getFuelProductsForSelect()])
  const canManage = hasPermission(user.roles, "stations:manage")

  return (
    <div>
      <PageHeader
        title="Stations"
        description="Station master data, product availability and JPL OMC sync status."
        actions={
          canManage ? (
            <>
              <BulkUploadDialog
                title="Bulk upload stations"
                description="Upload a CSV to onboard many stations at once. Valid rows are created; invalid rows are reported with their line number."
                templateName="stations-template.csv"
                template={TEMPLATE}
                onUpload={bulkUploadStations}
              />
              <StationFormDialog dealers={dealers} products={products} trigger={<Button />} triggerContent={<><Plus className="size-4" />Add station</>} />
            </>
          ) : undefined
        }
      />
      <StationsSubNav />
      <StationsFilters regions={regions} />
      <StationsTable rows={rows} totalRows={totalRows} pageSize={pageSize} dealers={dealers} products={products} />
    </div>
  )
}
