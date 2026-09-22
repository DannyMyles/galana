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

  const [activeStations, activePosDevices, todaysTransactions, failedTransactions, expiringTickets, topStations] =
    await Promise.all([
      prisma.station.count({ where: { status: "ACTIVE" } }),
      prisma.pOSDevice.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.transaction.count({ where: { status: "FAILED" } }),
      prisma.ticket.count({
        where: { status: { in: ["ISSUED", "PARTIALLY_REDEEMED"] }, expiresAt: { lte: soon } },
      }),
      prisma.transaction.groupBy({
        by: ["stationId"],
        where: { status: "COMPLETED" },
        _sum: { dispensedQtyL: true },
        orderBy: { _sum: { dispensedQtyL: "desc" } },
        take: 5,
      }),
    ])

  const stations = await prisma.station.findMany({
    where: { id: { in: topStations.map((s) => s.stationId) } },
    select: { id: true, name: true },
  })
  const stationName = new Map(stations.map((s) => [s.id, s.name]))

  return {
    activeStations,
    activePosDevices,
    todaysTransactions,
    failedTransactions,
    expiringTickets,
    topStations: topStations.map((s) => ({
      name: stationName.get(s.stationId) ?? "Unknown",
      litres: Number(s._sum.dispensedQtyL ?? 0),
    })),
  }
}

export async function getJaguarReport() {
  const [wallet, consumption, activeTickets] = await Promise.all([
    prisma.fuelWallet.findFirst({ include: { customer: true } }),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { dispensedQtyL: true } }),
    prisma.ticket.count({ where: { status: { in: ["ISSUED", "PARTIALLY_REDEEMED"] } } }),
  ])

  return {
    customerName: wallet?.customer.name ?? "—",
    prepaidBalance: Number(wallet?.balance ?? 0),
    totalConsumptionLitres: Number(consumption._sum.dispensedQtyL ?? 0),
    activeTickets,
  }
}

export async function getDealerReport() {
  const [consumption, credits, transactionCount, failedTransactions, settled] = await Promise.all([
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { dispensedQtyL: true } }),
    prisma.dealerSettlement.aggregate({ where: { status: "PENDING" }, _sum: { netPayableToDealer: true } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: "FAILED" } }),
    prisma.dealerSettlement.count({ where: { status: "SETTLED" } }),
  ])

  return {
    stationConsumptionLitres: Number(consumption._sum.dispensedQtyL ?? 0),
    currentCredits: Number(credits._sum.netPayableToDealer ?? 0),
    transactionCount,
    failedTransactions,
    settledCount: settled,
  }
}
