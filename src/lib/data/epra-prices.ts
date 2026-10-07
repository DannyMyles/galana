import { listEpraPriceHistory } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

/** EPRA prices live in Galana Settings in Frappe. Newest first. */
export async function getEpraPrices() {
  const rows = await listEpraPriceHistory()
  return toPlain(
    rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      product: r.product,
      pricePerLitre: r.pricePerLitre,
      currency: r.currency,
      effectiveFrom: new Date(r.effectiveFrom),
      effectiveTo: r.effectiveTo ? new Date(r.effectiveTo) : null,
      isActive: r.isActive,
    })),
  )
}

export type EpraPriceListRow = Awaited<ReturnType<typeof getEpraPrices>>[number]
