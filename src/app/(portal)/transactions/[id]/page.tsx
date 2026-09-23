import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { RequestReversalDialog } from "@/components/reversals/request-reversal-dialog"
import { getTransactionTrace } from "@/lib/data/transactions"
import { getStationForUser } from "@/lib/data/pos"
import { requirePermission } from "@/lib/rbac/guard"
import { hasPermission } from "@/lib/rbac/roles"
import { ChevronLeft, Ticket, Cpu, ArrowLeftRight, Landmark } from "@/components/icons"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words">{children}</p>
    </div>
  )
}

function Stage({ icon: Icon, title, children, tint }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; tint: string }) {
  return (
    <Card className="relative">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex size-9 items-center justify-center rounded-full ${tint}`}>
            <Icon className="size-[18px]" />
          </span>
          <p className="font-heading text-sm font-semibold">{title}</p>
        </div>
        <div className="grid gap-2.5">{children}</div>
      </CardContent>
    </Card>
  )
}

const pretty = (v: unknown) => (v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v))

export default async function TransactionTracePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(["transactions:view-all", "transactions:view-station"])
  const { id } = await params
  const trace = await getTransactionTrace(id).catch(() => null)
  if (!trace) notFound()
  const { transaction: t, audit, actorNames } = trace

  if (!hasPermission(user.roles, "transactions:view-all")) {
    const station = await getStationForUser(user.id)
    if (station?.id !== t.stationId) redirect("/transactions")
  }
  const canRequestReversal = hasPermission(user.roles, "reversals:request") && t.status === "COMPLETED"
  const s = t.settlement

  return (
    <div>
      <Link href="/transactions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Transactions
      </Link>
      <PageHeader
        title={t.reference}
        description="End-to-end trace: Jaguar ticket → POS → Galana transaction → dealer settlement."
        actions={
          <>
            <StatusBadge status={t.status} className="h-7 px-3 text-sm" />
            {canRequestReversal && <RequestReversalDialog transactionId={t.id} reference={t.reference} />}
          </>
        }
      />

      {t.failureReason && <p className="mb-5 rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">{t.failureReason}</p>}

      <div className="grid gap-4 lg:grid-cols-4">
        <Stage icon={Ticket} title="1 · Jaguar ticket" tint="bg-[#1226AA]/10 text-[#1226AA]">
          <Field label="Ticket">{t.ticket.ticketNo}</Field>
          <Field label="Customer">{t.ticket.customer.name}</Field>
          <Field label="Vehicle">{t.ticket.vehicle?.regNo ?? "—"}</Field>
          <Field label="Product">{t.ticket.product.name}</Field>
          <Field label="Authorised"><LitresDisplay litres={Number(t.ticket.authorisedQuantityL)} /></Field>
          <Field label="Expiry"><DateTimeDisplay value={t.ticket.expiresAt} /></Field>
        </Stage>
        <Stage icon={Cpu} title="2 · POS / station" tint="bg-[#F5C400]/20 text-[#8A6A00]">
          <Field label="Station">{t.station.name} ({t.station.code})</Field>
          <Field label="POS device">{t.posDevice?.deviceId ?? "Portal (no device linked)"}</Field>
          <Field label="Validation">{t.ticket.validations.length ? t.ticket.validations.map((v) => `${v.mode === "OTP" ? "OTP" : "QR"} ${v.isValid ? "✓" : "✗"}`).join(", ") : "—"}</Field>
          <Field label="Idempotency key">{t.idempotencyKey ? `${t.idempotencyKey.slice(0, 8)}…` : "—"}</Field>
        </Stage>
        <Stage icon={ArrowLeftRight} title="3 · Galana transaction" tint="bg-[#0AC6A2]/15 text-[#068A70]">
          <Field label="Authorised"><LitresDisplay litres={Number(t.authorisedQtyL)} /></Field>
          <Field label="Dispensed">{t.dispensedQtyL ? <LitresDisplay litres={Number(t.dispensedQtyL)} /> : "—"}</Field>
          <Field label="Unit tariff"><MoneyDisplay amount={Number(t.unitTariff)} />/L</Field>
          <Field label="Amount">{t.totalAmount ? <MoneyDisplay amount={Number(t.totalAmount)} /> : "—"}</Field>
          <Field label="Created"><DateTimeDisplay value={t.createdAt} /></Field>
        </Stage>
        <Stage icon={Landmark} title="4 · Dealer settlement" tint="bg-[#F75B8C]/15 text-[#C4275F]">
          {s ? (
            <>
              <Field label="Gross"><MoneyDisplay amount={Number(s.grossAmount)} /></Field>
              <Field label="Under-canopy discount"><MoneyDisplay amount={Number(s.underCanopyDiscount)} /></Field>
              <Field label="Jaguar contractual discount"><MoneyDisplay amount={Number(s.jaguarContractualDiscount)} /></Field>
              <Field label="Net payable to dealer"><MoneyDisplay amount={Number(s.netPayableToDealer)} /></Field>
              <Field label="Status"><StatusBadge status={s.status} /></Field>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No settlement — created when the transaction completes.</p>
          )}
        </Stage>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">State history</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative ml-2 flex flex-col gap-5 border-l-2 border-[#ECEEFA] pl-6">
              {t.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute top-1 -left-[31px] size-3 rounded-full bg-[#1226AA] ring-4 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.toStatus} />
                    <span className="text-xs text-muted-foreground"><DateTimeDisplay value={e.createdAt} formatStr="dd MMM yyyy HH:mm:ss" /></span>
                  </div>
                  <p className="mt-1 text-sm">{e.note ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{e.actorId ? actorNames[e.actorId] ?? "User" : "System"}</p>
                </li>
              ))}
              {t.events.length === 0 && <p className="text-sm text-muted-foreground">No state history was recorded for this older transaction.</p>}
            </ol>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          {s && s.creditNotes.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Credit notes</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                {s.creditNotes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{c.type === "UNDER_CANOPY" ? "Under-canopy" : c.type === "CONTRACTUAL" ? "Contractual" : "Manual"} · <MoneyDisplay amount={Number(c.amount)} /></span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {t.reversals.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Reversals</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                {t.reversals.map((r) => (
                  <div key={r.id} className="text-sm">
                    <div className="flex items-center justify-between gap-3"><span className="font-medium">{r.reason}</span><StatusBadge status={r.status} /></div>
                    <p className="text-xs text-muted-foreground">Requested by {r.requestedBy.name}{r.decidedBy ? ` · decided by ${r.decidedBy.name}` : ""}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {(t.exceptions.length > 0 || t.reconciliationRecords.length > 0) && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Exceptions &amp; reconciliation</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {t.exceptions.map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-3"><span>{x.reason}</span><StatusBadge status={x.status} /></div>
                ))}
                {t.reconciliationRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3"><span>{r.level} reconciliation</span><StatusBadge status={r.status} /></div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle className="text-lg">Audit trail</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground"><th className="pb-2 font-medium">When</th><th className="pb-2 font-medium">User</th><th className="pb-2 font-medium">Action</th><th className="pb-2 font-medium">Result</th><th className="pb-2 font-medium">Details</th></tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-[#EEF0F8] align-top">
                  <td className="py-2.5 pr-4 whitespace-nowrap"><DateTimeDisplay value={a.createdAt} formatStr="dd MMM HH:mm:ss" /></td>
                  <td className="py-2.5 pr-4">{a.user?.name ?? "System"}</td>
                  <td className="py-2.5 pr-4 font-medium">{a.action}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={a.result === "SUCCESS" ? "COMPLETED" : "FAILED"} /></td>
                  <td className="py-2.5 text-xs text-muted-foreground">{a.failureReason ?? pretty(a.newValues)}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No audit events recorded.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
