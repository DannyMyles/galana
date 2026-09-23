/**
 * Canonical role list for the Galana Portal, mirrored from `RoleName` in
 * prisma/schema.prisma. Kept as a standalone module (rather than importing
 * the Prisma enum) so client components can use it without pulling in
 * @prisma/client.
 */
export const ROLES = [
  "SYSTEM_ADMIN",
  "FINANCE_MAKER",
  "FINANCE_CHECKER",
  "OPS_FUEL_CARD",
  "STATION_DEALER_MANAGER",
  "JAGUAR_CUSTOMER",
  "INTERNAL_AUDITOR",
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  SYSTEM_ADMIN: "System Administrator",
  FINANCE_MAKER: "Galana Finance Maker",
  FINANCE_CHECKER: "Galana Finance Checker",
  OPS_FUEL_CARD: "Galana Ops – Fuel Card Team",
  STATION_DEALER_MANAGER: "Station Dealer – Manager",
  JAGUAR_CUSTOMER: "Jaguar Customer",
  INTERNAL_AUDITOR: "Internal Auditor",
}

/**
 * Portal permissions, grouped by module. This is intentionally coarse
 * (module:action) rather than per-field — fine enough for route/menu gating
 * and for guarding server actions, without becoming its own subsystem.
 */
export const PERMISSIONS = [
  "users:manage",
  "stations:manage",
  "pos-devices:manage",
  "dealers:manage",
  "audit-log:view",

  "wallet:topup:create",
  "wallet:topup:approve",
  "wallet:view",
  "credit-notes:manage",

  "stations:monitor",
  "epra-prices:manage",
  "tickets:monitor",

  "pos:validate-ticket",
  "pos:dispense",
  "transactions:view-station",

  "transactions:view-all",
  "settlements:manage",
  "reconciliation:manage",
  "exceptions:resolve",

  "reports:finance",
  "reports:ops",
  "reports:jaguar",
  "reports:dealer",

  "audit:read-only",

  "credit-notes:approve",
  "credit-notes:view",
  "adjustments:create",
  "adjustments:approve",
  "adjustments:view",
  "reversals:request",
  "reversals:approve",
  "reversals:view",
  "settlements:view",
  "reconciliation:view",
  "exceptions:view",
  "settings:manage",
  "integrations:view",
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SYSTEM_ADMIN: [
    "users:manage",
    "stations:manage",
    "stations:monitor",
    "pos-devices:manage",
    "dealers:manage",
    "audit-log:view",
    "wallet:view",
    "transactions:view-all",
    "settlements:manage",
    "reconciliation:manage",
    "exceptions:resolve",
    "tickets:monitor",
    "reports:finance",
    "reports:ops",
    "reports:jaguar",
    "reports:dealer",
    "settings:manage",
    "integrations:view",
    "credit-notes:view",
    "adjustments:view",
    "reversals:view",
    "settlements:view",
    "reconciliation:view",
    "exceptions:view",
  ],
  FINANCE_MAKER: [
    "wallet:topup:create",
    "wallet:view",
    "credit-notes:manage",
    "transactions:view-all",
    "settlements:manage",
    "reconciliation:manage",
    "exceptions:resolve",
    "reports:finance",
    "adjustments:create",
    "adjustments:view",
    "reversals:request",
    "reversals:view",
    "credit-notes:view",
    "exceptions:view",
  ],
  FINANCE_CHECKER: [
    "wallet:topup:approve",
    "wallet:view",
    "credit-notes:manage",
    "transactions:view-all",
    "settlements:manage",
    "reconciliation:manage",
    "exceptions:resolve",
    "reports:finance",
    "credit-notes:approve",
    "adjustments:approve",
    "adjustments:view",
    "reversals:approve",
    "reversals:view",
    "credit-notes:view",
    "exceptions:view",
  ],
  OPS_FUEL_CARD: [
    "stations:manage",
    "stations:monitor",
    "epra-prices:manage",
    "tickets:monitor",
    "transactions:view-all",
    "exceptions:resolve",
    "reports:ops",
    "credit-notes:view",
    "reversals:view",
    "reversals:request",
    "settlements:view",
    "reconciliation:view",
    "exceptions:view",
  ],
  STATION_DEALER_MANAGER: [
    "pos:validate-ticket",
    "pos:dispense",
    "transactions:view-station",
    "reports:dealer",
  ],
  JAGUAR_CUSTOMER: ["reports:jaguar"],
  INTERNAL_AUDITOR: ["audit:read-only", "audit-log:view", "transactions:view-all",
    "credit-notes:view",
    "adjustments:view",
    "reversals:view",
    "settlements:view",
    "reconciliation:view",
    "exceptions:view",
    "integrations:view",
  ],
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasPermission(roles: Role[], permission: Permission | Permission[]): boolean {
  const required = Array.isArray(permission) ? permission : [permission]
  return required.some((p) => roles.some((role) => roleHasPermission(role, p)))
}
