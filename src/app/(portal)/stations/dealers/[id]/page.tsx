import Link from "next/link"
import { Building2, Pencil } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { DealerFormDialog } from "@/components/stations/dealer-form-dialog"
import { Button } from "@/components/ui/button"
import { getDealerDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"

export default async function DealerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(["stations:monitor", "dealers:manage"])
  const { id } = await params
  const d = await getDealerDetail(id)
  return (
    <DetailPage
      backHref="/stations/dealers"
      backLabel="Dealers"
      icon={Building2}
      title={d.name}
      subtitle={`${d.stations.length} station${d.stations.length === 1 ? "" : "s"}`}
      actions={
        hasPermission(user.roles, "dealers:manage") ? (
          <DealerFormDialog
            trigger={<Button variant="outline" />}
            triggerContent={<><Pencil className="size-4" />Edit dealer</>}
            dealer={{ id: d.id, name: d.name, contactName: d.contactName ?? "", contactPhone: d.contactPhone ?? "", contactEmail: d.contactEmail ?? "", settlementAccount: d.settlementAccount ?? "" }}
          />
        ) : undefined
      }
      main={
        <>
          <DetailSection title="Stations">
            <MiniTable
              rows={d.stations}
              empty="This dealer has no stations yet."
              columns={[
                { header: "Station", cell: (s) => <Link href={`/stations/${s.id}`} className="font-semibold text-[#1226AA] hover:underline">{s.name}</Link> },
                { header: "Code", cell: (s) => s.code },
                { header: "Region", cell: (s) => s.region },
                { header: "POS devices", cell: (s) => s._count.posDevices },
                { header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="Dealer" entityId={d.id} />
        </>
      }
      aside={
        <DetailSection title="Contact & settlement">
          <DetailFields columns={1} items={[
            { label: "Contact name", value: d.contactName },
            { label: "Phone", value: d.contactPhone },
            { label: "Email", value: d.contactEmail },
            { label: "Settlement account", value: d.settlementAccount },
          ]} />
        </DetailSection>
      }
    />
  )
}
