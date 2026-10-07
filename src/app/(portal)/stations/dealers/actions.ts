"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { createDealerSchema, type CreateDealerInput } from "@/lib/validations/dealer"
import { getDealer, updateDealer as updateDealerRecord } from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

/**
 * Dealers are onboarded in Frappe (Fuel Partner Management, with its workflow and KYC).
 * The portal can only edit existing dealers.
 */
export async function createDealer(input: CreateDealerInput): Promise<never> {
  void input
  throw new ActionError("Dealers are onboarded in the Frappe onboarding workflow. Ask the Galana admin to create the dealer there.")
}

export async function updateDealer(id: string, input: CreateDealerInput) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "dealers:manage")) {
    throw new ActionError("You do not have permission to manage dealers.")
  }
  if (!session.user.email) throw new ActionError("Your session has no email address, so the change cannot be recorded.")
  const parsed = createDealerSchema.safeParse(input)
  if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid dealer details.")

  const before = await getDealer(id)
  await updateDealerRecord(session.user.email, id, {
    contactName: parsed.data.contactName || null,
    contactPhone: parsed.data.contactPhone || null,
    contactEmail: parsed.data.contactEmail || null,
    settlementAccount: parsed.data.settlementAccount || null,
  })
  await writeAuditLog({
    userId: session.user.id,
    role: session.user.roles[0],
    action: "DEALER_UPDATED",
    entityType: "Dealer",
    entityId: id,
    oldValues: { name: before.name, contactName: before.contactName, contactPhone: before.contactPhone, contactEmail: before.contactEmail, settlementAccount: before.settlementAccount },
    newValues: parsed.data,
    result: "SUCCESS",
  })
  revalidatePath("/stations/dealers")
  revalidatePath("/stations")
}
