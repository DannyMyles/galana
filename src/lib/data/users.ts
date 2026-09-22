import { prisma } from "@/lib/db/client"

export async function getUsers() {
  return prisma.user.findMany({
    include: { roles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export type UserListRow = Awaited<ReturnType<typeof getUsers>>[number]
