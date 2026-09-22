"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Camera, Printer, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { MoneyDisplay, LitresDisplay } from "@/components/shared/money-display"
import { DateTimeDisplay } from "@/components/shared/date-time-display"
import { validateTicketByOtp, authoriseTicket } from "@/app/(portal)/validate-ticket/actions"

interface ValidatedTicket {
  ticketId: string
  ticketNo: string
  customerName: string
  customerTier: string | null
  vehicleRegNo: string | null
  productId: string
  productName: string
  remainingQuantityL: number
  expiresAt: string
  unitTariff: number
  stationName: string
  stationId: string
}

export function ValidateTicketFlow({ stationName }: { stationName: string }) {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [ticket, setTicket] = useState<ValidatedTicket | null>(null)
  const [quantity, setQuantity] = useState("")
  const [isAuthorising, setIsAuthorising] = useState(false)

  async function handleValidate() {
    setIsValidating(true)
    try {
      const result = await validateTicketByOtp(otp)
      setTicket(result)
      setQuantity(String(result.remainingQuantityL))
      toast.success(`Valid Ticket ${result.ticketNo}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to validate ticket.")
    } finally {
      setIsValidating(false)
    }
  }

  async function handleAuthorise() {
    if (!ticket) return
    setIsAuthorising(true)
    try {
      const { transactionId } = await authoriseTicket(ticket.ticketId, Number(quantity))
      toast.success("Ticket authorised. Proceeding to dispensing.")
      router.push(`/dispensing/${transactionId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to authorise ticket.")
    } finally {
      setIsAuthorising(false)
    }
  }

  if (!ticket) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Validate Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="otp">
              <TabsList className="mb-4">
                <TabsTrigger value="otp">OTP</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>
              <TabsContent value="otp" className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleValidate()}
                  />
                </div>
                <Button onClick={handleValidate} disabled={isValidating || !otp}>
                  {isValidating ? "Validating…" : "Validate"}
                </Button>
              </TabsContent>
              <TabsContent value="qr" className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Scan the customer&apos;s QR code to validate the ticket
                </p>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Camera scanning requires the POS hardware integration.")}
                >
                  <Camera className="size-4" />
                  Activate Camera Scanner
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Enter OTP or scan QR code to view ticket details
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        REDEMPTION PORTAL / Step 2: Ticket Validation Details
      </p>
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-600" />
        <span className="font-medium">Valid Ticket {ticket.ticketNo}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Product &amp; Enter Quantity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Input value={ticket.productName} disabled />
              <p className="text-xs text-muted-foreground">Restricted by corporate voucher policy</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity (L)</Label>
              <Input
                id="quantity"
                type="number"
                max={ticket.remainingQuantityL}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Max Allowed: <LitresDisplay litres={ticket.remainingQuantityL} />
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Customer Name</p>
                <p className="font-medium">{ticket.customerName}</p>
                <p className="text-xs text-muted-foreground">{ticket.customerTier}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vehicle Reg. No.</p>
                <p className="font-medium">{ticket.vehicleRegNo ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Authorised Quantity</p>
                <p className="font-medium">
                  <LitresDisplay litres={ticket.remainingQuantityL} />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Fuel Type</p>
                <p className="font-medium">{ticket.productName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Validation Mode</p>
                <p className="font-medium">Station OTP</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Fuel Rate</p>
                <p className="font-medium">
                  <MoneyDisplay amount={ticket.unitTariff} />/L
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p className="font-medium">
                  <DateTimeDisplay value={ticket.expiresAt} />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Station</p>
                <p className="font-medium">{ticket.stationName}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => toast.info("Prefill slip printing requires a connected printer.")}
              >
                <Printer className="size-4" />
                Print Prefill Slip
              </Button>
              <Button onClick={handleAuthorise} disabled={isAuthorising}>
                {isAuthorising ? "Authorising…" : "Proceed to Authorise"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funding Ledger</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Active Balance Available</p>
              <p className="text-lg font-semibold">
                <LitresDisplay litres={ticket.remainingQuantityL} />
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <StatusBadge status="AUTHORISED" />
            </div>
            <div>
              <p className="text-muted-foreground">Station Authoriser</p>
              <p className="font-medium">{stationName}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
