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
import { getPartnerDeviceCheck } from "@/lib/data/jaguar-fuel-card"
import { PartnerNotice } from "@/components/shared/partner-notice"

export default async function PosDeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["stations:monitor", "pos-devices:manage"])
  const { id } = await params
  const d = await getPosDeviceDetail(id)
  const partnerCheck = d.softwareVersion ? await getPartnerDeviceCheck(d.deviceId, d.softwareVersion) : null
  return (
    <DetailPage
      backHref="/stations/pos-devices"
      backLabel="POS devices"
      icon={Cpu}
      title={d.deviceId}
      subtitle={d.station ? `${d.station.name} (${d.station.code})` : "No station allocated"}
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
          <DetailSection title="Fuel card service check">
            {!partnerCheck ? (
              <p className="text-sm text-muted-foreground">No software version recorded, so the device cannot be checked.</p>
            ) : partnerCheck.state === "ok" ? (
              <p className="rounded-xl bg-[#0AC6A2]/15 px-4 py-3 text-sm text-[#068A70]">
                Authorised to transact on software {partnerCheck.data.software_version}. Station allocation: {partnerCheck.data.stations.join(", ")}.
              </p>
            ) : (
              <PartnerNotice state={partnerCheck.state} message={partnerCheck.state === "error" ? `Not authorised: ${partnerCheck.message}` : undefined} />
            )}
          </DetailSection>
          <EntityAudit entityType="POSDevice" entityId={d.id} />
        </>
      }
      aside={
        <DetailSection title="Device details">
          <DetailFields columns={1} items={[
            { label: "Station", value: d.station ? <Link href={`/stations/${d.station.id}`} className="text-[#1226AA] hover:underline">{d.station.name}</Link> : "—" },
            { label: "Software version", value: d.softwareVersion },
            { label: "Last seen", value: d.lastSeenAt ? <DateTimeDisplay value={d.lastSeenAt} /> : "Never" },
          ]} />
        </DetailSection>
      }
    />
  )
}
