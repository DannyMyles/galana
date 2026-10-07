import Link from "next/link"
import { DetailPage, DetailSection, DetailFields, DetailStat } from "@/components/shared/detail"
import { StatusBadge } from "@/components/shared/status-badge"
import { LitresDisplay, MoneyDisplay } from "@/components/shared/money-display"
import { EntityAudit } from "@/components/shared/entity-audit"
import { getTransactionDetail } from "@/lib/data/transactions"
import { requirePermission } from "@/lib/rbac/guard"
import { Ticket } from "@/components/icons"

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["transactions:view-all", "transactions:view-station"])
  const { id } = await params
  const t = await getTransactionDetail(id)
  return (
    <DetailPage
      backHref="/transactions"
      backLabel="Transactions"
      icon={Ticket}
      title={t.reference}
      subtitle={`${t.customer ?? "—"}${t.vehicle ? ` · ${t.vehicle}` : ""}`}
      badge={<StatusBadge status={t.status === "COMPLETED" ? "COMPLETED" : t.status === "FAILED" ? "FAILED" : "PENDING"} />}
      main={
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailStat label="Litres" value={t.litres ? <LitresDisplay litres={t.litres} /> : "—"} />
            <DetailStat label="Amount" value={t.amount ? <MoneyDisplay amount={t.amount} /> : "—"} />
            <DetailStat label="Happened" value={t.happenedAt.slice(0, 16)} />
          </div>
          {t.failureReason && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">{t.failureReason}</p>}
          <DetailSection title="Ticket">
            {t.ticketReference ? <p className="text-sm">Authorisation code <span className="font-semibold">{t.ticketReference}</span></p> : <p className="text-sm text-muted-foreground">No ticket recorded.</p>}
          </DetailSection>
          <EntityAudit entityType="Transaction" entityId={t.id} />
        </>
      }
      aside={
        <DetailSection title="Details">
          <DetailFields columns={1} items={[
            { label: "Station", value: t.station ?? "—" },
            { label: "Driver", value: t.driver ?? "—" },
            { label: "Unit price", value: t.unitPrice ? <MoneyDisplay amount={t.unitPrice} /> : "—" },
            { label: "POS ID", value: t.ptsId ?? "—" },
            { label: "Ticket", value: t.ticketReference ? <Link href={`/fuel-tickets/${t.ticketReference}`} className="text-[#1226AA] hover:underline">{t.ticketReference}</Link> : "—" },
          ]} />
        </DetailSection>
      }
    />
  )
}
