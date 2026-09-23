"use client"

import { useState } from "react"
import { Check, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingButton } from "@/components/shared/loading-button"

interface ApprovalActionBarProps {
  onApprove: (comment: string) => void | Promise<void>
  onReject: (reason: string) => void | Promise<void>
  approveLabel?: string
  rejectLabel?: string
  disabled?: boolean
  disabledReason?: string
}

/**
 * Maker-checker controls. Approval records an optional checker comment
 * (US-FC-002); rejection always requires a reason (US-FC-003).
 */
export function ApprovalActionBar({
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  disabled,
  disabledReason,
}: ApprovalActionBarProps) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)

  const close = () => {
    setMode(null)
    setText("")
  }

  async function submit() {
    setBusy(true)
    try {
      if (mode === "approve") await onApprove(text.trim())
      else await onReject(text.trim())
      close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2" title={disabled ? disabledReason : undefined}>
      <Button size="sm" disabled={disabled} onClick={() => setMode("approve")}>
        <Check className="size-4" />
        {approveLabel}
      </Button>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => setMode("reject")}>
        <X className="size-4" />
        {rejectLabel}
      </Button>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "approve" ? approveLabel : rejectLabel} request</DialogTitle>
            <DialogDescription>
              {mode === "approve" ? "Your name, the time and any comment are recorded against this decision." : "A reason is required so the maker knows what to correct."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="decision-text">{mode === "approve" ? "Comment (optional)" : "Reason"}</Label>
            <Textarea id="decision-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "approve" ? "Add a note for the audit trail" : "Explain why this is being rejected"} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <LoadingButton variant={mode === "reject" ? "destructive" : "default"} disabled={busy || (mode === "reject" && !text.trim())} onClick={submit} loading={busy} loadingText="Saving…">
              {mode === "approve" ? approveLabel : rejectLabel}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
