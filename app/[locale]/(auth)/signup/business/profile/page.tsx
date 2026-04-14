"use client"

import { useFormState, useFormStatus } from "react-dom"
import { profileSetupAction, type ProfileSetupState } from "@/lib/business-signup-actions"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { ImagePlus, Globe, Link2, ChevronRight, AlertCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save and add first deal"}
      {!pending && <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

export default function BusinessProfileSetupPage() {
  const [state, action] = useFormState<ProfileSetupState, FormData>(
    profileSetupAction,
    undefined
  )
  const searchParams = useSearchParams()
  const stripePending = searchParams.get("stripe_pending") === "1"

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step 4 of 5
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Set up your profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Add images and links so customers recognize your business.
        </p>
      </div>

      {stripePending && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your account was created on the <strong>Free</strong> plan. You can upgrade to a paid
            plan from your billing dashboard once payment processing is enabled.
          </span>
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Logo upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Logo <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 transition hover:border-primary/50">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload logo</span>
            <input type="file" name="logo" accept="image/*" className="sr-only" />
          </label>
        </div>

        {/* Cover image upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Cover image <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 transition hover:border-primary/50">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload cover image</span>
            <input type="file" name="cover" accept="image/*" className="sr-only" />
          </label>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            About your business <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Tell customers what makes your business special…"
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4 resize-none"
          />
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label htmlFor="website" className="text-sm font-medium text-foreground">
            Website <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="website"
              name="website"
              type="url"
              placeholder="https://yourbusiness.com"
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">Social links <span className="text-muted-foreground font-normal">(optional)</span></div>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="instagramUrl"
              type="url"
              placeholder="https://instagram.com/yourbusiness"
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="facebookUrl"
              type="url"
              placeholder="https://facebook.com/yourbusiness"
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">T</span>
            <input
              name="tiktokUrl"
              type="url"
              placeholder="https://tiktok.com/@yourbusiness"
              className="h-11 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            />
          </div>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton />

        <div className="text-center">
          <Link
            href="/signup/business/first-deal"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </Link>
        </div>
      </form>
    </div>
  )
}
