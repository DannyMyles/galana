import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/client"
import { hasPermission } from "@/lib/rbac/roles"
import { PortalShell } from "@/components/layout/portal-shell"
import type { TopbarNotification } from "@/components/layout/topbar"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const roles = session.user.roles
  const notifications: TopbarNotification[] = []

  if (hasPermission(roles, "wallet:topup:approve")) {
    const pending = await prisma.walletTopUpRequest.count({ where: { status: "PENDING_APPROVAL" } })
    if (pending > 0) {
      notifications.push({
        id: "topups",
        title: `${pending} top-up request${pending > 1 ? "s" : ""} awaiting approval`,
        description: "Review pending wallet funding requests",
        href: "/funding-wallet/approvals",
      })
    }
  }

  if (hasPermission(roles, "exceptions:resolve")) {
    const open = await prisma.exceptionQueueItem.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } })
    if (open > 0) {
      notifications.push({
        id: "exceptions",
        title: `${open} open exception${open > 1 ? "s" : ""}`,
        description: "Failed transactions need attention",
        href: "/failed-transactions",
      })
    }
  }

  return (
    <PortalShell
      roles={roles}
      userName={session.user.name ?? session.user.email ?? "User"}
      primaryRole={roles[0]}
      notifications={notifications}
    >
      {children}
    </PortalShell>
  )
}
