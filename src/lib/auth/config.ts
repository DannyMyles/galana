import type { NextAuthConfig } from "next-auth"

/**
 * Edge-safe Auth.js config: no Prisma/bcrypt imports here, since this is
 * shared with middleware.ts (which runs on the Edge runtime). The
 * Credentials provider and its Node-only dependencies live in `src/auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnPublic =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/api/auth") ||
        request.nextUrl.pathname === "/"

      if (isOnPublic) return true
      return isLoggedIn
    },
  },
} satisfies NextAuthConfig
