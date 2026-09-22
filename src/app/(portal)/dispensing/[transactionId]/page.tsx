import { PageHeader } from "@/components/shared/page-header"
import { DispensingPanel } from "@/components/pos/dispensing-panel"
import { getTransactionForDispensing } from "@/lib/data/pos"

export default async function DispensingPage({
  params,
}: {
  params: Promise<{ transactionId: string }>
}) {
  const { transactionId } = await params
  const transaction = await getTransactionForDispensing(transactionId)

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
