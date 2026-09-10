"use client"

import { useFormState, useFormStatus } from "react-dom"
import { upsertPropertyAction } from "@/lib/biz-actions"
import { AlertCircle, Images } from "lucide-react"
import { useTranslations } from "next-intl"

export const LISTING_STATUSES = ["active", "pending", "sold", "rented"] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]
export const MAX_LISTING_PHOTOS = 8

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
    photosJson: unknown
    status: string
    openHouseAt: Date | null
  }
}

/** Date → "YYYY-MM-DDTHH:mm" in Lompoc time, for a datetime-local input. */
function toPacificLocal(d: Date | null | undefined): string {
  if (!d) return ""
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00"
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`
}

export function PropertyForm({ listing }: PropertyFormProps) {
  const t = useTranslations("dashboardProperties")
  const [state, action] = useFormState(upsertPropertyAction, {})
  const existingPhotos = listing
    ? [listing.imageUrl, ...(((listing.photosJson as string[] | null) ?? []))].filter((u): u is string => !!u)
    : []
  const status: ListingStatus = LISTING_STATUSES.includes(listing?.status as ListingStatus)
    ? (listing!.status as ListingStatus)
    : "active"

  const field =
    "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"

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
        <input id="title" name="title" type="text" defaultValue={listing?.title} placeholder={t("titlePlaceholder")} required className={field} />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label htmlFor="priceCents" className="text-sm font-medium">
          {t("priceLabel")} <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <input
            id="priceCents"
            name="priceCents"
            type="number"
            min="0"
            step="1"
            defaultValue={listing ? Math.round(listing.priceCents / 100) : ""}
            placeholder="450000"
            required
            className={`${field} pl-8`}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("priceHint")}</p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium">{t("addressLabel")}</label>
        <input id="address" name="address" type="text" defaultValue={listing?.address ?? ""} placeholder="123 Main St, Lompoc, CA 93436" className={field} />
        <p className="text-xs text-muted-foreground">{t("addressHint")}</p>
      </div>

      {/* Status + open house */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">{t("statusLabel")}</label>
          <select id="status" name="status" defaultValue={status} className={field}>
            {LISTING_STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t("statusHint")}</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="openHouseAt" className="text-sm font-medium">{t("openHouseLabel")}</label>
          <input id="openHouseAt" name="openHouseAt" type="datetime-local" defaultValue={toPacificLocal(listing?.openHouseAt)} className={field} />
          <p className="text-xs text-muted-foreground">{t("openHouseHint")}</p>
        </div>
      </div>

      {/* Specs row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="beds" className="text-sm font-medium">{t("bedsLabel")}</label>
          <input id="beds" name="beds" type="number" min="0" step="1" defaultValue={listing?.beds ?? ""} placeholder="3" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="baths" className="text-sm font-medium">{t("bathsLabel")}</label>
          <input id="baths" name="baths" type="number" min="0" step="0.5" defaultValue={listing?.baths ?? ""} placeholder="2" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="sqft" className="text-sm font-medium">{t("sqftLabel")}</label>
          <input id="sqft" name="sqft" type="number" min="0" step="1" defaultValue={listing?.sqft ?? ""} placeholder="1200" className={field} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">{t("descriptionLabel")}</label>
        <textarea id="description" name="description" defaultValue={listing?.description ?? ""} placeholder={t("descriptionPlaceholder")} rows={4} className={field} />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <label htmlFor="photos" className="text-sm font-medium">
          {t("photosLabel", { max: MAX_LISTING_PHOTOS })}
        </label>
        {existingPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {existingPhotos.map((url, i) => (
              <label key={url} className="group relative block cursor-pointer overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] font-medium">
                  <input type="checkbox" name="keepPhoto" value={url} defaultChecked className="accent-primary" />
                  {i === 0 ? t("coverPhoto") : t("keepPhoto")}
                </span>
              </label>
            ))}
          </div>
        )}
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none"
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Images className="h-3.5 w-3.5" />
          {t("photosHint")}
        </p>
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
