"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { hashPassword } from "@/lib/auth/password"
import { userSchema, type UserInput } from "@/lib/validations/user"
import type { UserStatus } from "@prisma/client"

class ActionError extends Error {}

async function requireUserManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "users:manage")) throw new ActionError("You do not have permission to manage users.")
  return session.user
}

const tempPassword = () => randomBytes(6).toString("base64url")

/** Creates (id = null) or updates a user, including their roles (US-ADM-001/002). */
export async function saveUser(id: string | null, input: UserInput) {
  const admin = await requireUserManager()
  const parsed = userSchema.safeParse(input)
  if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid user details.")
  const { roleNames, stationId, ...fields } = parsed.data

  if (roleNames.includes("STATION_DEALER_MANAGER") && !stationId) throw new ActionError("Dealer managers must be assigned to a station.")
  if (id === admin.id && !roleNames.includes("SYSTEM_ADMIN")) throw new ActionError("You cannot remove your own administrator role.")
  if (id === admin.id && fields.status !== "ACTIVE") throw new ActionError("You cannot deactivate your own account.")

  const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } })
  const station = roleNames.includes("STATION_DEALER_MANAGER") ? stationId : null

  if (!id) {
    const password = tempPassword()
    let user
    try {
      user = await prisma.user.create({
        data: { ...fields, phone: fields.phone || null, stationId: station, passwordHash: await hashPassword(password), roles: { create: roles.map((r) => ({ roleId: r.id })) } },
      })
    } catch {
      throw new ActionError("A user with that email already exists.")
    }
    await writeAuditLog({ userId: admin.id, role: admin.roles[0], action: "USER_CREATED", entityType: "User", entityId: user.id, newValues: { ...fields, roles: roleNames, stationId: station }, result: "SUCCESS" })
    revalidatePath("/administration/users")
    return { tempPassword: password }
  }

  const before = await prisma.user.findUniqueOrThrow({ where: { id }, include: { roles: { include: { role: true } } } })
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { name: fields.name, phone: fields.phone || null, status: fields.status, stationId: station } }),
    prisma.userRole.deleteMany({ where: { userId: id } }),
    prisma.userRole.createMany({ data: roles.map((r) => ({ userId: id, roleId: r.id })) }),
  ])
  await writeAuditLog({
    userId: admin.id, role: admin.roles[0], action: "USER_UPDATED", entityType: "User", entityId: id,
    oldValues: { name: before.name, status: before.status, roles: before.roles.map((r) => r.role.name), stationId: before.stationId },
    newValues: { name: fields.name, status: fields.status, roles: roleNames, stationId: station }, result: "SUCCESS",
  })
  revalidatePath("/administration/users")
  return { tempPassword: null }
}

export async function setUserStatus(userId: string, status: UserStatus) {
  const admin = await requireUserManager()
  if (userId === admin.id && status !== "ACTIVE") throw new ActionError("You cannot deactivate your own account.")
  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  await prisma.user.update({ where: { id: userId }, data: { status } })
  await writeAuditLog({ userId: admin.id, role: admin.roles[0], action: "USER_STATUS_CHANGED", entityType: "User", entityId: userId, oldValues: { status: before.status }, newValues: { status }, result: "SUCCESS" })
  revalidatePath("/administration/users")
}

export async function resetUserPassword(userId: string) {
  const admin = await requireUserManager()
  const password = tempPassword()
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } })
  await writeAuditLog({ userId: admin.id, role: admin.roles[0], action: "USER_PASSWORD_RESET", entityType: "User", entityId: userId, result: "SUCCESS" })
  revalidatePath("/administration/users")
  return { tempPassword: password }
}
