import { listDealers, listFuelProducts, listStations, type PortalStation, type StationStatusCode } from "@/lib/integrations/fuel-card-partner"
import type { StationFilters } from "@/lib/validations/station"
import { toPlain } from "@/lib/serialize"

const PAGE_SIZE = 5

/** Station row in the shape the stations table reads. Stations live in Frappe (Fuel Partner Station). */
export function toStationRow(s: PortalStation, dealerName: Map<string, string>, productName: Map<string, string>) {
  return {
    id: s.id,
    name: s.name,
    code: s.code,
    region: s.region ?? "",
    county: s.county ?? "",
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    contactName: s.contactName,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    status: s.status,
    jplSyncStatus: s.jplSyncStatus,
    jplStationRef: s.jplStationRef,
    dealerId: s.dealer,
    dealer: s.dealer ? { id: s.dealer, name: dealerName.get(s.dealer) ?? s.dealer } : null,
    products: s.productIds.map((id) => ({
      productId: id,
      isActive: true,
      product: { id, name: productName.get(id) ?? id },
    })),
  }
}

export async function getStations(filters: StationFilters) {
  const [result, dealers, products] = await Promise.all([
    listStations({
      search: filters.search || undefined,
      region: filters.region || undefined,
      status: filters.status as StationStatusCode | undefined,
      page: filters.page,
      pageSize: PAGE_SIZE,
    }),
    listDealers(),
    listFuelProducts(),
  ])
  const dealerName = new Map(dealers.map((d) => [d.id, d.name]))
  const productName = new Map(products.map((p) => [p.id, p.name]))

  return {
    rows: toPlain(result.rows.map((s) => toStationRow(s, dealerName, productName))),
    totalRows: result.totalRows,
    pageSize: PAGE_SIZE,
    regions: result.regions,
  }
}

export async function getDealersForSelect() {
  return (await listDealers()).map((d) => ({ id: d.id, name: d.name, contactName: d.contactName, contactPhone: d.contactPhone, contactEmail: d.contactEmail, settlementAccount: d.settlementAccount }))
}

export async function getFuelProductsForSelect() {
  return (await listFuelProducts()).map((p) => ({ id: p.id, code: p.code, name: p.name }))
}

export type StationListRow = Awaited<ReturnType<typeof getStations>>["rows"][number]
