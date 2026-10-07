"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createAdjustment, decideAdjustment } from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function signedIn() {
  const session = await auth()
  if (!session?.user?.email) throw new ActionError("You must be signed in.")
  return session.user as { email: string }
}

export async function requestAdjustment(input: { customer: string; direction: "Credit" | "Debit"; amount: number; reason: string }) {
  const user = await signedIn()
  try {
    await createAdjustment(user.email, input)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not create the adjustment.")
  }
  revalidatePath("/adjustments")
}

export async function decideAdjustmentRequest(requestId: string, decision: "Approved" | "Rejected", comment?: string) {
  const user = await signedIn()
  try {
    await decideAdjustment(user.email, requestId, decision, comment)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not record the decision.")
  }
  revalidatePath("/adjustments")
}
