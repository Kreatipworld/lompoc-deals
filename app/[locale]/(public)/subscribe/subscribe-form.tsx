"use client"

import { useFormState, useFormStatus } from "react-dom"
import { subscribeAction, type SubscribeState } from "@/lib/subscribe-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SubscribeFormProps {
  variant?: "default" | "inverted"
}

function SubmitButton({ variant }: { variant: "default" | "inverted" }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className={
        variant === "inverted"
          ? "shrink-0 bg-primary-foreground font-semibold text-primary hover:bg-primary-foreground/90"
          : "shrink-0 font-semibold"
      }
    >
      {pending ? "Sending…" : "Subscribe free"}
    </Button>
  )
}

export function SubscribeForm({ variant = "default" }: SubscribeFormProps) {
  const [state, action] = useFormState<SubscribeState, FormData>(
    subscribeAction,
    undefined
  )

  if (state?.success) {
    return (
      <div
        className={`form-message-enter rounded-xl px-4 py-3 text-sm font-medium ${
          variant === "inverted"
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-success-muted text-success"
        }`}
      >
        ✓ {state.success}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="your@email.com"
          className={
            variant === "inverted"
              ? "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/50"
              : ""
          }
        />
        <SubmitButton variant={variant} />
      </div>

      {state?.error && (
        <p
          className={`form-message-enter rounded-lg px-3 py-2 text-sm ${
            variant === "inverted"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {state.error}
        </p>
      )}
    </form>
  )
}
