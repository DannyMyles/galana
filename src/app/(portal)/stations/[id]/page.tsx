import Link from "next/link"
import { Fuel } from "@/components/icons"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { MiniTable } from "@/components/shared/mini-table"
import { EntityAudit } from "@/components/shared/entity-audit"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { StationFormDialog } from "@/components/stations/station-form-dialog"
import { Button } from "@/components/ui/button"
import { Pencil } from "@/components/icons"
import { getStationDetail } from "@/lib/data/details"
import { getDealersForSelect, getFuelProductsForSelect } from "@/lib/data/stations"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"

export default async function StationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(["stations:monitor", "stations:manage"])
  const { id } = await params
  const [s, dealers, products] = await Promise.all([getStationDetail(id), getDealersForSelect(), getFuelProductsForSelect()])
  const canManage = hasPermission(user.roles, "stations:manage")

  return (
    <DetailPage
      backHref="/stations"
      backLabel="Stations"
      icon={Fuel}
      title={s.name}
      subtitle={`${s.code} · ${s.county}, ${s.region}`}
      badge={<StatusBadge status={s.status} />}
      actions={
        canManage ? (
          <StationFormDialog
            dealers={dealers}
            products={products}
            station={{ id: s.id, name: s.name, code: s.code, region: s.region, county: s.county, address: s.address, latitude: s.latitude, longitude: s.longitude, contactName: s.contactName, contactPhone: s.contactPhone, contactEmail: s.contactEmail, dealerId: s.dealerId, productIds: s.products.map((p) => p.productId) }}
            trigger={<Button variant="outline" />}
            triggerContent={<><Pencil className="size-4" />Edit station</>}
          />
        ) : undefined
      }
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Transactions" value={s._count.transactions} />
            <DetailStat label="POS devices" value={s._count.posDevices} />
            <DetailStat label="Users" value={s._count.users} />
          </div>
          <DetailSection title="Recent transactions">
            <MiniTable
              rows={s.transactions}
              empty="No transactions at this station yet."
              columns={[
                { header: "Reference", cell: (t) => <Link href={`/transactions/${t.id}`} className="font-semibold text-[#1226AA] hover:underline">{t.reference}</Link> },
                { header: "Customer", cell: (t) => t.ticket.customer.name },
                { header: "Amount", cell: (t) => (t.totalAmount ? <MoneyDisplay amount={Number(t.totalAmount)} /> : "—") },
                { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
                { header: "When", cell: (t) => <DateTimeDisplay value={t.createdAt} /> },
              ]}
            />
          </DetailSection>
          <DetailSection title="POS devices">
            <MiniTable
              rows={s.posDevices}
              empty="No POS devices registered for this station."
              columns={[
                { header: "Device", cell: (d) => <Link href={`/stations/pos-devices/${d.id}`} className="font-semibold text-[#1226AA] hover:underline">{d.deviceId}</Link> },
                { header: "Software", cell: (d) => d.softwareVersion ?? "—" },
                { header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
              ]}
            />
          </DetailSection>
          <EntityAudit entityType="Station" entityId={s.id} />
        </>
      }
      aside={
        <>
          <DetailSection title="Station details">
            <DetailFields columns={1} items={[
              { label: "Address", value: s.address },
              { label: "Coordinates", value: s.latitude != null && s.longitude != null ? `${s.latitude}, ${s.longitude}` : null },
              { label: "Products", value: s.products.map((p) => p.product.name).join(", ") || null },
              { label: "JPL OMC sync", value: <StatusBadge status={s.jplSyncStatus} /> },
            ]} />
          </DetailSection>
          <DetailSection title="Dealer & contact">
            <DetailFields columns={1} items={[
              { label: "Dealer", value: s.dealer ? <Link href={`/stations/dealers/${s.dealer.id}`} className="text-[#1226AA] hover:underline">{s.dealer.name}</Link> : null },
              { label: "Contact", value: s.contactName },
              { label: "Phone", value: s.contactPhone },
              { label: "Email", value: s.contactEmail },
            ]} />
          </DetailSection>
        </>
      }
    />
  )
}
