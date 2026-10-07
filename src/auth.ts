import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { authConfig } from "@/lib/auth/config"
import type { Role } from "@/lib/rbac/roles"
import { portalLogin, portalProfile } from "@/lib/integrations/fuel-card-partner"

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

        // Password and portal roles are checked in Frappe. The session id is the user's email.
        let profile
        try {
          profile = await portalLogin(email, password)
        } catch (error) {
          // A wrong password is refused by Frappe with 401. A failing service login is a configuration error.
          // Checked by name and status, not instanceof: the classes can load twice in the server bundle.
          const err = error as { name?: string; status?: number }
          if (err.name === "FuelCardServiceAuthError") throw error
          if (err.status === 401) return null
          throw error
        }
        if (!profile.enabled || profile.roles.length === 0) return null

        return {
          id: profile.user,
          name: profile.full_name,
          email: profile.user,
          roles: profile.roles as Role[],
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
      // Fails closed: if Frappe cannot confirm the user, the session ends.
      if (token.email) {
        try {
          const profile = await portalProfile(token.email)
          if (!profile.enabled || profile.roles.length === 0) return null
          token.roles = profile.roles as Role[]
        } catch {
          return null
        }
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
