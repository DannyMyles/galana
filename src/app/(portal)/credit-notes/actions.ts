"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"

class ActionError extends Error {}

export async function createCreditNote(input: { settlementId?: string; amount: number; reason: string; reference?: string }) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "credit-notes:manage")) throw new ActionError("You do not have permission to record credit notes.")
  if (!(input.amount > 0)) throw new ActionError("Enter an amount greater than zero.")
  if (!input.reason.trim()) throw new ActionError("A reason is required.")

  const customer = await prisma.customer.findFirstOrThrow()
  if (input.settlementId) {
    const exists = await prisma.dealerSettlement.findUnique({ where: { id: input.settlementId } })
    if (!exists) throw new ActionError("The selected settlement no longer exists.")
  }

  const note = await prisma.creditNote.create({
    data: { customerId: customer.id, settlementId: input.settlementId || null, amount: input.amount, reason: input.reason.trim(), reference: input.reference?.trim() || null, type: "MANUAL", makerId: session.user.id },
  })
  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: "CREDIT_NOTE_RECORDED", entityType: "CreditNote", entityId: note.id, newValues: input, result: "SUCCESS" })
  revalidatePath("/credit-notes")
}

export async function decideCreditNote(id: string, approve: boolean, comment: string) {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "credit-notes:approve")) throw new ActionError("You do not have permission to decide credit notes.")
  if (!approve && !comment.trim()) throw new ActionError("A reason is required to reject.")

  const note = await prisma.creditNote.findUniqueOrThrow({ where: { id } })
  if (note.status !== "PENDING") throw new ActionError("This credit note has already been decided.")
  if (note.makerId && note.makerId === session.user.id) throw new ActionError("You cannot approve a credit note you recorded.")

  await prisma.creditNote.update({ where: { id }, data: { status: approve ? "APPROVED" : "REJECTED", checkerId: session.user.id, checkerComment: comment.trim() || null, decidedAt: new Date() } })
  await writeAuditLog({ userId: session.user.id, role: session.user.roles[0], action: approve ? "CREDIT_NOTE_APPROVED" : "CREDIT_NOTE_REJECTED", entityType: "CreditNote", entityId: id, newValues: { comment }, result: "SUCCESS" })
  revalidatePath("/credit-notes")
}
