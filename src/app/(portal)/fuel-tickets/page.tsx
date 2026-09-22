import { PageHeader } from "@/components/shared/page-header"
import { TicketsTable } from "@/components/tickets/tickets-table"
import { getTickets } from "@/lib/data/tickets"
import type { TicketStatus } from "@prisma/client"

export default async function FuelTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { rows, totalRows, pageSize } = await getTickets({
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? (params.status as TicketStatus) : undefined,
    page: params.page ? Number(params.page) : 0,
  })

  return (
    <div>
      <PageHeader
        title="Fuel Tickets"
        description="Monitor ticket fulfilment across all Jaguar customers and vehicles"
      />
      <TicketsTable rows={rows} totalRows={totalRows} pageSize={pageSize} />
    </div>
  )
}
