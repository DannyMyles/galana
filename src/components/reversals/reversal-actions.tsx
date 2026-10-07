"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { decideReversalRequest } from "@/app/(portal)/reversals/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ReversalActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function decide(decision: "Approved" | "Rejected") {
    setError(null)
    startTransition(async () => {
      try {
        await decideReversalRequest(requestId, decision, decision === "Rejected" ? reason : undefined)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not record the decision.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={isPending} onClick={() => decide("Approved")}>Approve</Button>
        <Input className="w-56" placeholder="Reason (required to reject)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button size="sm" variant="outline" disabled={isPending || !reason.trim()} onClick={() => decide("Rejected")}>Reject</Button>
      </div>
      {error && <p className="text-xs text-[#D01A2F]">{error}</p>}
    </div>
  )
}
