"use client"

import { useFormState, useFormStatus } from "react-dom"
import { subscribeAction, type SubscribeState } from "@/lib/subscribe-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending confirmation…" : "Subscribe"}
    </Button>
  )
}

export function SubscribeForm() {
  const [state, action] = useFormState<SubscribeState, FormData>(
    subscribeAction,
    undefined
  )
  return (
    <form action={action} className="space-y-4">
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

      {state?.error && (
        <p className="form-message-enter rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="form-message-enter rounded-lg bg-success-muted px-3 py-2 text-sm text-success">
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
