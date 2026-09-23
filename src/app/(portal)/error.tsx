"use client"

import { AlertTriangle, RefreshCw } from "@/components/icons"
import { Button } from "@/components/ui/button"

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-[#EB2239]/10 text-[#EB2239]">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t load this page. Your data is safe — please try again.
      </p>
      <Button onClick={reset} className="mt-6">
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  )
}
