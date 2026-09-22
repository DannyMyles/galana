import { prisma } from "@/lib/db/client"

export async function getDealers() {
  return prisma.dealer.findMany({
    include: { _count: { select: { stations: true } } },
    orderBy: { name: "asc" },
  })
}

export type DealerListRow = Awaited<ReturnType<typeof getDealers>>[number]
