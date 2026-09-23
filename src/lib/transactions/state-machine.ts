import type { Prisma, PrismaClient, TransactionStatus } from "@prisma/client"

/**
 * Happy path: INITIATED → TICKET_VALIDATED → FUEL_AUTHORISATION_PENDING →
 * AUTHORISED → FUELLING_IN_PROGRESS → COMPLETED. Every other state is an
 * exception state. Anything not listed here is an illegal transition.
 */
export const TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  INITIATED: ["TICKET_VALIDATED", "REJECTED", "FAILED", "CANCELLED", "EXPIRED"],
  TICKET_VALIDATED: ["FUEL_AUTHORISATION_PENDING", "REJECTED", "FAILED", "CANCELLED", "EXPIRED"],
  FUEL_AUTHORISATION_PENDING: ["AUTHORISED", "REJECTED", "FAILED", "CANCELLED", "EXPIRED"],
  AUTHORISED: ["FUELLING_IN_PROGRESS", "CANCELLED", "EXPIRED", "FAILED", "PENDING_RECONCILIATION"],
  FUELLING_IN_PROGRESS: ["COMPLETED", "CANCELLED", "FAILED", "PENDING_RECONCILIATION"],
  COMPLETED: ["REVERSED", "PENDING_RECONCILIATION"],
  PENDING_RECONCILIATION: ["COMPLETED", "FAILED", "CANCELLED", "REVERSED", "AUTHORISED"],
  FAILED: ["AUTHORISED", "PENDING_RECONCILIATION"],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  REVERSED: [],
}

export function canTransition(from: TransactionStatus, to: TransactionStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false
}

type Db = PrismaClient | Prisma.TransactionClient

export class InvalidTransitionError extends Error {}

/** Moves a transaction to `to`, enforcing the state machine and recording an audit-grade event. */
export async function transitionTransaction(
  db: Db,
  transactionId: string,
  to: TransactionStatus,
  opts: { actorId?: string; note?: string; data?: Prisma.TransactionUpdateInput } = {}
) {
  const current = await db.transaction.findUniqueOrThrow({ where: { id: transactionId }, select: { status: true } })
  if (!canTransition(current.status, to)) {
    throw new InvalidTransitionError(`Illegal transaction transition ${current.status} → ${to}.`)
  }
  await db.transaction.update({ where: { id: transactionId }, data: { ...opts.data, status: to } })
  await db.transactionEvent.create({
    data: { transactionId, fromStatus: current.status, toStatus: to, actorId: opts.actorId, note: opts.note },
  })
}

export async function recordInitialEvent(db: Db, transactionId: string, status: TransactionStatus, actorId?: string) {
  await db.transactionEvent.create({ data: { transactionId, toStatus: status, actorId, note: "Transaction created" } })
}
