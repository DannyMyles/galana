"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"

import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { LoadingButton } from "@/components/shared/loading-button"

const INPUT = "h-12 rounded-xl border-transparent bg-white text-[#0B0B33] placeholder:text-[#8B8EAA] shadow-sm"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginInput) {
    setServerError(null)
    setIsSubmitting(true)

    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    })

    setIsSubmitting(false)

    if (result?.error) {
      setServerError("Invalid email or password.")
      return
    }

    router.push(searchParams.get("callbackUrl") ?? "/dashboard")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-white/75">
            Sign in to access your Galana Energies portal
          </p>
        </div>

        {serverError && (
          <p className="rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-[#87000A]">
            {serverError}
          </p>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email address</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email address" type="email" className={INPUT} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-white">Password</FormLabel>
                <a href="#" className="text-xs text-white/80 underline underline-offset-2 hover:text-white">
                  Forgot password?
                </a>
              </div>
              <FormControl>
                <Input placeholder="Enter your password" type="password" className={INPUT} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl text-sm font-semibold tracking-wide uppercase shadow-lg shadow-[#EB2239]/30" loading={isSubmitting} loadingText="Signing in…">
          {"Sign In"}
        </LoadingButton>

        <p className="text-center text-xs text-white/75">
          Need help?{" "}
          <a href="#" className="text-white underline underline-offset-2">
            Contact Support
          </a>
        </p>
      </form>
    </Form>
  )
}
