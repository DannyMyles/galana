"use client"

import { SubNav } from "@/components/shared/sub-nav"

const TABS = [
  { label: "Users", href: "/administration/users", permission: "users:manage" as const },
  { label: "Audit Log", href: "/administration/audit-log", permission: "audit-log:view" as const },
  { label: "Integrations", href: "/administration/integrations", permission: "integrations:view" as const },
  { label: "Settings", href: "/administration/settings", permission: "settings:manage" as const },
]

export function AdministrationSubNav() {
  return <SubNav tabs={TABS} />
}
