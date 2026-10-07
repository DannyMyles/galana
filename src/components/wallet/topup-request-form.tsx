"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { requestTopUp } from "@/app/(portal)/funding-wallet/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TopUpRequestForm({ customers }: { customers: string[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await requestTopUp({
          customer: String(formData.get("customer") ?? ""),
          amount: Number(formData.get("amount") ?? 0),
          fundingAccount: String(formData.get("fundingAccount") ?? ""),
          remarks: String(formData.get("remarks") ?? "") || undefined,
        })
        setDone(true)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create the request.")
      }
    })
  }

  if (done) return <p className="rounded-xl bg-[#0AC6A2]/15 px-4 py-3 text-sm text-[#068A70]">Request submitted for approval. It has not been posted to the wallet.</p>

  return (
    <form action={submit} className="grid gap-4 rounded-xl border border-[#E4E7F2] bg-white p-5 sm:max-w-xl">
      <label className="grid gap-1 text-sm">Customer
        <select name="customer" required className="rounded-lg border border-[#E4E7F2] px-3 py-2">
          {customers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Amount (KES)<Input name="amount" type="number" min="1" step="0.01" required /></label>
      <label className="grid gap-1 text-sm">Funding account<Input name="fundingAccount" required placeholder="e.g. KES 1234567890 (Jaguar)" /></label>
      <label className="grid gap-1 text-sm">Remarks<Input name="remarks" /></label>
      <p className="text-xs text-[#6A6C8C]">A reference is generated automatically (e.g. TOPUP-20261008-X7K2).</p>
      {error && <p className="rounded-xl bg-[#EB2239]/10 px-4 py-2.5 text-sm text-[#D01A2F]">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>{isPending ? "Submitting…" : "Submit for approval"}</Button>
      </div>
    </form>
  )
}
