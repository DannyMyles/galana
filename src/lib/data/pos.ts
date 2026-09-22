import { prisma } from "@/lib/db/client"

export async function getStationForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { station: { include: { products: { include: { product: true } } } } },
  })
  return user?.station ?? null
}

export async function getCurrentEpraPrice(productId: string) {
  const price = await prisma.epraPrice.findFirst({
    where: { productId, effectiveTo: null },
    orderBy: { effectiveFrom: "desc" },
  })
  return price
}

export async function getTransactionForDispensing(transactionId: string) {
  return prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: {
      station: true,
      ticket: { include: { customer: true, vehicle: true, product: true } },
    },
  })
}
