"use client"

import { SubNav } from "@/components/shared/sub-nav"

const TABS = [
  { label: "Stations", href: "/stations" },
  { label: "Dealers", href: "/stations/dealers" },
  { label: "POS Devices", href: "/stations/pos-devices" },
  { label: "EPRA Prices", href: "/stations/epra-prices" },
]

export function StationsSubNav() {
  return <SubNav tabs={TABS} />
}
