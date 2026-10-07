"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { userSchema, type UserInput } from "@/lib/validations/user"
import {
  createPortalUser,
  resetPortalUserPassword,
  setPortalUserStatus,
  updatePortalUser,
  type PortalUserStatus,
} from "@/lib/integrations/fuel-card-partner"

class ActionError extends Error {}

async function requireUserManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "users:manage")) throw new ActionError("You do not have permission to manage users.")
  if (!session.user.email) throw new ActionError("Your session has no email address, so the change cannot be recorded.")
  return session.user
}

/** Frappe emails setup and reset links. Nothing is returned for the admin to share. */
export type SaveUserResult = { emailed: boolean }

/** Creates (id = null) or updates a user and their Galana roles (US-ADM-001/002). */
export async function saveUser(id: string | null, input: UserInput): Promise<SaveUserResult> {
  const admin = await requireUserManager()
  const parsed = userSchema.safeParse(input)
  if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid user details.")
  const { roleNames, stationId, ...fields } = parsed.data

  if (roleNames.includes("STATION_DEALER_MANAGER") && !stationId) throw new ActionError("Dealer managers must be assigned to a station.")
  if (id === admin.email && !roleNames.includes("SYSTEM_ADMIN")) throw new ActionError("You cannot remove your own administrator role.")
  if (id === admin.email && fields.status !== "ACTIVE") throw new ActionError("You cannot deactivate your own account.")

  const status: PortalUserStatus = fields.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"
  const payload = { email: id ?? fields.email, name: fields.name, phone: fields.phone || undefined, roleNames, status, stationId: stationId || undefined }
  try {
    if (!id) {
      await createPortalUser(admin.email as string, payload)
    } else {
      await updatePortalUser(admin.email as string, payload)
    }
  } catch (error) {
    throw new ActionError(error instanceof Error && error.message ? error.message : "Could not save the user.")
  }
  revalidatePath("/administration/users")
  return { emailed: !id && status === "ACTIVE" }
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE") {
  const admin = await requireUserManager()
  if (userId === admin.email && status !== "ACTIVE") throw new ActionError("You cannot deactivate your own account.")
  await setPortalUserStatus(admin.email as string, userId, status)
  revalidatePath("/administration/users")
}

export async function resetUserPassword(userId: string): Promise<SaveUserResult> {
  const admin = await requireUserManager()
  const result = await resetPortalUserPassword(admin.email as string, userId)
  revalidatePath("/administration/users")
  return { emailed: result.emailed }
}
