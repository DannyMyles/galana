"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { requestReversal } from "@/app/(portal)/reversals/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ReversalRequestForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await requestReversal({ transaction: String(formData.get("transaction") ?? ""), reason: String(formData.get("reason") ?? "") })
        setDone(true)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create the reversal.")
      }
    })
  }

  if (done) return <p className="rounded-xl bg-[#0AC6A2]/15 px-4 py-3 text-sm text-[#068A70]">Reversal submitted for approval.</p>

  return (
    <form action={submit} className="grid gap-4 rounded-xl border border-[#E4E7F2] bg-white p-5 sm:max-w-xl">
      <label className="grid gap-1 text-sm">Fuelling transaction reference<Input name="transaction" required placeholder="Fuel Card Transaction Log name" /></label>
      <label className="grid gap-1 text-sm">Reason<Input name="reason" required /></label>
      {error && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-2.5 text-sm text-[#D01A2F]">{error}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={isPending}>{isPending ? "Submitting…" : "Submit for approval"}</Button></div>
    </form>
  )
}
