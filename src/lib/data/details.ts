import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

async function orNotFound<T>(p: Promise<T | null>): Promise<T> {
  const r = await p
  if (!r) notFound()
  return toPlain(r) as T
}

export const getStationDetail = (id: string) =>
  orNotFound(
    prisma.station.findUnique({
      where: { id },
      include: {
        dealer: true,
        products: { include: { product: true } },
        posDevices: true,
        transactions: { orderBy: { createdAt: "desc" }, take: 6, include: { ticket: { include: { customer: true } } } },
        _count: { select: { transactions: true, posDevices: true, users: true } },
      },
    })
  )

export const getDealerDetail = (id: string) =>
  orNotFound(prisma.dealer.findUnique({ where: { id }, include: { stations: { include: { _count: { select: { posDevices: true } } } } } }))

export const getUserDetail = (id: string) =>
  orNotFound(prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } }, station: true } }))

export const getTicketDetail = (id: string) =>
  orNotFound(
    prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        product: true,
        transactions: { orderBy: { createdAt: "desc" }, include: { station: true } },
        validations: { orderBy: { createdAt: "desc" }, take: 10, include: { station: true } },
      },
    })
  )

export const getSettlementDetail = (id: string) =>
  orNotFound(
    prisma.dealerSettlement.findUnique({
      where: { id },
      include: { station: { include: { dealer: true } }, transaction: { include: { ticket: { include: { customer: true, vehicle: true, product: true } } } }, creditNotes: true },
    })
  )

export const getCreditNoteDetail = (id: string) =>
  orNotFound(
    prisma.creditNote.findUnique({
      where: { id },
      include: { customer: true, maker: { select: { name: true } }, checker: { select: { name: true } }, settlement: { include: { transaction: { select: { id: true, reference: true } }, station: { select: { name: true } } } } },
    })
  )

export const getAdjustmentDetail = (id: string) =>
  orNotFound(prisma.manualAdjustment.findUnique({ where: { id }, include: { wallet: { include: { customer: true } }, maker: { select: { name: true } }, checker: { select: { name: true } } } }))

export const getReversalDetail = (id: string) =>
  orNotFound(
    prisma.transactionReversal.findUnique({
      where: { id },
      include: { transaction: { include: { station: true, ticket: { include: { customer: true } } } }, requestedBy: { select: { name: true } }, decidedBy: { select: { name: true } } },
    })
  )

export const getTopUpDetail = (id: string) =>
  orNotFound(
    prisma.walletTopUpRequest.findUnique({
      where: { id },
      include: { wallet: { include: { customer: true } }, maker: { select: { name: true } }, checker: { select: { name: true } }, prepaidReceipt: true },
    })
  )

export const getPosDeviceDetail = (id: string) =>
  orNotFound(prisma.pOSDevice.findUnique({ where: { id }, include: { station: true, transactions: { orderBy: { createdAt: "desc" }, take: 8 } } }))
