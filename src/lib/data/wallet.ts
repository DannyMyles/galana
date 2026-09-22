import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

/**
 * The portal funds a single Jaguar prepaid wallet (see brief: Jaguar is the
 * sole funding customer). If more customers are onboarded later this should
 * take a customerId — kept simple for now since nothing in the wireframes
 * or user stories implies a customer switcher on this flow.
 */
export async function getPrimaryWallet() {
  return prisma.fuelWallet.findFirstOrThrow({ include: { customer: true } })
}

const DEFAULT_FUNDING_ACCOUNTS = ["KES 1234567890 (Jaguar)", "KES 9876543210 (Jaguar)"]

export async function getFundingAccountOptions() {
  const used = await prisma.walletTopUpRequest.findMany({
    distinct: ["fundingAccount"],
    select: { fundingAccount: true },
  })
  const accounts = new Set([...DEFAULT_FUNDING_ACCOUNTS, ...used.map((u) => u.fundingAccount)])
  return Array.from(accounts)
}

export async function getTopUpRequests(status?: "PENDING_APPROVAL" | "APPROVED" | "REJECTED") {
  const rows = await prisma.walletTopUpRequest.findMany({
    where: status ? { status } : undefined,
    include: { maker: true, checker: true },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(rows)
}

export type TopUpRequestRow = Awaited<ReturnType<typeof getTopUpRequests>>[number]
