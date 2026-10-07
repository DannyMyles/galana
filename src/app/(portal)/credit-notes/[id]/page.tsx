import { notFound } from "next/navigation"
import Link from "next/link"
import { DetailPage, DetailSection, DetailFields } from "@/components/shared/detail"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { requirePermission } from "@/lib/rbac/guard"
import { getCreditNote } from "@/lib/integrations/fuel-card-partner"
import { toPlain } from "@/lib/serialize"
import { ReceiptText } from "@/components/icons"

export const dynamic = "force-dynamic"

const LABEL = { UNDER_CANOPY: "Under-canopy discount", CONTRACTUAL: "Jaguar contractual discount" } as const

export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(["credit-notes:view", "credit-notes:manage"])
  const { id: rawId } = await params
  // Credit note ids contain `:`; some Next.js routing paths deliver the dynamic
  // segment still percent-encoded. Decoding an already-decoded id is a no-op.
  const id = decodeURIComponent(rawId)
  const cn = toPlain(await getCreditNote(id).catch(() => null))
  if (!cn) notFound()
  return (
    <DetailPage
      backHref="/credit-notes"
      backLabel="Credit Notes"
      icon={ReceiptText}
      title={LABEL[cn.type]}
      subtitle={`${cn.station}${cn.vehicle ? ` · ${cn.vehicle}` : ""} · ${cn.date}`}
      badge={<StatusBadge status="PENDING" />}
      main={
        <DetailSection title="Credit note" description="Raised to Jaguar from the settlement below. Nothing is posted.">
          <DetailFields columns={1} items={[
            { label: "Amount", value: <MoneyDisplay amount={cn.amount} /> },
            { label: "Litres", value: <LitresDisplay litres={cn.litres} /> },
            { label: "From settlement", value: <Link href={`/settlements/${cn.settlementId}`} className="font-medium text-[#1226AA] hover:underline">{cn.settlement}</Link> },
          ]} />
        </DetailSection>
      }
      aside={
        <DetailSection title="Settlement">
          <DetailFields columns={1} items={[
            { label: "Station", value: cn.station },
            { label: "Vehicle", value: cn.vehicle ?? "—" },
            { label: "Date", value: cn.date },
          ]} />
        </DetailSection>
      }
    />
  )
}
