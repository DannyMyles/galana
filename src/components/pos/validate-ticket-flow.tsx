"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, AlertTriangle, QrCode, ShieldCheck } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import {
  validateTicket,
  authoriseTicket,
  type ValidatedTicket,
} from "@/app/(portal)/validate-ticket/actions"

type Mode = "OTP" | "QR_CODE"

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{children}</p>
    </div>
  )
}

export function ValidateTicketFlow({ stationName }: { stationName: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("OTP")
  const [credential, setCredential] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [ticket, setTicket] = useState<ValidatedTicket | null>(null)
  const [rejection, setRejection] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState("")
  const [quantity, setQuantity] = useState("")
  const [isAuthorising, setIsAuthorising] = useState(false)
  const [authoriseError, setAuthoriseError] = useState<string | null>(null)

  function reset() {
    setTicket(null)
    setRejection(null)
    setCredential("")
    setAuthoriseError(null)
  }

  async function handleValidate() {
    setIsValidating(true)
    setRejection(null)
    try {
      const result = await validateTicket(mode, credential)
      if (result.ok) {
        setTicket(result.ticket)
        setQuantity(String(Math.min(result.ticket.remainingQuantityL, result.ticket.maxQuantityL)))
        setIdempotencyKey(crypto.randomUUID())
      } else {
        setRejection(result.reason)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to validate ticket.")
    } finally {
      setIsValidating(false)
    }
  }

  const qty = Number(quantity)
  const value = ticket ? qty * ticket.unitTariff : 0
  const quantityError = !ticket
    ? null
    : !quantity || qty <= 0
      ? "Enter a quantity greater than zero."
      : qty > ticket.remainingQuantityL
        ? `Cannot exceed the ticket's ${ticket.remainingQuantityL} L balance.`
        : qty > ticket.maxQuantityL
          ? `Cannot exceed the ${ticket.maxQuantityL} L per-transaction limit.`
          : value > ticket.maxValue
            ? `Value exceeds the KES ${ticket.maxValue.toLocaleString()} per-transaction limit.`
            : null

  async function handleAuthorise() {
    if (!ticket) return
    setIsAuthorising(true)
    setAuthoriseError(null)
    try {
      const result = await authoriseTicket(ticket.ticketId, qty, idempotencyKey)
      if (result.ok) {
        toast.success(result.duplicate ? "Resuming the open transaction for this ticket." : "Fuel authorised.")
        router.push(`/dispensing/${result.transactionId}`)
      } else {
        setAuthoriseError(result.reason)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to authorise ticket.")
    } finally {
      setIsAuthorising(false)
    }
  }

  if (rejection) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#EB2239]/10 text-[#EB2239]">
            <AlertTriangle className="size-8" />
          </div>
          <p className="rounded-full bg-[#EB2239]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#D01A2F] uppercase">Rejected</p>
          <h2 className="text-xl">Ticket cannot be redeemed</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{rejection}</p>
          <Button onClick={reset} className="mt-2">
            Try another ticket
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!ticket) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validate ticket</CardTitle>
            <p className="text-sm text-muted-foreground">Enter the customer&apos;s OTP or scan their QR code at {stationName}.</p>
          </CardHeader>
          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as Mode)
                setCredential("")
              }}
            >
              <TabsList className="mb-5">
                <TabsTrigger value="OTP">OTP</TabsTrigger>
                <TabsTrigger value="QR_CODE">QR Code</TabsTrigger>
              </TabsList>
              <TabsContent value="OTP" className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cred-otp">One-time password</Label>
                  <Input
                    id="cred-otp"
                    placeholder="e.g. 123456"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                    autoFocus
                  />
                </div>
              </TabsContent>
              <TabsContent value="QR_CODE" className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cred-qr">Scan QR code</Label>
                  <Input
                    id="cred-qr"
                    placeholder="Point the scanner at the customer's QR code"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                    autoFocus
                  />
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <QrCode className="size-3.5" />
                    Hardware scanners type the code here. Camera scanning arrives with the POS integration.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            <Button onClick={handleValidate} disabled={isValidating || !credential.trim()} className="mt-5 w-full">
              {isValidating ? "Validating…" : "Validate ticket"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Redemption flow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4 text-sm">
              {["Validate OTP / QR", "Confirm customer, vehicle and product", "Authorise fuel", "Dispense and confirm", "Consumption is posted"].map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#1226AA]/10 text-xs font-semibold text-[#1226AA]">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0AC6A2]/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-7 text-[#068A70]" />
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#068A70] uppercase">Approved</p>
            <p className="text-sm font-medium">Ticket {ticket.ticketNo} is valid — fuelling may proceed.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Validate a different ticket
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Confirm product &amp; quantity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Fuel product</Label>
                <Select value={ticket.productId} onValueChange={() => undefined}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ticket.productId}>{ticket.productName}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Only the product authorised on this ticket is available.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity dispensed (L)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  aria-invalid={!!quantityError}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                {quantityError ? (
                  <p className="text-xs text-destructive">{quantityError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Max <LitresDisplay litres={Math.min(ticket.remainingQuantityL, ticket.maxQuantityL)} />
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 rounded-2xl bg-[#F6F7FB] p-5 sm:grid-cols-3">
              <Detail label="Customer">{ticket.customerName}</Detail>
              <Detail label="Vehicle">{ticket.vehicleRegNo ?? "—"}</Detail>
              <Detail label="Fuel type">{ticket.productName}</Detail>
              <Detail label="Authorised quantity"><LitresDisplay litres={ticket.remainingQuantityL} /></Detail>
              <Detail label="Authorised value"><MoneyDisplay amount={ticket.remainingQuantityL * ticket.unitTariff} /></Detail>
              <Detail label="Ticket expiry"><DateTimeDisplay value={ticket.expiresAt} /></Detail>
              <Detail label="Unit tariff"><MoneyDisplay amount={ticket.unitTariff} />/L</Detail>
              <Detail label="Validated by">{ticket.mode === "OTP" ? "OTP" : "QR code"}</Detail>
              <Detail label="Station">{ticket.stationName}</Detail>
            </div>

            {authoriseError && (
              <p className="flex items-start gap-2 rounded-xl bg-[#EB2239]/10 px-4 py-3 text-sm text-[#D01A2F]">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {authoriseError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Total <span className="font-semibold text-foreground"><MoneyDisplay amount={value || 0} /></span>
              </p>
              <Button onClick={handleAuthorise} disabled={isAuthorising || !!quantityError}>
                <ShieldCheck className="size-4" />
                {isAuthorising ? "Authorising…" : "Proceed to authorise"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funding ledger</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <Detail label="Ticket balance"><LitresDisplay litres={ticket.remainingQuantityL} /></Detail>
            <Detail label="Per-transaction limit"><LitresDisplay litres={ticket.maxQuantityL} /></Detail>
            <Detail label="Value limit"><MoneyDisplay amount={ticket.maxValue} decimals={0} /></Detail>
            <Detail label="Customer tier">{ticket.customerTier ?? "—"}</Detail>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
