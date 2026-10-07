"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createTopUp, decideTopUp } from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function signedIn() {
  const session = await auth()
  if (!session?.user?.email) throw new ActionError("You must be signed in.")
  return session.user as { email: string; roles: string[] }
}

/** Finance Maker creates a top-up request. Approval only; nothing is posted to the ledger. */
export async function requestTopUp(input: { customer: string; amount: number; fundingAccount: string; reference?: string; remarks?: string }) {
  const user = await signedIn()
  try {
    await createTopUp(user.email, input)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not create the request.")
  }
  revalidatePath("/funding-wallet")
}

/** Finance Checker approves or rejects a request made by someone else. */
export async function decideTopUpRequest(requestId: string, decision: "Approved" | "Rejected", comment?: string) {
  const user = await signedIn()
  try {
    await decideTopUp(user.email, requestId, decision, comment)
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not record the decision.")
  }
  revalidatePath("/funding-wallet")
  revalidatePath("/funding-wallet/approvals")
}
