import { PageHeader } from "@/components/shared/page-header"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { AddEpraPriceDialog } from "@/components/stations/add-epra-price-dialog"
import { BulkUploadDialog } from "@/components/shared/bulk-upload-dialog"
import { bulkUploadEpraPrices } from "@/app/(portal)/stations/epra-prices/actions"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { EpraPricesTable } from "@/components/stations/epra-prices-table"
import { getEpraPrices } from "@/lib/data/epra-prices"
import { getFuelProductsForSelect } from "@/lib/data/stations"

export default async function EpraPricesPage() {
  const user = await requirePermission(["stations:monitor", "epra-prices:manage"])
  const canManage = hasPermission(user.roles, "epra-prices:manage")
  const [prices, products] = await Promise.all([getEpraPrices(), getFuelProductsForSelect()])

  return (
    <div>
      <PageHeader
        title="EPRA Prices"
        description="Current and historical pump prices used for transaction pricing"
        actions={
          canManage ? (
            <>
              <BulkUploadDialog
                title="Bulk upload EPRA prices"
                description="Upload the latest pump prices. Each row closes the product's current price and starts the new one on its effective date, so price history is preserved."
                templateName="epra-prices-template.csv"
                template={"product,price,effectiveFrom\nPMS,195.50,2026-10-15\nAGO,180.50,2026-10-15\n"}
                onUpload={bulkUploadEpraPrices}
              />
              <AddEpraPriceDialog products={products} />
            </>
          ) : undefined
        }
      />
      <StationsSubNav />
      <EpraPricesTable prices={prices} />
    </div>
  )
}
