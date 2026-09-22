"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalActionBarProps {
  onApprove: () => void | Promise<void>
  onReject: (reason: string) => void | Promise<void>
  approveLabel?: string
  rejectLabel?: string
  disabled?: boolean
}

/**
 * Standard approve/reject controls for Maker-Checker flows (wallet top-ups,
 * credit notes, admin overrides). Rejection always requires a reason per
 * US-FC-003; approval goes through a lightweight confirm step.
 */
export function ApprovalActionBar({
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  disabled,
}: ApprovalActionBarProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")

  return (
    <div className="flex items-center gap-2">
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="default" disabled={disabled}>
            <Check className="size-4" />
            {approveLabel}
          </Button>
        }
        title="Approve this request?"
        description="This action will be recorded against your account and cannot be undone."
        confirmLabel={approveLabel}
        onConfirm={onApprove}
      />

      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setRejectOpen(true)}
      >
        <X className="size-4" />
        {rejectLabel}
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this request is being rejected"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={async () => {
                await onReject(reason.trim())
                setReason("")
                setRejectOpen(false)
              }}
            >
              {rejectLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
