import { listDealers } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"

/** Dealers are Fuel Partner Management records in Frappe. Creating them stays in the Frappe onboarding workflow. */
export async function getDealers() {
  const rows = await listDealers()
  return toPlain(
    rows.map((d) => ({
      id: d.id,
      name: d.name,
      contactName: d.contactName,
      contactPhone: d.contactPhone,
      contactEmail: d.contactEmail,
      settlementAccount: d.settlementAccount,
      workflowState: d.workflowState,
      _count: { stations: d.stationCount },
    })),
  )
}

export type DealerListRow = Awaited<ReturnType<typeof getDealers>>[number]
