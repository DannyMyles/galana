import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export async function getCustomers() {
  const rows = await prisma.customer.findMany({
    include: {
      wallet: true,
      _count: { select: { vehicles: true, tickets: true } },
    },
    orderBy: { name: "asc" },
  })
  return toPlain(rows)
}

export type CustomerListRow = Awaited<ReturnType<typeof getCustomers>>[number]

export async function getCustomerDetail(id: string) {
  return prisma.customer.findUniqueOrThrow({
    where: { id },
    include: {
      wallet: true,
      vehicles: true,
      tickets: {
        include: { product: true, vehicle: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })
}
