import type { AppIcon } from "@/components/icons"
import {
  LayoutDashboard,
  Ticket,
  ArrowLeftRight,
  AlertTriangle,
  Fuel,
  Users,
  Wallet,
  Landmark,
  GitCompareArrows,
  BarChart3,
  UsersRound,
  ScrollText,
  ShieldCheck,
} from "@/components/icons"
import type { Permission } from "@/lib/rbac/roles"

export interface PortalNavItem {
  label: string
  href: string
  icon: AppIcon
  /** Visible if the user holds ANY of these permissions. */
  permission: Permission | Permission[]
}

export interface PortalNavGroup {
  label: string
  items: PortalNavItem[]
}

/**
 * Primary portal navigation, mirrored from the wireframes' left rail. Every
 * screen in the wireframes — including the POS redemption flow — shares this
 * one sidebar/topbar shell, so "Validate Ticket" and "Failed Transactions"
 * live here too rather than in a separate POS layout.
 *
 * Grouped into sections purely for scanability in the sidebar — filter each
 * group's items with `hasPermission(session.user.roles, item.permission)`
 * and drop any group left with zero visible items.
 */
export const PORTAL_NAV_GROUPS: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "wallet:view" }],
  },
  {
    label: "Operations",
    items: [
      { label: "Validate Ticket", href: "/validate-ticket", icon: ShieldCheck, permission: "pos:validate-ticket" },
      { label: "Fuel Tickets", href: "/fuel-tickets", icon: Ticket, permission: "tickets:monitor" },
      { label: "Transactions", href: "/transactions", icon: ArrowLeftRight, permission: "transactions:view-all" },
      {
        label: "Failed Transactions",
        href: "/failed-transactions",
        icon: AlertTriangle,
        permission: ["transactions:view-station", "transactions:view-all", "exceptions:resolve"],
      },
      { label: "Stations", href: "/stations", icon: Fuel, permission: "stations:monitor" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Funding & Wallet", href: "/funding-wallet", icon: Wallet, permission: "wallet:view" },
      { label: "Settlements", href: "/settlements", icon: Landmark, permission: "settlements:manage" },
      {
        label: "Reconciliation",
        href: "/reconciliation",
        icon: GitCompareArrows,
        permission: "reconciliation:manage",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Customers", href: "/customers", icon: Users, permission: "reports:jaguar" },
      { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports:finance" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/administration/users", icon: UsersRound, permission: "users:manage" },
      { label: "Audit Log", href: "/administration/audit-log", icon: ScrollText, permission: "audit-log:view" },
    ],
  },
]

/** Flat, single-level navigation (no section headings). */
export const PORTAL_NAV: PortalNavItem[] = PORTAL_NAV_GROUPS.flatMap((group) => group.items)
