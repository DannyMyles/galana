import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PortalShell } from "@/components/layout/portal-shell"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <PortalShell
      roles={session.user.roles}
      userName={session.user.name ?? session.user.email ?? "User"}
      primaryRole={session.user.roles[0]}
    >
      {children}
    </PortalShell>
  )
}
