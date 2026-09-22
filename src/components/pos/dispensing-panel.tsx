"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Fuel } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { completeTransaction, cancelTransaction } from "@/app/(portal)/dispensing/[transactionId]/actions"
import type { TransactionStatus } from "@prisma/client"

interface DispensingTransaction {
  id: string
  reference: string
  status: TransactionStatus
  authorisedQtyL: number
  dispensedQtyL: number | null
  totalAmount: number | null
  unitTariff: number
  ticketNo: string
  vehicleRegNo: string | null
  customerName: string
  productName: string
  stationName: string
}

export function DispensingPanel({ transaction }: { transaction: DispensingTransaction }) {
  const router = useRouter()
  const [dispensedQty, setDispensedQty] = useState(String(transaction.authorisedQtyL))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDone = transaction.status === "COMPLETED"
  const isCancelled = transaction.status === "CANCELLED"
  const projectedTotal = Number(dispensedQty || 0) * transaction.unitTariff

  async function handleComplete() {
    setIsSubmitting(true)
    try {
      await completeTransaction(transaction.id, Number(dispensedQty))
      toast.success("Transaction completed.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete transaction.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancel() {
    try {
      await cancelTransaction(transaction.id)
      toast.success("Transaction cancelled.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel transaction.")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Fuel className="size-5" />
            {isDone ? "Transaction Complete" : isCancelled ? "Transaction Cancelled" : "Fuelling in Progress"}
          </CardTitle>
          <StatusBadge status={transaction.status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Transaction Ref</p>
              <p className="font-medium">{transaction.reference}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ticket No.</p>
              <p className="font-medium">{transaction.ticketNo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{transaction.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vehicle Reg. No.</p>
              <p className="font-medium">{transaction.vehicleRegNo ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Product</p>
              <p className="font-medium">{transaction.productName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Authorised Qty</p>
              <p className="font-medium">
                <LitresDisplay litres={transaction.authorisedQtyL} />
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Unit Tariff</p>
              <p className="font-medium">
                <MoneyDisplay amount={transaction.unitTariff} />/L
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Authorised Total</p>
              <p className="font-medium">
                <MoneyDisplay amount={transaction.authorisedQtyL * transaction.unitTariff} />
              </p>
            </div>
          </div>

          {!isDone && !isCancelled && (
            <div className="grid gap-2 rounded-md border p-4">
              <Label htmlFor="dispensedQty">Dispensed Qty (L)</Label>
              <Input
                id="dispensedQty"
                type="number"
                max={transaction.authorisedQtyL}
                value={dispensedQty}
                onChange={(event) => setDispensedQty(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Total Amount: <MoneyDisplay amount={projectedTotal} />
              </p>
            </div>
          )}

          {isDone && (
            <div className="rounded-md border bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
              <p>
                Dispensed <LitresDisplay litres={transaction.dispensedQtyL ?? 0} /> — Total{" "}
                <MoneyDisplay amount={transaction.totalAmount ?? 0} />
              </p>
            </div>
          )}

          {!isDone && !isCancelled && (
            <div className="flex justify-end gap-2 pt-2">
              <ConfirmDialog
                trigger={<Button variant="outline">Cancel Transaction</Button>}
                title="Cancel this transaction?"
                description="The temporary authorisation hold will be released."
                destructive
                onConfirm={handleCancel}
              />
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? "Completing…" : "Complete Transaction"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Station</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{transaction.stationName}</CardContent>
      </Card>
    </div>
  )
}
