"use client"

import { useFormState, useFormStatus } from "react-dom"
import Link from "next/link"
import { signupAction, type FormState } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account…" : "Sign up"}
    </Button>
  )
}

export function SignupForm() {
  const [state, action] = useFormState<FormState, FormData>(
    signupAction,
    undefined
  )

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="role"
            value="local"
            defaultChecked
            className="peer sr-only"
          />
          <div className="rounded-md px-3 py-2 text-center text-sm font-medium peer-checked:bg-primary peer-checked:text-primary-foreground">
            I&apos;m a local
          </div>
        </label>
        <label className="cursor-pointer">
          <input
            type="radio"
            name="role"
            value="business"
            className="peer sr-only"
          />
          <div className="rounded-md px-3 py-2 text-center text-sm font-medium peer-checked:bg-primary peer-checked:text-primary-foreground">
            I own a business
          </div>
        </label>
      </div>

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
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
