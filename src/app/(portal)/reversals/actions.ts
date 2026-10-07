"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createReversal, decideReversal } from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function signedIn() {
  const session = await auth()
  if (!session?.user?.email) throw new ActionError("You must be signed in.")
  return session.user as { email: string }
}

export async function requestReversal(input: { transaction: string; reason: string }) {
  const user = await signedIn()
  try {
    await createReversal(user.email, input)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not create the reversal.")
  }
  revalidatePath("/reversals")
}

export async function decideReversalRequest(requestId: string, decision: "Approved" | "Rejected", comment?: string) {
  const user = await signedIn()
  try {
    await decideReversal(user.email, requestId, decision, comment)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not record the decision.")
  }
  revalidatePath("/reversals")
}
