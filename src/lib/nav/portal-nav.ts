import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Ticket,
  ArrowLeftRight,
  Fuel,
  Users,
  Wallet,
  Landmark,
  GitCompareArrows,
  BarChart3,
  Settings,
} from "lucide-react"
import type { Permission } from "@/lib/rbac/roles"

export interface PortalNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Visible if the user holds ANY of these permissions. */
  permission: Permission | Permission[]
}

/**
 * Primary portal navigation, mirrored from the wireframes' left rail. Every
 * screen in the wireframes — including the POS redemption flow — shares this
 * one sidebar/topbar shell, so "Validate Ticket" and "Failed Transactions"
 * live here too rather than in a separate POS layout.
 * Filter with `hasPermission(session.user.roles, item.permission)` before rendering.
 */
export const PORTAL_NAV: PortalNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "wallet:view" },
  { label: "Validate Ticket", href: "/validate-ticket", icon: Ticket, permission: "pos:validate-ticket" },
  { label: "Fuel Tickets", href: "/fuel-tickets", icon: Ticket, permission: "tickets:monitor" },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight, permission: "transactions:view-all" },
  {
    label: "Failed Transactions",
    href: "/failed-transactions",
    icon: ArrowLeftRight,
    permission: ["transactions:view-station", "transactions:view-all", "exceptions:resolve"],
  },
  { label: "Stations", href: "/stations", icon: Fuel, permission: "stations:monitor" },
  { label: "Customers", href: "/customers", icon: Users, permission: "reports:jaguar" },
  { label: "Funding & Wallet", href: "/funding-wallet", icon: Wallet, permission: "wallet:view" },
  { label: "Settlements", href: "/settlements", icon: Landmark, permission: "settlements:manage" },
  { label: "Reconciliation", href: "/reconciliation", icon: GitCompareArrows, permission: "reconciliation:manage" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports:finance" },
  { label: "Administration", href: "/administration/users", icon: Settings, permission: "users:manage" },
  { label: "Audit Log", href: "/administration/audit-log", icon: Settings, permission: "audit-log:view" },
]
