import { CheckCircle2, Clock, ReceiptText } from "@/components/icons"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MoneyDisplay } from "@/components/shared/money-display"
import { CreditNotesView } from "@/components/credit-notes/credit-notes-view"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { prisma } from "@/lib/db/client"
import { toPlain } from "@/lib/serialize"

export default async function CreditNotesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission(["credit-notes:manage", "credit-notes:approve", "credit-notes:view"])
  const { status, type, search } = await searchParams

  const [rows, sums, settlements] = await Promise.all([
    prisma.creditNote.findMany({
      where: {
        ...(status ? { status: status as "PENDING" } : {}),
        ...(type ? { type: type as "MANUAL" } : {}),
        ...(search ? { OR: [{ reason: { contains: search, mode: "insensitive" } }, { reference: { contains: search, mode: "insensitive" } }] } : {}),
      },
      include: { maker: { select: { name: true } }, checker: { select: { name: true } }, settlement: { select: { transaction: { select: { id: true, reference: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.creditNote.groupBy({ by: ["status"], _sum: { amount: true }, _count: { _all: true } }),
    prisma.dealerSettlement.findMany({ include: { transaction: { select: { reference: true } }, station: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ])
  const sum = (s: string) => Number(sums.find((g) => g.status === s)?._sum.amount ?? 0)
  const count = (s: string) => sums.find((g) => g.status === s)?._count._all ?? 0

  return (
    <div>
      <PageHeader title="Credit Notes" description="Jaguar discounts are tracked separately from the prepaid wallet load — the wallet always receives the full prepaid amount." />
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <KpiCard label="Pending approval" value={<>{count("PENDING")} · <MoneyDisplay amount={sum("PENDING")} decimals={0} /></>} icon={Clock} iconTint="amber" />
        <KpiCard label="Approved" value={<MoneyDisplay amount={sum("APPROVED")} decimals={0} />} icon={CheckCircle2} iconTint="emerald" />
        <KpiCard label="Total raised" value={<MoneyDisplay amount={sum("PENDING") + sum("APPROVED") + sum("REJECTED")} decimals={0} />} icon={ReceiptText} iconTint="blue" />
      </div>
      <CreditNotesView
        rows={toPlain(rows)}
        settlements={settlements.map((s) => ({ id: s.id, label: `${s.transaction.reference} · ${s.station.name}` }))}
        canCreate={hasPermission(user.roles, "credit-notes:manage")}
        canApprove={hasPermission(user.roles, "credit-notes:approve")}
        currentUserId={user.id}
      />
    </div>
  )
}
