import Link from "next/link"
import { Cpu } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { getPosDeviceDetail } from "@/lib/data/details"
import { requirePermission } from "@/lib/rbac/guard"

export default async function PosDeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["stations:monitor", "pos-devices:manage"])
  const { id } = await params
  const d = await getPosDeviceDetail(id)
  return (
    <DetailPage
      backHref="/stations/pos-devices"
      backLabel="POS devices"
      icon={Cpu}
      title={d.deviceId}
      subtitle={`${d.station.name} (${d.station.code})`}
      badge={<StatusBadge status={d.status} />}
      main={
        <>
          <DetailSection title="Recent transactions on this device">
            <MiniTable
              rows={d.transactions}
              empty="No transactions have been processed on this device."
              columns={[
                { header: "Reference", cell: (t) => <Link href={`/transactions/${t.id}`} className="font-semibold text-[#1226AA] hover:underline">{t.reference}</Link> },
                { header: "Amount", cell: (t) => (t.totalAmount ? <MoneyDisplay amount={Number(t.totalAmount)} /> : "—") },
                { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
                { header: "When", cell: (t) => <DateTimeDisplay value={t.createdAt} /> },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="POSDevice" entityId={d.id} />
        </>
      }
      aside={
        <DetailSection title="Device details">
          <DetailFields columns={1} items={[
            { label: "Station", value: <Link href={`/stations/${d.station.id}`} className="text-[#1226AA] hover:underline">{d.station.name}</Link> },
            { label: "Software version", value: d.softwareVersion },
            { label: "Last seen", value: d.lastSeenAt ? <DateTimeDisplay value={d.lastSeenAt} /> : "Never" },
            { label: "Registered", value: <DateTimeDisplay value={d.createdAt} formatStr="dd MMM yyyy" /> },
          ]} />
        </DetailSection>
      }
    />
  )
}
