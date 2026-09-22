import { prisma } from "@/lib/db/client"
import type { StationFilters } from "@/lib/validations/station"

const PAGE_SIZE = 5

export async function getStations(filters: StationFilters) {
  const where = {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { code: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.region ? { region: filters.region } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }

  const [rows, totalRows, regions] = await Promise.all([
    prisma.station.findMany({
      where,
      include: { dealer: true },
      orderBy: { name: "asc" },
      skip: filters.page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.station.count({ where }),
    prisma.station.findMany({
      distinct: ["region"],
      select: { region: true },
      orderBy: { region: "asc" },
    }),
  ])

  return {
    rows,
    totalRows,
    pageSize: PAGE_SIZE,
    regions: regions.map((r) => r.region),
  }
}

export async function getDealersForSelect() {
  return prisma.dealer.findMany({ orderBy: { name: "asc" } })
}

export async function getFuelProductsForSelect() {
  return prisma.fuelProduct.findMany({ orderBy: { name: "asc" } })
}

export type StationListRow = Awaited<ReturnType<typeof getStations>>["rows"][number]
