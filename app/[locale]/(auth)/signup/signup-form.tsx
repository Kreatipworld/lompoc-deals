"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Link } from "@/i18n/navigation"
import { Mail, Lock, Heart, Store } from "lucide-react"
import { signupAction, type FormState } from "@/lib/auth-actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-[transform,background-color,opacity] duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  )
}

export function SignupForm({
  claimSlug,
}: {
  claimSlug?: string | null
} = {}) {
  const [state, action] = useFormState<FormState, FormData>(
    signupAction,
    undefined
  )

  return (
    <form action={action} className="space-y-5">
      {claimSlug && <input type="hidden" name="claimSlug" value={claimSlug} />}

      {/* Role toggle — hidden when claiming (claim forces business role) */}
      {!claimSlug && (
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="role"
              value="local"
              defaultChecked
              className="peer sr-only"
            />
            <div className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border bg-background p-4 transition hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary/5">
              <Heart className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">I&apos;m a local</div>
              <div className="text-[11px] text-muted-foreground">
                Save favorites
              </div>
            </div>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="role"
              value="business"
              className="peer sr-only"
            />
            <div className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border bg-background p-4 transition hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary/5">
              <Store className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">I own a business</div>
              <div className="text-[11px] text-muted-foreground">
                Post your deals
              </div>
            </div>
          </label>
        </div>
      )}
      {claimSlug && (
        <input type="hidden" name="role" value="business" />
      )}

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

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            placeholder="At least 6 characters"
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
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
