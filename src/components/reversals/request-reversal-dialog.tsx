"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Undo2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requestReversal } from "@/app/(portal)/reversals/actions"
import { LoadingButton } from "@/components/shared/loading-button"

export function RequestReversalDialog({ transactionId, reference }: { transactionId: string; reference: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await requestReversal(transactionId, reason)
      toast.success("Reversal submitted for approval.")
      setOpen(false)
      setReason("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request reversal.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Undo2 className="size-4" />
        Request reversal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse {reference}</DialogTitle>
          <DialogDescription>A finance checker must approve this. On approval the wallet balance, ticket entitlement and dealer settlement are all restored.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="reversal-reason">Reason</Label>
          <Textarea id="reversal-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Pump meter fault — customer over-charged" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <LoadingButton disabled={busy || !reason.trim()} onClick={submit} loading={busy} loadingText="Submitting…">{"Submit for approval"}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
