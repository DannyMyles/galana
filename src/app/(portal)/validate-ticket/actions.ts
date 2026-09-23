"use server"

import { randomInt } from "node:crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { verifyPassword } from "@/lib/auth/password"
import { getStationForUser, getCurrentEpraPrice } from "@/lib/data/pos"
import { getSettings } from "@/lib/settings"
import { recordInitialEvent, transitionTransaction } from "@/lib/transactions/state-machine"

class ActionError extends Error {}

async function requireStationSession() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:validate-ticket")) {
    throw new ActionError("You do not have permission to validate tickets.")
  }
  const station = await getStationForUser(session.user.id)
  if (!station) throw new ActionError("Your account is not linked to a station.")
  return { user: session.user, station }
}

export interface ValidatedTicket {
  ticketId: string
  ticketNo: string
  customerName: string
  customerTier: string | null
  vehicleRegNo: string | null
  productId: string
  productName: string
  remainingQuantityL: number
  expiresAt: string
  unitTariff: number
  stationName: string
  stationId: string
  maxQuantityL: number
  maxValue: number
  mode: "OTP" | "QR_CODE"
}

export type ValidationResult = { ok: true; ticket: ValidatedTicket } | { ok: false; reason: string }

export async function validateTicket(mode: "OTP" | "QR_CODE", credential: string): Promise<ValidationResult> {
  const { user, station } = await requireStationSession()
  const value = credential.trim()
  if (!value) return { ok: false, reason: mode === "OTP" ? "Enter the OTP shown to the customer." : "No QR code was read." }

  const include = { customer: true, vehicle: true, product: true } as const
  let matched = null

  if (mode === "QR_CODE") {
    matched = await prisma.ticket.findUnique({ where: { qrCodeToken: value }, include })
  } else {
    const candidates = await prisma.ticket.findMany({ where: { otpHash: { not: null } }, include })
    for (const ticket of candidates) {
      if (ticket.otpHash && (await verifyPassword(value, ticket.otpHash))) {
        matched = ticket
        break
      }
    }
  }

  const audit = (result: "SUCCESS" | "FAILURE", reason?: string, entityId?: string) =>
    writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "TICKET_VALIDATION",
      entityType: "Ticket",
      entityId,
      result,
      failureReason: reason,
    })

  if (!matched) {
    await audit("FAILURE", "Unknown or invalid credential.")
    return { ok: false, reason: mode === "OTP" ? "Invalid OTP. Check the code and try again." : "This QR code is not recognised." }
  }

  const reject = async (reason: string): Promise<ValidationResult> => {
    await prisma.ticketValidation.create({
      data: { ticketId: matched.id, mode, stationId: station.id, validatedBy: user.id, isValid: false, reason },
    })
    await audit("FAILURE", reason, matched.id)
    return { ok: false, reason }
  }

  if (station.status !== "ACTIVE") return reject(`${station.name} is ${station.status.toLowerCase()} and cannot fulfil tickets.`)
  if (matched.status === "REDEEMED") return reject("This ticket has already been fully redeemed.")
  if (matched.status === "CANCELLED") return reject("This ticket has been cancelled.")
  if (matched.status === "EXPIRED" || matched.expiresAt <= new Date()) return reject("This ticket has expired.")
  if (!station.products.some((sp) => sp.productId === matched.productId && sp.isActive)) {
    return reject(`${station.name} is not authorised to dispense ${matched.product.name}.`)
  }
  const price = await getCurrentEpraPrice(matched.productId)
  if (!price) return reject(`No active EPRA price is configured for ${matched.product.name}.`)

  await prisma.ticketValidation.create({
    data: { ticketId: matched.id, mode, stationId: station.id, validatedBy: user.id, isValid: true },
  })
  await audit("SUCCESS", undefined, matched.id)

  const settings = await getSettings()
  return {
    ok: true,
    ticket: {
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
      maxQuantityL: settings.maxQuantityPerTxnL,
      maxValue: settings.maxValuePerTxn,
      mode,
    },
  }
}

export type AuthoriseResult = { ok: true; transactionId: string; duplicate?: boolean } | { ok: false; reason: string }

const OPEN_STATES = ["INITIATED", "TICKET_VALIDATED", "FUEL_AUTHORISATION_PENDING", "AUTHORISED", "FUELLING_IN_PROGRESS"] as const

export async function authoriseTicket(ticketId: string, quantityL: number, idempotencyKey: string): Promise<AuthoriseResult> {
  const { user, station } = await requireStationSession()

  // US-TXN-007 / US-POS-007: a retry with the same key, or a second attempt on a ticket that already has an open
  // transaction, returns the existing one instead of creating a duplicate.
  const existing = await prisma.transaction.findFirst({
    where: { OR: [{ idempotencyKey }, { ticketId, status: { in: [...OPEN_STATES] } }] },
    orderBy: { createdAt: "desc" },
  })
  if (existing) {
    if (existing.status === "FAILED" || existing.status === "REJECTED") {
      return { ok: false, reason: existing.failureReason ?? "This request was previously declined." }
    }
    return { ok: true, transactionId: existing.id, duplicate: true }
  }

  const [ticket, settings] = await Promise.all([
    prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { product: true, customer: { include: { wallet: true } } },
    }),
    getSettings(),
  ])

  const fail = async (reason: string): Promise<AuthoriseResult> => {
    await writeAuditLog({
      userId: user.id,
      role: user.roles[0],
      action: "TICKET_AUTHORISATION",
      entityType: "Ticket",
      entityId: ticketId,
      result: "FAILURE",
      failureReason: reason,
    })
    return { ok: false, reason }
  }

  if (station.status !== "ACTIVE") return fail(`${station.name} is ${station.status.toLowerCase()} and cannot fulfil tickets.`)
  if (!Number.isFinite(quantityL) || quantityL <= 0) return fail("Enter a quantity greater than zero.")
  if (quantityL > Number(ticket.remainingQuantityL)) return fail("Quantity exceeds the ticket's remaining authorised balance.")
  if (quantityL > settings.maxQuantityPerTxnL) return fail(`Quantity exceeds the per-transaction limit of ${settings.maxQuantityPerTxnL} L.`)

  const price = await getCurrentEpraPrice(ticket.productId)
  if (!price) return fail(`No active EPRA price is configured for ${ticket.product.name}.`)
  const wallet = ticket.customer.wallet
  if (!wallet) return fail("This customer has no active fuel wallet.")

  const totalAmount = Math.round(quantityL * Number(price.pricePerLitre) * 100) / 100
  if (totalAmount > settings.maxValuePerTxn) {
    return fail(`Value KES ${totalAmount.toLocaleString()} exceeds the per-transaction limit of KES ${settings.maxValuePerTxn.toLocaleString()}.`)
  }

  const reference = `TXN-${randomInt(10_000_000, 99_999_999)}`
  const device = await prisma.pOSDevice.findFirst({ where: { stationId: station.id, status: "ACTIVE" } })
  const insufficient = Number(wallet.balance) < totalAmount

  const transactionId = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        reference,
        ticketId: ticket.id,
        stationId: station.id,
        posDeviceId: device?.id,
        status: "INITIATED",
        authorisedQtyL: quantityL,
        unitTariff: price.pricePerLitre,
        idempotencyKey,
      },
    })
    await recordInitialEvent(tx, created.id, "INITIATED", user.id)
    await transitionTransaction(tx, created.id, "TICKET_VALIDATED", { actorId: user.id, note: "Ticket validated" })
    await transitionTransaction(tx, created.id, "FUEL_AUTHORISATION_PENDING", { actorId: user.id, note: "Checking wallet balance and limits" })

    if (insufficient) {
      const reason = "ERR_WALLET_INSUFFICIENT_FUNDS: Master allocation limit exceeded."
      await transitionTransaction(tx, created.id, "FAILED", { actorId: user.id, note: reason, data: { failureReason: reason } })
      await tx.exceptionQueueItem.create({ data: { transactionId: created.id, reason: "Insufficient Balance", status: "OPEN" } })
    } else {
      await transitionTransaction(tx, created.id, "AUTHORISED", { actorId: user.id, note: "Fuel authorised" })
    }
    return created.id
  })

  await writeAuditLog({
    userId: user.id,
    role: user.roles[0],
    action: "TICKET_AUTHORISATION",
    entityType: "Transaction",
    entityId: transactionId,
    newValues: { authorisedQtyL: quantityL, totalAmount },
    result: insufficient ? "FAILURE" : "SUCCESS",
    failureReason: insufficient ? "Insufficient wallet balance." : undefined,
  })

  if (insufficient) {
    return {
      ok: false,
      reason: `Insufficient wallet balance. Required KES ${totalAmount.toLocaleString()}, available KES ${Number(wallet.balance).toLocaleString()}.`,
    }
  }
  return { ok: true, transactionId }
}
