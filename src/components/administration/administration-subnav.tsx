"use client"

import { SubNav } from "@/components/shared/sub-nav"

const TABS = [
  { label: "Users", href: "/administration/users" },
  { label: "Audit Log", href: "/administration/audit-log" },
]

export function AdministrationSubNav() {
  return <SubNav tabs={TABS} />
}
