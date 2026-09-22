import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export async function getEpraPrices() {
  const rows = await prisma.epraPrice.findMany({
    include: { product: true },
    orderBy: { effectiveFrom: "desc" },
  })
  return toPlain(rows)
}

export type EpraPriceListRow = Awaited<ReturnType<typeof getEpraPrices>>[number]
