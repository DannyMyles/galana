import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/rbac/roles"
import { PageHeader } from "@/components/shared/page-header"
import { JaguarTicketCheck } from "@/components/pos/jaguar-ticket-check"

export default async function ValidateTicketPage() {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.roles, "pos:validate-ticket")) {
    redirect("/dashboard")
  }

  return (
    <div>
      <PageHeader
        title="Validate Ticket"
        description="Check a Jaguar fuel ticket against the fuel card service. Checking does not use the ticket."
      />
      <JaguarTicketCheck />
    </div>
  )
}
