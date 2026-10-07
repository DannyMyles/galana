import Link from "next/link"
import { auth } from "@/auth"
import { PageHeader } from "@/components/shared/page-header"
import { MiniTable } from "@/components/shared/mini-table"
import { MoneyDisplay } from "@/components/shared/money-display"
import { StatusBadge } from "@/components/shared/status-badge"
import { customersFor } from "@/lib/data/portal-reports"
import { requirePermission } from "@/lib/rbac/guard"
import type { PortalCustomerSummary } from "@/lib/integrations/fuel-card-partner"

export default async function CustomersPage() {
  await requirePermission(["reports:jaguar", "reports:finance"])
  const session = await auth()
  const rows = await customersFor(session!.user!.email as string)

  return (
    <div>
      <PageHeader title="Customers" description="Jaguar customers, their fuel card accounts, float and active tickets (read from the fuel card service)." />
      <div className="rounded-xl border border-[#E4E7F2] bg-white p-4">
        <MiniTable<PortalCustomerSummary>
          rows={rows}
          empty="No customers are set up for Galana."
          columns={[
            { header: "Customer", cell: (c) => <Link href={`/customers/${encodeURIComponent(c.customer)}`} className="font-semibold text-[#1226AA] hover:underline">{c.customer}</Link> },
            { header: "Account", cell: (c) => c.accountType ?? "—" },
            { header: "Float / available", cell: (c) => <MoneyDisplay amount={c.float ?? c.available} /> },
            { header: "Active tickets", cell: (c) => c.activeTickets },
            { header: "Vehicles", cell: (c) => c.vehicles },
            { header: "Status", cell: (c) => <StatusBadge status={c.accountStatus === "Active" ? "ACTIVE" : "SUSPENDED"} /> },
          ]}
        />
      </div>
    </div>
  )
}
