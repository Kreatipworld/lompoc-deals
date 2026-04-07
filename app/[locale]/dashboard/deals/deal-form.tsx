"use client"

import { useFormState, useFormStatus } from "react-dom"
import { saveDealAction, type DealState } from "@/lib/biz-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
  // Format as yyyy-MM-dd for <input type="date">
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Save changes" : "Create deal"}
    </Button>
  )
}

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

  return (
    <form action={action} className="space-y-6">
      {deal && <input type="hidden" name="dealId" value={deal.id} />}

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={deal?.type ?? "coupon"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={deal?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discountText">Discount label</Label>
          <Input
            id="discountText"
            name="discountText"
            placeholder="20% OFF, BOGO, FREE"
            defaultValue={deal?.discountText ?? ""}
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
          <Label htmlFor="expiresAt">Expires</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            required
            defaultValue={expiresDefault}
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

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SaveButton editing={!!deal} />
    </form>
  )
}
