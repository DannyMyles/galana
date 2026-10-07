import { notFound } from "next/navigation"
import { toPlain } from "@/lib/serialize"
import { getPortalUser, getDealer, getPosDeviceRecord, getStation, getTicketStatus, listDealers, listFuelProducts, listPosDevices, listStations } from "@/lib/integrations/fuel-card-partner"

/** Shape of transaction rows on these pages. Empty until transactions move to Frappe. */
type PendingTransaction = { id: string; reference: string; status: string; totalAmount: number | null; createdAt: Date; ticket: { customer: { name: string } } }
const noTransactions: PendingTransaction[] = []

/** Station, its dealer, products and POS devices from Frappe. Transactions and users are pending the transaction migration. */
export async function getStationDetail(id: string) {
  const [station, dealers, products, devices] = await Promise.all([
    getStation(id).catch(() => null),
    listDealers(),
    listFuelProducts(),
    listPosDevices(),
  ])
  if (!station) notFound()
  const dealer = station.dealer ? dealers.find((d) => d.id === station.dealer) : undefined
  const productName = new Map(products.map((p) => [p.id, p.name]))
  const posDevices = devices.filter((d) => d.station?.id === station.id)
  return toPlain({
    ...station,
    dealer: dealer ? { id: dealer.id, name: dealer.name } : null,
    products: station.productIds.map((id) => ({ productId: id, product: { id, name: productName.get(id) ?? id } })),
    posDevices: posDevices.map((d) => ({ id: d.id, deviceId: d.deviceId, status: d.status, softwareVersion: d.softwareVersion })),
    dealerId: station.dealer,
    transactions: noTransactions,
    _count: { transactions: 0, posDevices: posDevices.length, users: 0 },
  })
}

export async function getDealerDetail(id: string) {
  const [dealer, stations, devices] = await Promise.all([
    getDealer(id).catch(() => null),
    listStations({ pageSize: 1000 }),
    listPosDevices(),
  ])
  if (!dealer) notFound()
  const own = stations.rows.filter((s) => s.dealer === dealer.id)
  return toPlain({
    ...dealer,
    stations: own.map((s) => ({
      ...s,
      _count: { posDevices: devices.filter((d) => d.station?.id === s.id).length },
    })),
  })
}

export const getUserDetail = (id: string) =>
  getPortalUser(id).then((u) => toPlain(u)).catch(() => notFound())

/** One fuel ticket from the fuel card service (Frappe). Validation attempts are not recorded there yet. */
export async function getTicketDetail(id: string) {
  const info = await getTicketStatus(id).catch(() => null)
  if (!info) notFound()
  const galanaStatus: Record<string, string> = { Reserved: "ISSUED", Dispensing: "PARTIALLY_REDEEMED", Consumed: "REDEEMED", Expired: "EXPIRED", Refunded: "CANCELLED" }
  return toPlain({
    id: info.ticket_reference,
    ticketNo: info.ticket_reference,
    authorizationCode: info.authorization_code,
    customer: { name: info.customer ?? "—" },
    vehicle: info.vehicle ? { regNo: info.vehicle } : null,
    status: galanaStatus[info.status] ?? "ISSUED",
    authorisedAmount: info.authorised_amount,
    remainingAmount: info.remaining_amount,
    consumedAmount: info.consumed_amount,
    dispensedLitres: info.dispensed_litres,
    unitPrice: info.unit_price,
    expiresAt: info.expires_on ? new Date(info.expires_on) : null,
    station: info.station,
    transactions: info.transaction_number
      ? [{ id: info.transaction_number, reference: info.transaction_number, station: info.station, amount: info.consumed_amount, status: info.failure_reason ? "FAILED" : "COMPLETED", completedOn: info.completed_on }]
      : [],
  })
}

export async function getPosDeviceDetail(id: string) {
  const device = await getPosDeviceRecord(id).catch(() => null)
  if (!device) notFound()
  return toPlain({
    id: device.id,
    deviceId: device.deviceId,
    make: device.make,
    model: device.model,
    softwareVersion: device.softwareVersion,
    status: device.status,
    lastSeenAt: device.lastSeenAt ? new Date(device.lastSeenAt) : null,
    station: device.station ? { id: device.station.id, name: device.station.name, code: device.station.code } : null,
    transactions: noTransactions,
  })
}

