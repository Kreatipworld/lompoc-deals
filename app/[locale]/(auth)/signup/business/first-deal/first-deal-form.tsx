"use client"

import { useFormState, useFormStatus } from "react-dom"
import { saveDealAction, type DealState } from "@/lib/biz-actions"
import { ChevronRight } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Saving deal…" : "Publish deal & go to dashboard"}
      {!pending && <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

// Default dates: starts today, expires in 30 days
function defaultDates() {
  const now = new Date()
  const start = now.toISOString().slice(0, 16)
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  return { start, end }
}

export function FirstDealForm() {
  const [state, action] = useFormState<DealState, FormData>(saveDealAction, undefined)
  const { start, end } = defaultDates()

  return (
    <form action={action} className="space-y-4">
      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Deal type</label>
        <div className="flex gap-2">
          {[
            { value: "coupon", label: "Coupon" },
            { value: "special", label: "Special" },
            { value: "announcement", label: "Announcement" },
          ].map(({ value, label }) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={value === "coupon"}
                className="peer sr-only"
              />
              <span className="inline-flex h-9 items-center rounded-full border-2 border-border px-4 text-sm font-medium transition peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary hover:border-primary/40">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Deal title
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          placeholder="e.g. 20% off all services this weekend"
          className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
        />
      </div>

      {/* Discount text */}
      <div className="space-y-1.5">
        <label htmlFor="discountText" className="text-sm font-medium">
          Discount label <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="discountText"
          name="discountText"
          placeholder="e.g. 20% OFF, BOGO, Free with purchase"
          className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="More details about the deal…"
          className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4 resize-none"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="startsAt" className="text-sm font-medium">
            Starts
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={start}
            required
            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="expiresAt" className="text-sm font-medium">
            Expires
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={end}
            required
            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
