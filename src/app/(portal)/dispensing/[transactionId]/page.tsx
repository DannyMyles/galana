import { PageHeader } from "@/components/shared/page-header"
import { DispensingPanel } from "@/components/pos/dispensing-panel"
import { getTransactionForDispensing, getStationForUser } from "@/lib/data/pos"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac/roles"

export default async function DispensingPage({
  params,
}: {
  params: Promise<{ transactionId: string }>
}) {
  const { transactionId } = await params
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, ["pos:dispense", "transactions:view-all"])) redirect("/dashboard")
  const transaction = await getTransactionForDispensing(transactionId)
  if (!hasPermission(session.user.roles, "transactions:view-all")) {
    const station = await getStationForUser(session.user.id)
    if (station?.id !== transaction.stationId) redirect("/transactions")
  }

  return (
    <div>
      <PageHeader
        title="POS Dispensing"
        description={`Pump dispensing for ${transaction.station.name}`}
      />
      <DispensingPanel
        transaction={{
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          authorisedQtyL: Number(transaction.authorisedQtyL),
          dispensedQtyL: transaction.dispensedQtyL ? Number(transaction.dispensedQtyL) : null,
          totalAmount: transaction.totalAmount ? Number(transaction.totalAmount) : null,
          unitTariff: Number(transaction.unitTariff),
          failureReason: transaction.failureReason,
          ticketNo: transaction.ticket.ticketNo,
          vehicleRegNo: transaction.ticket.vehicle?.regNo ?? null,
          customerName: transaction.ticket.customer.name,
          productName: transaction.ticket.product.name,
          stationName: transaction.station.name,
        }}
      />
    </div>
  )
}
