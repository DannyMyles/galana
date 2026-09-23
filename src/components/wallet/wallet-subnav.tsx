"use client"

import { SubNav } from "@/components/shared/sub-nav"

const TABS = [
  { label: "Overview", href: "/funding-wallet" },
  { label: "New Top-up Request", href: "/funding-wallet/topup", permission: "wallet:topup:create" as const },
  { label: "Approvals", href: "/funding-wallet/approvals", permission: "wallet:topup:approve" as const },
]

export function WalletSubNav() {
  return <SubNav tabs={TABS} />
}
