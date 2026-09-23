"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { getSettings } from "@/lib/settings"
import { transitionTransaction } from "@/lib/transactions/state-machine"
import type { ReconciliationLevel } from "@prisma/client"

class ActionError extends Error {}

const num = (v: unknown) => Number(v ?? 0)
const close = (a: number, b: number) => Math.abs(a - b) < 0.01

interface Finding {
  level: ReconciliationLevel
  key: string
  subject: string
  expected: string
  actual: string
  ok: boolean
  transactionId?: string
  note?: string
}

/**
 * Runs all three reconciliation levels against Galana's own ledger. Comparisons with Jaguar's and the POS'
 * records (US-REC-001..003) need those feeds and switch on when the integration APIs are connected.
 * Idempotent: each subject keeps one record, updated in place; a previously resolved item that breaks
 * again re-opens as a fresh exception.
 */
export async function runReconciliationCheck() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "reconciliation:manage")) throw new ActionError("You do not have permission to run reconciliation.")

  const settings = await getSettings()
  const findings: Finding[] = []
  let ambiguous = 0

  // Ambiguous = authorised/fuelling with no progress past the stale threshold, so the outcome is unknown (US-TXN-012).
  const staleBefore = new Date(Date.now() - settings.staleTransactionMinutes * 60_000)
  const stale = await prisma.transaction.findMany({ where: { status: { in: ["AUTHORISED", "FUELLING_IN_PROGRESS"] }, updatedAt: { lt: staleBefore } } })
  for (const t of stale) {
    await transitionTransaction(prisma, t.id, "PENDING_RECONCILIATION", { actorId: session.user.id, note: `No progress for over ${settings.staleTransactionMinutes} minutes — outcome unknown` })
    await prisma.exceptionQueueItem.create({ data: { transactionId: t.id, reason: `Ambiguous transaction: stuck ${t.status.toLowerCase().replace(/_/g, " ")} for over ${settings.staleTransactionMinutes} min`, status: "OPEN" } })
    ambiguous += 1
  }

  // TICKET level: remaining entitlement must equal authorised minus completed consumption.
  const tickets = await prisma.ticket.findMany({ where: { status: { in: ["ISSUED", "PARTIALLY_REDEEMED", "REDEEMED"] } }, include: { transactions: { where: { status: "COMPLETED" } } } })
  for (const ticket of tickets) {
    const consumed = ticket.transactions.reduce((sum, t) => sum + num(t.dispensedQtyL), 0)
    const expected = Math.max(0, num(ticket.authorisedQuantityL) - consumed)
    findings.push({ level: "TICKET", key: `TICKET:${ticket.id}`, subject: ticket.ticketNo, expected: `${expected} L remaining`, actual: `${num(ticket.remainingQuantityL)} L remaining`, ok: close(expected, num(ticket.remainingQuantityL)) })
  }

  // TRANSACTION level: every completed transaction has exactly one matching settlement.
  const completed = await prisma.transaction.findMany({ where: { status: "COMPLETED" }, include: { settlement: true } })
  for (const t of completed) {
    const hasSettlement = !!t.settlement
    const matches = hasSettlement && close(num(t.settlement!.grossAmount), num(t.totalAmount))
    findings.push({
      level: "TRANSACTION", key: `TXN:${t.id}`, subject: t.reference, transactionId: t.id,
      expected: `Settlement of KES ${num(t.totalAmount).toLocaleString()}`, actual: hasSettlement ? `Settlement of KES ${num(t.settlement!.grossAmount).toLocaleString()}` : "No settlement",
      ok: matches,
    })
  }

  // FINANCIAL level.
  const [wallet, receipts, approvedTopUps, consumption, adjustments, openingSetting] = await Promise.all([
    prisma.fuelWallet.findFirstOrThrow(),
    prisma.prepaidReceipt.aggregate({ _sum: { grossAmount: true }, _count: true }),
    prisma.walletTopUpRequest.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true }, _count: true }),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { totalAmount: true } }),
    prisma.manualAdjustment.findMany({ where: { status: "APPROVED" } }),
    prisma.systemSetting.findUnique({ where: { key: "walletOpeningBalance" } }),
  ])
  const adj = adjustments.reduce((s, a) => s + (a.direction === "CREDIT" ? num(a.amount) : -num(a.amount)), 0)
  const movement = num(receipts._sum.grossAmount) - num(consumption._sum.totalAmount) + adj

  let opening = openingSetting ? Number(openingSetting.value) : null
  if (opening === null) {
    // First run: snapshot the opening balance so later drift is detectable.
    opening = num(wallet.balance) - movement
    await prisma.systemSetting.upsert({ where: { key: "walletOpeningBalance" }, update: { value: String(opening) }, create: { key: "walletOpeningBalance", value: String(opening) } })
  }
  const expectedBalance = opening + movement
  findings.push({ level: "FINANCIAL", key: "FIN:wallet", subject: "Fuel wallet ledger", expected: `KES ${expectedBalance.toLocaleString()} (opening + funding − consumption ± adjustments)`, actual: `KES ${num(wallet.balance).toLocaleString()}`, ok: close(expectedBalance, num(wallet.balance)) })
  findings.push({ level: "FINANCIAL", key: "FIN:receipts", subject: "Prepaid receipts vs approved top-ups", expected: `${approvedTopUps._count} top-ups · KES ${num(approvedTopUps._sum.amount).toLocaleString()}`, actual: `${receipts._count} receipts · KES ${num(receipts._sum.grossAmount).toLocaleString()}`, ok: approvedTopUps._count === receipts._count && close(num(approvedTopUps._sum.amount), num(receipts._sum.grossAmount)) })
  const settled = await prisma.dealerSettlement.aggregate({ where: { status: { not: "REVERSED" } }, _sum: { grossAmount: true } })
  findings.push({ level: "FINANCIAL", key: "FIN:settlements", subject: "Dealer settlements vs completed consumption", expected: `KES ${num(consumption._sum.totalAmount).toLocaleString()} consumed`, actual: `KES ${num(settled._sum.grossAmount).toLocaleString()} settled`, ok: close(num(consumption._sum.totalAmount), num(settled._sum.grossAmount)) })

  let matched = 0
  let exceptions = 0
  for (const f of findings) {
    const details = { key: f.key, subject: f.subject, expected: f.expected, actual: f.actual }
    const existing = await prisma.reconciliationRecord.findFirst({ where: { level: f.level, details: { path: ["key"], equals: f.key } }, orderBy: { createdAt: "desc" } })

    if (f.ok) {
      matched += 1
      if (existing && existing.status !== "RESOLVED") await prisma.reconciliationRecord.update({ where: { id: existing.id }, data: { status: "MATCHED", details } })
      else if (!existing) await prisma.reconciliationRecord.create({ data: { level: f.level, transactionId: f.transactionId, status: "MATCHED", details } })
      continue
    }

    exceptions += 1
    if (existing && existing.status === "EXCEPTION") {
      await prisma.reconciliationRecord.update({ where: { id: existing.id }, data: { details } })
      continue
    }
    const record = await prisma.reconciliationRecord.create({ data: { level: f.level, transactionId: f.transactionId, status: "EXCEPTION", details } })
    await prisma.exceptionQueueItem.create({ data: { reconciliationRecordId: record.id, transactionId: f.transactionId, reason: `${f.level.charAt(0)}${f.level.slice(1).toLowerCase()} reconciliation: ${f.subject} — expected ${f.expected}, found ${f.actual}`, status: "OPEN" } })
  }

  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "RECONCILIATION_CHECK_RUN", entityType: "ReconciliationRecord", newValues: { checked: findings.length, matched, exceptions, ambiguous }, result: "SUCCESS" })
  revalidatePath("/reconciliation")
  revalidatePath("/failed-transactions")
  return { checked: findings.length, matched, exceptions, ambiguous }
}

export async function resolveReconciliationRecord(recordId: string, notes: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "reconciliation:manage")) throw new ActionError("You do not have permission to resolve reconciliation exceptions.")
  if (notes.trim().length < 5) throw new ActionError("Describe how this was resolved (at least 5 characters).")

  const record = await prisma.reconciliationRecord.findUniqueOrThrow({ where: { id: recordId } })
  if (record.status !== "EXCEPTION") throw new ActionError("Only open exceptions can be resolved.")

  await prisma.$transaction([
    prisma.reconciliationRecord.update({ where: { id: recordId }, data: { status: "RESOLVED", resolutionNotes: notes.trim(), resolvedById: session.user.id, resolvedAt: new Date() } }),
    prisma.exceptionQueueItem.updateMany({ where: { reconciliationRecordId: recordId }, data: { status: "RESOLVED", resolutionNotes: notes.trim(), resolvedAt: new Date() } }),
  ])
  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "RECONCILIATION_EXCEPTION_RESOLVED", entityType: "ReconciliationRecord", entityId: recordId, oldValues: { status: "EXCEPTION" }, newValues: { status: "RESOLVED", notes }, result: "SUCCESS" })
  revalidatePath("/reconciliation")
  revalidatePath("/failed-transactions")
}
