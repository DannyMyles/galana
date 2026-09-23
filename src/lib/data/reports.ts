import { prisma } from "@/lib/db/client"

export async function getFinanceReport() {
  const [funding, wallet, consumption, liability, exceptions] = await Promise.all([
    prisma.prepaidReceipt.aggregate({ _sum: { grossAmount: true } }),
    prisma.fuelWallet.findFirst(),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { dispensedQtyL: true } }),
    prisma.dealerSettlement.aggregate({ where: { status: "PENDING" }, _sum: { netPayableToDealer: true } }),
    prisma.reconciliationRecord.count({ where: { status: "EXCEPTION" } }),
  ])
  return {
    totalFunding: Number(funding._sum.grossAmount ?? 0),
    walletBalance: Number(wallet?.balance ?? 0),
    totalConsumptionLitres: Number(consumption._sum.dispensedQtyL ?? 0),
    dealerLiability: Number(liability._sum.netPayableToDealer ?? 0),
    outstandingReconciliation: exceptions,
  }
}

export async function getOpsReport() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const [activeStations, activePosDevices, todaysTransactions, failedTransactions, expiringTickets, topStations] = await Promise.all([
    prisma.station.count({ where: { status: "ACTIVE" } }),
    prisma.pOSDevice.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.transaction.count({ where: { status: "FAILED" } }),
    prisma.ticket.count({ where: { status: { in: ["ISSUED", "PARTIALLY_REDEEMED"] }, expiresAt: { lte: soon, gt: new Date() } } }),
    prisma.transaction.groupBy({ by: ["stationId"], where: { status: "COMPLETED" }, _sum: { dispensedQtyL: true }, orderBy: { _sum: { dispensedQtyL: "desc" } }, take: 5 }),
  ])
  const stations = await prisma.station.findMany({ where: { id: { in: topStations.map((s) => s.stationId) } }, select: { id: true, name: true } })
  const stationName = new Map(stations.map((s) => [s.id, s.name]))

  return {
    activeStations,
    activePosDevices,
    todaysTransactions,
    failedTransactions,
    expiringTickets,
    topStations: topStations.map((s) => ({ name: stationName.get(s.stationId) ?? "Unknown", litres: Number(s._sum.dispensedQtyL ?? 0) })),
  }
}

type Breakdown = { name: string; litres: number; amount: number }[]

function group<T>(items: T[], key: (t: T) => string, litres: (t: T) => number, amount: (t: T) => number): Breakdown {
  const map = new Map<string, { litres: number; amount: number }>()
  for (const item of items) {
    const k = key(item)
    const cur = map.get(k) ?? { litres: 0, amount: 0 }
    map.set(k, { litres: cur.litres + litres(item), amount: cur.amount + amount(item) })
  }
  return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.litres - a.litres)
}

/** US-RPT-012..015 — includes consumption by customer, vehicle and station. */
export async function getJaguarReport() {
  const [wallet, consumption, activeTickets, txns] = await Promise.all([
    prisma.fuelWallet.findFirst({ include: { customer: true } }),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { dispensedQtyL: true } }),
    prisma.ticket.count({ where: { status: { in: ["ISSUED", "PARTIALLY_REDEEMED"] }, expiresAt: { gt: new Date() } } }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { dispensedQtyL: true, totalAmount: true, station: { select: { name: true } }, ticket: { select: { customer: { select: { name: true } }, vehicle: { select: { regNo: true } } } } },
    }),
  ])
  const l = (t: (typeof txns)[number]) => Number(t.dispensedQtyL ?? 0)
  const a = (t: (typeof txns)[number]) => Number(t.totalAmount ?? 0)

  return {
    customerName: wallet?.customer.name ?? "—",
    prepaidBalance: Number(wallet?.balance ?? 0),
    totalConsumptionLitres: Number(consumption._sum.dispensedQtyL ?? 0),
    activeTickets,
    byCustomer: group(txns, (t) => t.ticket.customer.name, l, a),
    byVehicle: group(txns, (t) => t.ticket.vehicle?.regNo ?? "Unassigned", l, a),
    byStation: group(txns, (t) => t.station.name, l, a),
  }
}

/** US-RPT-016..020 — scoped to the dealer's own station when `stationId` is given. */
export async function getDealerReport(stationId?: string) {
  const txnWhere = stationId ? { stationId } : {}
  const [consumption, credits, transactionCount, failedTransactions, byStatus, recentFailures] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...txnWhere, status: "COMPLETED" }, _sum: { dispensedQtyL: true, totalAmount: true } }),
    prisma.dealerSettlement.aggregate({ where: { ...txnWhere, status: "PENDING" }, _sum: { netPayableToDealer: true } }),
    prisma.transaction.count({ where: txnWhere }),
    prisma.transaction.count({ where: { ...txnWhere, status: "FAILED" } }),
    prisma.dealerSettlement.groupBy({ by: ["status"], where: txnWhere, _count: { _all: true }, _sum: { netPayableToDealer: true } }),
    prisma.transaction.findMany({ where: { ...txnWhere, status: "FAILED" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reference: true, failureReason: true, createdAt: true } }),
  ])
  return {
    stationName: stationId ? (await prisma.station.findUnique({ where: { id: stationId }, select: { name: true } }))?.name ?? "Your station" : "All stations",
    stationConsumptionLitres: Number(consumption._sum.dispensedQtyL ?? 0),
    consumptionValue: Number(consumption._sum.totalAmount ?? 0),
    currentCredits: Number(credits._sum.netPayableToDealer ?? 0),
    transactionCount,
    failedTransactions,
    settlementStatus: byStatus.map((s) => ({ status: s.status as string, count: s._count._all, amount: Number(s._sum.netPayableToDealer ?? 0) })),
    recentFailures,
  }
}
