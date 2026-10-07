import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PortalShell } from "@/components/layout/portal-shell"
import type { TopbarNotification } from "@/components/layout/topbar"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const roles = session.user.roles
  const notifications: TopbarNotification[] = []


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
