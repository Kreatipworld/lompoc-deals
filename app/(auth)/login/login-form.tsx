"use client"

import { useFormState, useFormStatus } from "react-dom"
import Link from "next/link"
import { loginAction, type FormState } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  )
}

export function LoginForm({ from }: { from?: string }) {
  const [state, action] = useFormState<FormState, FormData>(
    loginAction,
    undefined
  )

  return (
    <form action={action} className="space-y-5">
      {from && <input type="hidden" name="from" value={from} />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
