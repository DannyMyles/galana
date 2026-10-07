import { notFound } from "next/navigation"
import Link from "next/link"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { EntityAudit } from "@/components/shared/entity-audit"
import { requirePermission } from "@/lib/rbac/guard"
import { getSettlement } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"
import { Landmark } from "@/components/icons"

export const dynamic = "force-dynamic"

export default async function SettlementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["settlements:view", "settlements:manage"])
  const { id } = await params
  const s = toPlain(await getSettlement(id).catch(() => null))
  if (!s) notFound()
  return (
    <DetailPage
      backHref="/settlements"
      backLabel="Dealer Settlements"
      icon={Landmark}
      title={s.reference}
      subtitle={`${s.station}${s.vehicle ? ` · ${s.vehicle}` : ""} · ${s.date}`}
      badge={<StatusBadge status="PENDING" />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Litres" value={<LitresDisplay litres={s.litres} />} />
            <DetailStat label="Gross" value={<MoneyDisplay amount={s.gross} />} />
            <DetailStat label="Net to dealer" value={<MoneyDisplay amount={s.netPayableToDealer} />} />
          </div>
          <DetailSection title="Credit notes" description="Raised to Jaguar from this settlement. Nothing is posted.">
            <DetailFields columns={1} items={s.creditNotes.map((cn) => ({
              label: cn.type === "UNDER_CANOPY" ? "Under-canopy" : "Jaguar contractual",
              value: (
                <Link href={`/credit-notes/${encodeURIComponent(`${s.id}:${cn.type}`)}`} className="font-medium text-[#1226AA] hover:underline">
                  <MoneyDisplay amount={cn.amount} />
                </Link>
              ),
            }))} />
          </DetailSection>
          <EntityAudit entityType="Ticket" entityId={s.id} />
        </>
      }
      aside={
        <DetailSection title="Settlement">
          <DetailFields columns={1} items={[
            { label: "Station", value: s.station },
            { label: "Vehicle", value: s.vehicle ?? "—" },
            { label: "Under-canopy discount (deducted)", value: <MoneyDisplay amount={s.underCanopyDiscount} /> },
            { label: "Jaguar discount (credit note only)", value: <MoneyDisplay amount={s.jaguarDiscount} /> },
          ]} />
        </DetailSection>
      }
    />
  )
}
