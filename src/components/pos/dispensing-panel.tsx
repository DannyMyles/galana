"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Fuel } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { completeTransaction, cancelTransaction, startFuelling } from "@/app/(portal)/dispensing/[transactionId]/actions"
import type { TransactionStatus } from "@prisma/client"

interface DispensingTransaction {
  id: string
  reference: string
  status: TransactionStatus
  authorisedQtyL: number
  dispensedQtyL: number | null
  totalAmount: number | null
  unitTariff: number
  failureReason: string | null
  ticketNo: string
  vehicleRegNo: string | null
  customerName: string
  productName: string
  stationName: string
}

const STEPS: { status: TransactionStatus; label: string }[] = [
  { status: "INITIATED", label: "Initiated" },
  { status: "TICKET_VALIDATED", label: "Ticket validated" },
  { status: "FUEL_AUTHORISATION_PENDING", label: "Authorisation" },
  { status: "AUTHORISED", label: "Authorised" },
  { status: "FUELLING_IN_PROGRESS", label: "Fuelling" },
  { status: "COMPLETED", label: "Completed" },
]

export function DispensingPanel({ transaction }: { transaction: DispensingTransaction }) {
  const router = useRouter()
  const [dispensedQty, setDispensedQty] = useState(String(transaction.authorisedQtyL))
  const [busy, setBusy] = useState(false)

  const { status } = transaction
  const isException = !STEPS.some((s) => s.status === status)
  const reached = STEPS.findIndex((s) => s.status === status)
  const qty = Number(dispensedQty || 0)
  const qtyError = qty <= 0 ? "Enter a quantity greater than zero." : qty > transaction.authorisedQtyL ? "Cannot exceed the authorised quantity." : null

  async function run(fn: () => Promise<void>, success: string) {
    setBusy(true)
    try {
      await fn()
      toast.success(success)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fuel className="size-5" />
            {transaction.reference}
          </CardTitle>
          <StatusBadge status={status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {!isException && (
            <ol className="flex items-center gap-1 overflow-x-auto pb-1">
              {STEPS.map((step, i) => {
                const done = i < reached || status === "COMPLETED"
                const current = i === reached && status !== "COMPLETED"
                return (
                  <li key={step.status} className="flex flex-1 items-center gap-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                          done ? "bg-[#0AC6A2] text-white" : current ? "bg-[#1226AA] text-white ring-4 ring-[#1226AA]/15" : "bg-[#ECEEFA] text-[#8B8EAA]"
                        }`}
                      >
                        {done ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      <span className="text-center text-[10px] leading-tight text-muted-foreground">{step.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <span className={`mb-5 h-0.5 flex-1 rounded ${i < reached ? "bg-[#0AC6A2]" : "bg-[#ECEEFA]"}`} />}
                  </li>
                )
              })}
            </ol>
          )}

          {(isException || transaction.failureReason) && transaction.failureReason && (
            <p className="rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">{transaction.failureReason}</p>
          )}
          {status === "CANCELLED" && <p className="rounded-xl bg-[#F1F2FA] px-4 py-3 text-sm">Cancelled before completion. The temporary hold was released and no balance was consumed.</p>}

          <div className="grid grid-cols-2 gap-5 rounded-2xl bg-[#F6F7FB] p-5 sm:grid-cols-3">
            {[
              ["Ticket", transaction.ticketNo],
              ["Customer", transaction.customerName],
              ["Vehicle", transaction.vehicleRegNo ?? "—"],
              ["Product", transaction.productName],
              ["Authorised", <LitresDisplay key="a" litres={transaction.authorisedQtyL} />],
              ["Unit tariff", <span key="t"><MoneyDisplay amount={transaction.unitTariff} />/L</span>],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          {status === "COMPLETED" && (
            <div className="rounded-xl bg-[#0AC6A2]/10 px-4 py-3 text-sm text-[#068A70]">
              Dispensed <LitresDisplay litres={transaction.dispensedQtyL ?? 0} /> · Total <MoneyDisplay amount={transaction.totalAmount ?? 0} /> — consumption posted.
            </div>
          )}

          {status === "FUELLING_IN_PROGRESS" && (
            <div className="grid gap-2">
              <Label htmlFor="dispensedQty">Actual quantity dispensed (L)</Label>
              <Input id="dispensedQty" type="number" step="0.01" value={dispensedQty} aria-invalid={!!qtyError} onChange={(e) => setDispensedQty(e.target.value)} />
              {qtyError ? <p className="text-xs text-destructive">{qtyError}</p> : <p className="text-sm text-muted-foreground">Total <MoneyDisplay amount={qty * transaction.unitTariff} /></p>}
            </div>
          )}

          {(status === "AUTHORISED" || status === "FUELLING_IN_PROGRESS") && (
            <div className="flex justify-end gap-2">
              <ConfirmDialog
                trigger={<Button variant="outline">Cancel transaction</Button>}
                title="Cancel this transaction?"
                description="The temporary authorisation hold is released and no balance is consumed."
                destructive
                onConfirm={() => run(() => cancelTransaction(transaction.id), "Transaction cancelled.")}
              />
              {status === "AUTHORISED" ? (
                <Button disabled={busy} onClick={() => run(() => startFuelling(transaction.id), "Pump released — start fuelling.")}>
                  Start fuelling
                </Button>
              ) : (
                <Button disabled={busy || !!qtyError} onClick={() => run(() => completeTransaction(transaction.id, qty), "Transaction completed.")}>
                  {busy ? "Completing…" : "Complete transaction"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Station</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{transaction.stationName}</CardContent>
      </Card>
    </div>
  )
}
