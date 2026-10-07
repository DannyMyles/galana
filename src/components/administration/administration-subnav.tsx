"use client"

import { SubNav } from "@/components/shared/sub-nav"
import type { Permission } from "@/lib/rbac/roles"

const TABS = [
  { label: "Users", href: "/administration/users", permission: "users:manage" as const },
  { label: "Audit Log", href: "/administration/audit-log", permission: "audit-log:view" as const },
  { label: "Integrations", href: "/administration/integrations", permission: "integrations:view" as const },
  { label: "Settings", href: "/administration/settings", permission: ["settings:manage", "discounts:manage"] as Permission[] },
]

export function AdministrationSubNav() {
  return <SubNav tabs={TABS} />
}
