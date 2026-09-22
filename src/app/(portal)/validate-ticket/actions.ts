"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { verifyPassword } from "@/lib/auth/password"
import { getStationForUser, getCurrentEpraPrice } from "@/lib/data/pos"

class ActionError extends Error {}

async function requireStationSession() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:validate-ticket")) {
    throw new ActionError("You do not have permission to validate tickets.")
  }
  const station = await getStationForUser(session.user.id)
  if (!station) {
    throw new ActionError("Your account is not linked to a station.")
  }
  return { user: session.user, station }
}

export async function validateTicketByOtp(otp: string) {
  const { user, station } = await requireStationSession()

  const candidates = await prisma.ticket.findMany({
    where: {
      status: { in: ["ISSUED", "PARTIALLY_REDEEMED"] },
      expiresAt: { gt: new Date() },
      otpHash: { not: null },
    },
    include: { customer: true, vehicle: true, product: true },
  })

  let matched = null
  for (const ticket of candidates) {
    if (ticket.otpHash && (await verifyPassword(otp, ticket.otpHash))) {
      matched = ticket
      break
    }
  }

  if (!matched) {
    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "TICKET_VALIDATION",
      entityType: "Ticket",
      result: "FAILURE",
      failureReason: "Invalid or expired OTP.",
    })
    throw new ActionError("Invalid or expired OTP.")
  }

  const stationServesProduct = station.products.some((sp) => sp.productId === matched.productId)
  if (!stationServesProduct) {
    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "TICKET_VALIDATION",
      entityType: "Ticket",
      entityId: matched.id,
      result: "FAILURE",
      failureReason: `Station does not dispense ${matched.product.name}.`,
    })
    throw new ActionError(`${station.name} does not dispense ${matched.product.name} for this ticket.`)
  }

  const price = await getCurrentEpraPrice(matched.productId)
  if (!price) {
    throw new ActionError(`No active EPRA price configured for ${matched.product.name}.`)
  }

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "TICKET_VALIDATION",
    entityType: "Ticket",
    entityId: matched.id,
    result: "SUCCESS",
  })

  return {
    ticketId: matched.id,
    ticketNo: matched.ticketNo,
    customerName: matched.customer.name,
    customerTier: matched.customer.tier,
    vehicleRegNo: matched.vehicle?.regNo ?? null,
    productId: matched.productId,
    productName: matched.product.name,
    remainingQuantityL: Number(matched.remainingQuantityL),
    expiresAt: matched.expiresAt.toISOString(),
    unitTariff: Number(price.pricePerLitre),
    stationName: station.name,
    stationId: station.id,
  }
}

export async function authoriseTicket(ticketId: string, quantityL: number) {
  const { user, station } = await requireStationSession()

  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { product: true, customer: { include: { wallet: true } } },
  })

  if (quantityL <= 0 || quantityL > Number(ticket.remainingQuantityL)) {
    throw new ActionError("Quantity exceeds the ticket's authorised balance.")
  }

  const price = await getCurrentEpraPrice(ticket.productId)
  if (!price) {
    throw new ActionError(`No active EPRA price configured for ${ticket.product.name}.`)
  }

  const wallet = ticket.customer.wallet
  if (!wallet) {
    throw new ActionError("This customer has no active fuel wallet.")
  }

  const totalAmount = quantityL * Number(price.pricePerLitre)
  const reference = `TXN-${Math.floor(100000 + Math.random() * 900000)}`

  if (Number(wallet.balance) < totalAmount) {
    const failed = await prisma.transaction.create({
      data: {
        reference,
        ticketId: ticket.id,
        stationId: station.id,
        status: "FAILED",
        authorisedQtyL: quantityL,
        unitTariff: price.pricePerLitre,
        failureReason: "ERR_WALLET_INSUFFICIENT_FUNDS: Master allocation limit exceeded.",
      },
    })

    await prisma.exceptionQueueItem.create({
      data: {
        transactionId: failed.id,
        reason: "Insufficient Balance",
        status: "OPEN",
      },
    })

    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "TICKET_AUTHORISATION",
      entityType: "Transaction",
      entityId: failed.id,
      result: "FAILURE",
      failureReason: "Insufficient wallet balance.",
    })

    throw new ActionError(
      `Insufficient wallet balance. Requested KES ${totalAmount.toLocaleString()}, available KES ${Number(
        wallet.balance
      ).toLocaleString()}.`
    )
  }

  const transaction = await prisma.transaction.create({
    data: {
      reference,
      ticketId: ticket.id,
      stationId: station.id,
      status: "AUTHORISED",
      authorisedQtyL: quantityL,
      unitTariff: price.pricePerLitre,
    },
  })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "TICKET_AUTHORISATION",
    entityType: "Transaction",
    entityId: transaction.id,
    newValues: { authorisedQtyL: quantityL, unitTariff: Number(price.pricePerLitre) },
    result: "SUCCESS",
  })

  return { transactionId: transaction.id }
}
