import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission, type Permission, type Role } from "@/lib/rbac/roles"

/** Server-side page/action guard — hiding a nav item is not an access control. */
export async function requirePermission(permission: Permission | Permission[]) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!hasPermission(session.user.roles, permission)) redirect("/dashboard")
  return session.user
}

/** Where a user lands after sign-in; never points at a page they cannot open. */
export function landingPath(roles: Role[]): string {
  if (hasPermission(roles, "wallet:view")) return "/dashboard"
  if (hasPermission(roles, "pos:validate-ticket")) return "/validate-ticket"
  if (hasPermission(roles, ["reports:ops", "reports:jaguar", "reports:dealer", "reports:finance"])) return "/reports"
  if (hasPermission(roles, ["transactions:view-all", "transactions:view-station"])) return "/transactions"
  return "/login"
}
