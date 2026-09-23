import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { authConfig } from "@/lib/auth/config"
import { prisma } from "@/lib/db/client"
import { verifyPassword } from "@/lib/auth/password"
import type { Role } from "@/lib/rbac/roles"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email address" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } },
        })

        if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
          return null
        }

        const isValid = await verifyPassword(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles.map((userRole) => userRole.role.name) as Role[],
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as { roles: Role[] }).roles
        return token
      }
      // US-ADM-003: deactivated users lose access immediately, not at token expiry.
      if (token.sub) {
        const current = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { status: true, roles: { select: { role: { select: { name: true } } } } },
        })
        if (!current || current.status !== "ACTIVE") return null
        token.roles = current.roles.map((r) => r.role.name) as Role[]
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.roles = (token.roles as Role[]) ?? []
      }
      return session
    },
  },
})
