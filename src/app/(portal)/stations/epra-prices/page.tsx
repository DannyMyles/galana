import { PageHeader } from "@/components/shared/page-header"
import { StationsSubNav } from "@/components/stations/stations-subnav"
import { AddEpraPriceDialog } from "@/components/stations/add-epra-price-dialog"
import { EpraPricesTable } from "@/components/stations/epra-prices-table"
import { getEpraPrices } from "@/lib/data/epra-prices"
import { getFuelProductsForSelect } from "@/lib/data/stations"

export default async function EpraPricesPage() {
  const [prices, products] = await Promise.all([getEpraPrices(), getFuelProductsForSelect()])

  return (
    <div>
      <PageHeader
        title="EPRA Prices"
        description="Current and historical pump prices used for transaction pricing"
        actions={<AddEpraPriceDialog products={products} />}
      />
      <StationsSubNav />
      <EpraPricesTable prices={prices} />
    </div>
  )
}
