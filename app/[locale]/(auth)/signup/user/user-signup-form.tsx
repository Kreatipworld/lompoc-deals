"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Link } from "@/i18n/navigation"
import { Mail, Lock, User, MapPin, Tag } from "lucide-react"
import { localSignupAction, type LocalSignupState } from "@/lib/user-signup-actions"
import { INTEREST_OPTIONS } from "@/lib/interest-options"

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

export function UserSignupForm() {
  const [state, action] = useFormState<LocalSignupState, FormData>(
    localSignupAction,
    undefined
  )

  return (
    <form action={action} className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Your name
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Jane Smith"
            className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
      </div>

      {/* Email */}
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

      {/* Password */}
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

      {/* City + ZIP (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-foreground">
            City <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              placeholder="Lompoc"
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="zip" className="text-sm font-medium text-foreground">
            ZIP <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            autoComplete="postal-code"
            placeholder="93436"
            maxLength={10}
            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
      </div>

      {/* Interests (optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Tag className="h-3.5 w-3.5" />
          Interests <span className="text-muted-foreground font-normal">(pick any)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <label key={interest} className="cursor-pointer">
              <input
                type="checkbox"
                name="interests"
                value={interest}
                className="peer sr-only"
              />
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary hover:border-primary/50">
                {interest}
              </span>
            </label>
          ))}
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
