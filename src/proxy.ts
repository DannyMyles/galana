import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/config"

const { auth } = NextAuth(authConfig)

export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args)
}

export const config = {
  // Run on everything except static assets, images and the Next.js internals.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
}
