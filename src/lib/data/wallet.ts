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

export interface TopUpFilters {
  status?: "PENDING_APPROVAL" | "APPROVED" | "REJECTED"
  search?: string
  makerId?: string
}

export async function getTopUpRequests(filters: TopUpFilters | TopUpFilters["status"] = {}) {
  const f: TopUpFilters = typeof filters === "string" ? { status: filters } : filters
  const rows = await prisma.walletTopUpRequest.findMany({
    where: {
      ...(f.status ? { status: f.status } : {}),
      ...(f.makerId ? { makerId: f.makerId } : {}),
      ...(f.search ? { OR: [{ reference: { contains: f.search, mode: "insensitive" } }, { fundingAccount: { contains: f.search, mode: "insensitive" } }, { remarks: { contains: f.search, mode: "insensitive" } }] } : {}),
    },
    include: { maker: true, checker: true },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(rows)
}

export type TopUpRequestRow = Awaited<ReturnType<typeof getTopUpRequests>>[number]
