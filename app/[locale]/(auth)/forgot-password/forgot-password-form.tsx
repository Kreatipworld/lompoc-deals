"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Link } from "@/i18n/navigation"
import { Mail } from "lucide-react"
import {
  requestPasswordResetAction,
  type RequestResetState,
} from "@/lib/auth-actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-[transform,background-color,opacity] duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  )
}

export function ForgotPasswordForm() {
  const [state, action] = useFormState<RequestResetState, FormData>(
    requestPasswordResetAction,
    undefined
  )

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          If an account exists for that email, you&apos;ll receive a reset link shortly.
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
      </div>

      {state?.error && (
        <p className="form-message-enter rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        Remember it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
