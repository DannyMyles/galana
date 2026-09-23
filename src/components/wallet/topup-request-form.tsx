"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyDisplay } from "@/components/shared/money-display"
import { createTopUpRequestSchema, type CreateTopUpRequestInput } from "@/lib/validations/topup"
import { createTopUpRequest } from "@/app/(portal)/funding-wallet/actions"
import { LoadingButton } from "@/components/shared/loading-button"

export function TopupRequestForm({
  fundingAccounts,
  walletBalance,
}: {
  fundingAccounts: string[]
  walletBalance: number
}) {
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(createTopUpRequestSchema),
    defaultValues: { fundingAccount: fundingAccounts[0] ?? "", amount: 0, reference: "", remarks: "" },
  })

  async function onSubmit(values: CreateTopUpRequestInput) {
    try {
      await createTopUpRequest(values)
      toast.success("Top-up request submitted for approval.")
      form.reset({ fundingAccount: fundingAccounts[0] ?? "", amount: 0, reference: "", remarks: "" })
      router.push("/funding-wallet")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request.")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="fundingAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Account</FormLabel>
                    <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select funding account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fundingAccounts.map((account) => (
                          <SelectItem key={account} value={account}>
                            {account}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter amount"
                        {...field}
                        value={field.value as string}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q2-2026 Top-up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional remarks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => router.push("/funding-wallet")}>
                  Cancel
                </Button>
                <LoadingButton type="submit" disabled={form.formState.isSubmitting} loading={form.formState.isSubmitting} loadingText="Submitting…">
                  {"Submit for Approval"}
                </LoadingButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            <MoneyDisplay amount={walletBalance} />
          </p>
          <Button
            variant="link"
            className="mt-2 h-auto p-0"
            render={<Link href="/funding-wallet" />}
            nativeButton={false}
          >
            View Funding History
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
