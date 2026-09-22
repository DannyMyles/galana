"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { createTopUpRequestSchema, type CreateTopUpRequestInput } from "@/lib/validations/topup"
import { getPrimaryWallet } from "@/lib/data/wallet"

class ActionError extends Error {}

export async function createTopUpRequest(input: CreateTopUpRequestInput) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "wallet:topup:create")) {
    throw new ActionError("You do not have permission to create top-up requests.")
  }

  const parsed = createTopUpRequestSchema.safeParse(input)
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid request details.")
  }

  const wallet = await getPrimaryWallet()

  const request = await prisma.walletTopUpRequest.create({
    data: { ...parsed.data, walletId: wallet.id, makerId: session.user.id },
  })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "WALLET_TOPUP_REQUESTED",
    entityType: "WalletTopUpRequest",
    entityId: request.id,
    newValues: parsed.data,
    result: "SUCCESS",
  })

  revalidatePath("/funding-wallet")
  revalidatePath("/funding-wallet/approvals")
}

export async function approveTopUpRequest(requestId: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "wallet:topup:approve")) {
    throw new ActionError("You do not have permission to approve top-up requests.")
  }

  const request = await prisma.walletTopUpRequest.findUniqueOrThrow({ where: { id: requestId } })

  if (request.status !== "PENDING_APPROVAL") {
    throw new ActionError("This request has already been decided.")
  }

  // US-FC-004: segregation of duties — a maker cannot approve their own request.
  if (request.makerId === session.user.id) {
    await writeAuditLog({
      userId: session.user.id,
      role: session.user.roles[0],
      action: "WALLET_TOPUP_APPROVED",
      entityType: "WalletTopUpRequest",
      entityId: requestId,
      result: "FAILURE",
      failureReason: "Maker cannot approve their own request.",
    })
    throw new ActionError("You cannot approve a request you created yourself.")
  }

  await prisma.$transaction(async (tx) => {
    await tx.walletTopUpRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", checkerId: session.user.id, decidedAt: new Date() },
    })

    await tx.fuelWallet.update({
      where: { id: request.walletId },
      data: { balance: { increment: request.amount } },
    })

    await tx.prepaidReceipt.create({
      data: { walletId: request.walletId, topUpRequestId: request.id, grossAmount: request.amount },
    })
  })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "WALLET_TOPUP_APPROVED",
    entityType: "WalletTopUpRequest",
    entityId: requestId,
    newValues: { amount: request.amount.toString() },
    result: "SUCCESS",
  })

  revalidatePath("/funding-wallet")
  revalidatePath("/funding-wallet/approvals")
  revalidatePath("/dashboard")
}

export async function rejectTopUpRequest(requestId: string, reason: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "wallet:topup:approve")) {
    throw new ActionError("You do not have permission to reject top-up requests.")
  }

  if (!reason.trim()) {
    throw new ActionError("A reason is required to reject a request.")
  }

  const request = await prisma.walletTopUpRequest.findUniqueOrThrow({ where: { id: requestId } })
  if (request.status !== "PENDING_APPROVAL") {
    throw new ActionError("This request has already been decided.")
  }

  await prisma.walletTopUpRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      checkerId: session.user.id,
      checkerComment: reason,
      decidedAt: new Date(),
    },
  })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "WALLET_TOPUP_REJECTED",
    entityType: "WalletTopUpRequest",
    entityId: requestId,
    newValues: { reason },
    result: "SUCCESS",
  })

  revalidatePath("/funding-wallet")
  revalidatePath("/funding-wallet/approvals")
}
