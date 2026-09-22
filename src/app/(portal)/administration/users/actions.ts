"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { writeAuditLog } from "@/lib/audit/log"
import { hasPermission } from "@/lib/rbac/roles"
import { hashPassword } from "@/lib/auth/password"
import { createUserSchema, type CreateUserInput } from "@/lib/validations/user"
import type { UserStatus } from "@prisma/client"

class ActionError extends Error {}

async function requireUserManager() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "users:manage")) {
    throw new ActionError("You do not have permission to manage users.")
  }
  return session.user
}

function generateTempPassword() {
  return randomBytes(6).toString("base64url")
}

export async function createUser(input: CreateUserInput) {
  const admin = await requireUserManager()
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid user details.")
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: parsed.data.roleName } })
  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  let user
  try {
    user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        roles: { create: [{ roleId: role.id }] },
      },
    })
  } catch {
    throw new ActionError("A user with that email already exists.")
  }

  await writeAuditLog({
    userId: admin.id,
    role: admin.roles[0],
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    newValues: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.roleName },
    result: "SUCCESS",
  })

  revalidatePath("/administration/users")
  return { tempPassword }
}

export async function setUserStatus(userId: string, status: UserStatus) {
  const admin = await requireUserManager()

  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  await prisma.user.update({ where: { id: userId }, data: { status } })

  await writeAuditLog({
    userId: admin.id,
    role: admin.roles[0],
    action: "USER_STATUS_CHANGED",
    entityType: "User",
    entityId: userId,
    oldValues: { status: before.status },
    newValues: { status },
    result: "SUCCESS",
  })

  revalidatePath("/administration/users")
}

export async function resetUserPassword(userId: string) {
  const admin = await requireUserManager()

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  await writeAuditLog({
    userId: admin.id,
    role: admin.roles[0],
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: userId,
    result: "SUCCESS",
  })

  revalidatePath("/administration/users")
  return { tempPassword }
}
