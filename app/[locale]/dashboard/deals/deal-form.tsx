"use client"

import { useFormState, useFormStatus } from "react-dom"
import { useState } from "react"
import { saveDealAction, type DealState } from "@/lib/biz-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { differenceInDays } from "date-fns"

type Deal = {
  id: number
  type: "coupon" | "special" | "announcement"
  title: string
  description: string | null
  discountText: string | null
  terms: string | null
  startsAt: Date
  expiresAt: Date
  imageUrl: string | null
}

function toLocalDateInput(d: Date) {
  const date = new Date(d)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function relativeLabel(dateStr: string): string {
  if (!dateStr) return ""
  const days = differenceInDays(new Date(dateStr + "T00:00:00"), new Date())
  if (days < 0) return "In the past"
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `In ${days} days`
}

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="min-w-32">
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Saving…
        </span>
      ) : editing ? "Save changes" : "Create deal"}
    </Button>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-sm text-destructive">{message}</p>
}

const DESC_MAX = 500

export function DealForm({ deal }: { deal?: Deal }) {
  const [state, action] = useFormState<DealState, FormData>(
    saveDealAction,
    undefined
  )

  const startDefault = deal
    ? toLocalDateInput(deal.startsAt)
    : toLocalDateInput(new Date())
  const expiresDefault = deal
    ? toLocalDateInput(deal.expiresAt)
    : toLocalDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  const [descLen, setDescLen] = useState(deal?.description?.length ?? 0)
  const [expiresVal, setExpiresVal] = useState(expiresDefault)
  const [showPreview, setShowPreview] = useState(false)
  const [previewType, setPreviewType] = useState<Deal["type"]>(deal?.type ?? "coupon")
  const [previewTitle, setPreviewTitle] = useState(deal?.title ?? "")
  const [previewDesc, setPreviewDesc] = useState(deal?.description ?? "")
  const [previewDiscount, setPreviewDiscount] = useState(deal?.discountText ?? "")

  return (
    <form action={action} className="space-y-6">
      {deal && <input type="hidden" name="dealId" value={deal.id} />}

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={deal?.type ?? "coupon"}
          onChange={(e) => setPreviewType(e.target.value as Deal["type"])}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="coupon">Coupon</option>
          <option value="special">Special</option>
          <option value="announcement">Announcement</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={deal?.title ?? ""}
          placeholder="$5 off any haircut"
          onChange={(e) => setPreviewTitle(e.target.value)}
          className={state?.fieldErrors?.title ? "border-destructive" : ""}
        />
        <FieldError message={state?.fieldErrors?.title} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className={`text-xs ${descLen > DESC_MAX ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {descLen}/{DESC_MAX}
          </span>
        </div>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={deal?.description ?? ""}
          maxLength={DESC_MAX}
          onChange={(e) => {
            setDescLen(e.target.value.length)
            setPreviewDesc(e.target.value)
          }}
          className={state?.fieldErrors?.description ? "border-destructive" : ""}
        />
        <FieldError message={state?.fieldErrors?.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discountText">Discount label</Label>
          <Input
            id="discountText"
            name="discountText"
            placeholder="20% OFF, BOGO, FREE"
            defaultValue={deal?.discountText ?? ""}
            onChange={(e) => setPreviewDiscount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms</Label>
          <Input
            id="terms"
            name="terms"
            placeholder="One per customer"
            defaultValue={deal?.terms ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="date"
            required
            defaultValue={startDefault}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="expiresAt">Expires</Label>
            {expiresVal && (
              <span className="text-xs text-muted-foreground">{relativeLabel(expiresVal)}</span>
            )}
          </div>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            required
            defaultValue={expiresDefault}
            onChange={(e) => setExpiresVal(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Deal image</Label>
        {deal?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.imageUrl}
            alt=""
            className="h-32 w-48 rounded border object-cover"
          />
        )}
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>

      {/* Preview toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {showPreview ? "Hide preview" : "Preview deal card"}
        </button>

        {showPreview && (
          <div className="mt-3 max-w-xs">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Preview</p>
            <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize">
                  {previewType}
                </span>
                {previewDiscount && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase text-primary-foreground">
                    {previewDiscount}
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">
                {previewTitle || <span className="text-muted-foreground/50">Deal title</span>}
              </h3>
              {previewDesc && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{previewDesc}</p>
              )}
              {expiresVal && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Expires {new Date(expiresVal + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SaveButton editing={!!deal} />
    </form>
  )
}
