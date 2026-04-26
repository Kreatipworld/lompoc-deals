"use client"

import { useFormState, useFormStatus } from "react-dom"
import { upsertPropertyAction } from "@/lib/biz-actions"
import { AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"

interface PropertyFormProps {
  listing?: {
    id: number
    type: "for-sale" | "for-rent"
    title: string
    description: string | null
    priceCents: number
    beds: number | null
    baths: number | null
    sqft: number | null
    address: string | null
    imageUrl: string | null
  }
}

export function PropertyForm({ listing }: PropertyFormProps) {
  const t = useTranslations("dashboardProperties")
  const [state, action] = useFormState(upsertPropertyAction, {})

  return (
    <form action={action} className="space-y-6">
      {listing && <input type="hidden" name="listingId" value={listing.id} />}

      {state.error && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("listingType")}</label>
        <div className="flex gap-3">
          {(["for-sale", "for-rent"] as const).map((v) => (
            <label
              key={v}
              className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="type"
                value={v}
                defaultChecked={listing ? listing.type === v : v === "for-sale"}
                className="accent-primary"
              />
              {v === "for-sale" ? t("forSale") : t("forRent")}
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          {t("titleLabel")} <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={listing?.title}
          placeholder={t("titlePlaceholder")}
          required
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label htmlFor="priceCents" className="text-sm font-medium">
          {t("priceLabel")} <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <input
            id="priceCents"
            name="priceCents"
            type="number"
            min="0"
            step="1"
            defaultValue={listing ? Math.round(listing.priceCents / 100) : ""}
            placeholder="450000"
            required
            className="w-full rounded-xl border bg-background py-2.5 pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("priceHint")}</p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium">
          {t("addressLabel")}
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={listing?.address ?? ""}
          placeholder="123 Main St, Lompoc, CA 93436"
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Specs row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="beds" className="text-sm font-medium">
            {t("bedsLabel")}
          </label>
          <input
            id="beds"
            name="beds"
            type="number"
            min="0"
            step="1"
            defaultValue={listing?.beds ?? ""}
            placeholder="3"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="baths" className="text-sm font-medium">
            {t("bathsLabel")}
          </label>
          <input
            id="baths"
            name="baths"
            type="number"
            min="0"
            step="0.5"
            defaultValue={listing?.baths ?? ""}
            placeholder="2"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="sqft" className="text-sm font-medium">
            {t("sqftLabel")}
          </label>
          <input
            id="sqft"
            name="sqft"
            type="number"
            min="0"
            step="1"
            defaultValue={listing?.sqft ?? ""}
            placeholder="1200"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          {t("descriptionLabel")}
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={listing?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          rows={4}
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Image */}
      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium">
          {listing?.imageUrl ? t("imageLabelEdit") : t("imageLabel")}
        </label>
        {listing?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt="Current photo"
            className="h-32 w-full rounded-xl object-cover"
          />
        )}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none"
        />
      </div>

      <SubmitButton isEdit={!!listing} labels={{ saving: t("savePending"), create: t("saveCreate"), edit: t("saveEdit") }} />
    </form>
  )
}

function SubmitButton({ isEdit, labels }: { isEdit: boolean; labels: { saving: string; create: string; edit: string } }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? labels.saving : isEdit ? labels.edit : labels.create}
    </button>
  )
}
