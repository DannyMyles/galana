"use client"

import { SubNav } from "@/components/shared/sub-nav"

const TABS = [
  { label: "Overview", href: "/funding-wallet" },
  { label: "New Top-up Request", href: "/funding-wallet/topup" },
  { label: "Approvals", href: "/funding-wallet/approvals" },
]

export function WalletSubNav() {
  return <SubNav tabs={TABS} />
}
