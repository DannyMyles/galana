"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { createDealerSchema, type CreateDealerInput } from "@/lib/validations/dealer"

class ActionError extends Error {}

export async function createDealer(input: CreateDealerInput) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "dealers:manage")) {
    throw new ActionError("You do not have permission to manage dealers.")
  }

  const parsed = createDealerSchema.safeParse(input)
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid dealer details.")
  }

  const dealer = await prisma.dealer.create({
    data: {
      ...parsed.data,
      contactEmail: parsed.data.contactEmail || undefined,
    },
  })

  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "DEALER_CREATED",
    entityType: "Dealer",
    entityId: dealer.id,
    newValues: parsed.data,
    result: "SUCCESS",
  })

  revalidatePath("/stations/dealers")
}
