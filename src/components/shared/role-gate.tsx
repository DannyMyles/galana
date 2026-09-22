import type { ReactNode } from "react"
import { hasPermission, type Permission, type Role } from "@/lib/rbac/roles"

interface RoleGateProps {
  userRoles: Role[]
  permission: Permission
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Server- or client-safe permission gate. Wrap any UI that should only
 * render for users whose roles grant `permission`. This only hides UI —
 * server actions and route handlers must independently re-check permission,
 * since a gate here is not an authorization boundary on its own.
 */
export function RoleGate({ userRoles, permission, fallback = null, children }: RoleGateProps) {
  if (!hasPermission(userRoles, permission)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
