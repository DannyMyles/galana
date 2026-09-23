import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission, type Permission } from "@/lib/rbac/roles"
import { toCsv } from "@/lib/export/csv"
import { buildAuditWhere, type AuditFilters } from "@/lib/data/audit-log"
import { buildTransactionWhere, type TransactionFilters } from "@/lib/data/transactions"
import { getStationForUser } from "@/lib/data/pos"
import type { TransactionStatus } from "@prisma/client"

const PERMISSIONS: Record<string, Permission[]> = {
  "audit-log": ["audit-log:view"],
  transactions: ["transactions:view-all", "transactions:view-station"],
  funding: ["wallet:view"],
  settlements: ["settlements:manage", "settlements:view", "reports:dealer"],
  "credit-notes": ["credit-notes:manage", "credit-notes:approve", "credit-notes:view"],
  adjustments: ["adjustments:create", "adjustments:approve", "adjustments:view"],
  reversals: ["reversals:request", "reversals:approve", "reversals:view"],
}

const MAX_ROWS = 10_000

export async function GET(request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await params
  const session = await auth()
  const required = PERMISSIONS[dataset]
  if (!session?.user) return new NextResponse("Unauthorised", { status: 401 })
  if (!required || !hasPermission(session.user.roles, required)) return new NextResponse("Forbidden", { status: 403 })

  const q = Object.fromEntries(new URL(request.url).searchParams)
  let rows: Record<string, unknown>[] = []

  if (dataset === "audit-log") {
    const data = await prisma.auditLog.findMany({ where: buildAuditWhere(q as AuditFilters), include: { user: true }, orderBy: { createdAt: "desc" }, take: MAX_ROWS })
    rows = data.map((r) => ({
      timestamp: r.createdAt, user: r.user?.name ?? "System", email: r.user?.email ?? "", role: r.role ?? "", action: r.action,
      entity_type: r.entityType, entity_id: r.entityId ?? "", old_values: r.oldValues, new_values: r.newValues,
      ip_address: r.ipAddress ?? "", device: r.device ?? "", result: r.result, failure_reason: r.failureReason ?? "",
    }))
  } else if (dataset === "transactions") {
    const scope = hasPermission(session.user.roles, "transactions:view-all") ? undefined : (await getStationForUser(session.user.id))?.id ?? "none"
    const data = await prisma.transaction.findMany({
      where: buildTransactionWhere({ ...q, status: q.status as TransactionStatus } as TransactionFilters, scope),
      include: { station: true, ticket: { include: { customer: true, vehicle: true } } },
      orderBy: { createdAt: "desc" }, take: MAX_ROWS,
    })
    rows = data.map((t) => ({
      created_at: t.createdAt, reference: t.reference, status: t.status, station: t.station.name, ticket: t.ticket.ticketNo,
      customer: t.ticket.customer.name, vehicle: t.ticket.vehicle?.regNo ?? "", authorised_l: t.authorisedQtyL.toString(),
      dispensed_l: t.dispensedQtyL?.toString() ?? "", tariff: t.unitTariff.toString(), amount: t.totalAmount?.toString() ?? "", failure_reason: t.failureReason ?? "",
    }))
  } else if (dataset === "funding") {
    const data = await prisma.walletTopUpRequest.findMany({
      where: { ...(q.status ? { status: q.status as "APPROVED" } : {}), ...(q.search ? { reference: { contains: q.search, mode: "insensitive" } } : {}) },
      include: { maker: true, checker: true }, orderBy: { createdAt: "desc" }, take: MAX_ROWS,
    })
    rows = data.map((r) => ({
      created_at: r.createdAt, reference: r.reference, funding_account: r.fundingAccount, amount: r.amount.toString(), status: r.status,
      requested_by: r.maker.name, remarks: r.remarks ?? "", decided_by: r.checker?.name ?? "", decided_at: r.decidedAt ?? "", checker_comment: r.checkerComment ?? "",
    }))
  } else if (dataset === "settlements") {
    const scope = hasPermission(session.user.roles, ["settlements:manage", "settlements:view"]) ? undefined : (await getStationForUser(session.user.id))?.id ?? "none"
    const data = await prisma.dealerSettlement.findMany({
      where: { ...(scope ? { stationId: scope } : {}), ...(q.status ? { status: q.status as "PENDING" } : {}) },
      include: { station: true, transaction: true }, orderBy: { createdAt: "desc" }, take: MAX_ROWS,
    })
    rows = data.map((s) => ({
      created_at: s.createdAt, station: s.station.name, transaction: s.transaction.reference, gross: s.grossAmount.toString(),
      under_canopy_discount: s.underCanopyDiscount.toString(), jaguar_contractual_discount: s.jaguarContractualDiscount.toString(),
      net_payable_to_dealer: s.netPayableToDealer.toString(), status: s.status,
    }))
  } else if (dataset === "credit-notes") {
    const data = await prisma.creditNote.findMany({ include: { customer: true, settlement: { include: { transaction: true } }, maker: true, checker: true }, orderBy: { createdAt: "desc" }, take: MAX_ROWS })
    rows = data.map((c) => ({
      created_at: c.createdAt, type: c.type, customer: c.customer.name, amount: c.amount.toString(), status: c.status,
      transaction: c.settlement?.transaction.reference ?? "", reference: c.reference ?? "", reason: c.reason ?? "",
      raised_by: c.maker?.name ?? "System", decided_by: c.checker?.name ?? "", checker_comment: c.checkerComment ?? "",
    }))
  } else if (dataset === "adjustments") {
    const data = await prisma.manualAdjustment.findMany({ include: { maker: true, checker: true }, orderBy: { createdAt: "desc" }, take: MAX_ROWS })
    rows = data.map((a) => ({
      created_at: a.createdAt, direction: a.direction, amount: a.amount.toString(), reason: a.reason, status: a.status,
      requested_by: a.maker.name, decided_by: a.checker?.name ?? "", decided_at: a.decidedAt ?? "", checker_comment: a.checkerComment ?? "",
    }))
  } else if (dataset === "reversals") {
    const data = await prisma.transactionReversal.findMany({ include: { transaction: true, requestedBy: true, decidedBy: true }, orderBy: { createdAt: "desc" }, take: MAX_ROWS })
    rows = data.map((r) => ({
      created_at: r.createdAt, transaction: r.transaction.reference, amount: r.transaction.totalAmount?.toString() ?? "", reason: r.reason,
      status: r.status, requested_by: r.requestedBy.name, decided_by: r.decidedBy?.name ?? "", decision_comment: r.decisionComment ?? "",
    }))
  }

  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "EXPORT", entityType: dataset, newValues: { rows: rows.length, filters: q }, result: "SUCCESS" })

  const filename = `galana-${dataset}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse("﻿" + (toCsv(rows) || "no_data"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
  })
}
