import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { getStationForUser } from "@/lib/data/pos"
import { PageHeader } from "@/components/shared/page-header"
import { ValidateTicketFlow } from "@/components/pos/validate-ticket-flow"

export default async function ValidateTicketPage() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:validate-ticket")) {
    redirect("/dashboard")
  }

  const station = await getStationForUser(session.user.id)
  if (!station) {
    return (
      <div>
        <PageHeader title="Validate Ticket" />
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a station. Ask an administrator to assign one before
          validating tickets.
        </p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Validate Ticket"
        description="Fuel ticket verification and manager redemption portal"
      />
      <ValidateTicketFlow stationName={station.name} />
    </div>
  )
}
