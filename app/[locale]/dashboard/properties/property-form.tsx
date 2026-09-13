"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { upsertPropertyAction } from "@/lib/biz-actions"
import { AlertCircle, MapPin, Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { PropertyPhotos, MAX_LISTING_PHOTOS } from "@/components/property-photos"
import { PropertyCardPreview } from "@/components/property-card-preview"

export const LISTING_STATUSES = ["active", "pending", "sold", "rented"] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]
export const HOME_TYPES = ["house", "condo", "townhome", "manufactured", "land", "multi-family"] as const
export type HomeType = (typeof HOME_TYPES)[number]
export { MAX_LISTING_PHOTOS }

interface PropertyFormProps {
  businessId: number
  agentName: string
  listing?: {
    id: number
    type: "for-sale" | "for-rent"
    title: string
    description: string | null
    priceCents: number
    beds: number | null
    baths: number | null
    sqft: number | null
    yearBuilt: number | null
    homeType: string | null
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

const fmtPrice = (digits: string) => (digits ? Number(digits).toLocaleString("en-US") : "")

export function PropertyForm({ businessId, agentName, listing }: PropertyFormProps) {
  const t = useTranslations("dashboardProperties")
  const tc = useTranslations("propertyCard")
  const [state, action] = useFormState(upsertPropertyAction, {})

  const existingPhotos = listing
    ? [listing.imageUrl, ...(((listing.photosJson as string[] | null) ?? []))].filter((u): u is string => !!u)
    : []
  const initialStatus: ListingStatus = LISTING_STATUSES.includes(listing?.status as ListingStatus)
    ? (listing!.status as ListingStatus)
    : "active"

  // Live state for the preview card
  const [type, setType] = useState<"for-sale" | "for-rent">(listing?.type ?? "for-sale")
  const [priceDigits, setPriceDigits] = useState(listing ? String(Math.round(listing.priceCents / 100)) : "")
  const [address, setAddress] = useState(listing?.address ?? "")
  const [beds, setBeds] = useState(listing?.beds != null ? String(listing.beds) : "")
  const [baths, setBaths] = useState(listing?.baths != null ? String(listing.baths) : "")
  const [sqft, setSqft] = useState(listing?.sqft != null ? String(listing.sqft) : "")
  const [homeType, setHomeType] = useState<HomeType>((HOME_TYPES as readonly string[]).includes(listing?.homeType ?? "") ? (listing!.homeType as HomeType) : "house")
  const [status, setStatus] = useState<ListingStatus>(initialStatus)
  const [coverPreview, setCoverPreview] = useState<string | null>(existingPhotos[0] ?? null)

  const field =
    "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
  const label = "text-sm font-medium"
  const hint = "text-xs text-muted-foreground"
  const section = "space-y-3 rounded-2xl border bg-card p-5"
  const h = "font-display text-base font-semibold"

  return (
    <form action={action} className="pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:pb-8">
      <div className="space-y-5">
        {listing && <input type="hidden" name="listingId" value={listing.id} />}

        {state.error && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}

        {/* 1. Photos */}
        <section className={section}>
          <h2 className={h}>{t("secPhotos")}</h2>
          <div>
            <PropertyPhotos
              businessId={businessId}
              initial={existingPhotos}
              onCoverChange={setCoverPreview}
              labels={{
                title: t("photosLabel", { max: MAX_LISTING_PHOTOS }),
                hint: t("photosHint"),
                add: t("photosAdd"),
                drop: t("photosDrop"),
                cover: t("coverPhoto"),
                makeCover: t("makeCover"),
                remove: t("photoRemove"),
                tooMany: t("photosTooMany", { max: MAX_LISTING_PHOTOS }),
                badType: t("photosBadType"),
                uploadFailed: t("photosUploadFailed"),
                count: t("photosCount"),
              }}
            />
          </div>
        </section>

        {/* 2. Listing type */}
        <section className={section}>
          <h2 className={h}>{t("listingType")}</h2>
          <div className="inline-flex rounded-full border bg-background p-1">
            {(["for-sale", "for-rent"] as const).map((v) => (
              <label key={v} className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition ${type === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
                {v === "for-sale" ? t("forSale") : t("forRent")}
              </label>
            ))}
          </div>
        </section>

        {/* 3. Price */}
        <section className={section}>
          <h2 className={h}>{t("priceLabel")} <span className="text-destructive">*</span></h2>
          <div className="relative max-w-xs">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <input
              name="priceCents"
              inputMode="numeric"
              value={fmtPrice(priceDigits)}
              onChange={(e) => setPriceDigits(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
              placeholder={type === "for-rent" ? "2,400" : "649,000"}
              required
              className={`${field} pl-8 pr-14 text-base font-semibold tabular-nums`}
            />
            {type === "for-rent" && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">/mo</span>}
          </div>
          <p className={hint}>{type === "for-rent" ? t("priceHintRent") : t("priceHintSale")}</p>
        </section>

        {/* 4. Address */}
        <section className={section}>
          <h2 className={h}>{t("addressLabel")}</h2>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="238 S J St, Lompoc, CA 93436" className={`${field} pl-10`} autoComplete="street-address" />
          </div>
          <p className={hint}>{t("addressHint")}</p>
        </section>

        {/* 5. Home facts */}
        <section className={section}>
          <h2 className={h}>{t("secFacts")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="beds" className={label}>{t("bedsLabel")}</label>
              <input id="beds" name="beds" type="number" min="0" step="1" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" className={field} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="baths" className={label}>{t("bathsLabel")}</label>
              <input id="baths" name="baths" type="number" min="0" step="0.5" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" className={field} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sqft" className={label}>{t("sqftLabel")}</label>
              <input id="sqft" name="sqft" type="number" min="0" step="1" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1496" className={field} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="yearBuilt" className={label}>{t("yearBuiltLabel")}</label>
              <input id="yearBuilt" name="yearBuilt" type="number" min="1800" max="2100" step="1" defaultValue={listing?.yearBuilt ?? ""} placeholder="1978" className={field} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="homeType" className={label}>{t("homeTypeLabel")}</label>
              <select id="homeType" name="homeType" value={homeType} onChange={(e) => setHomeType(e.target.value as HomeType)} className={field}>
                {HOME_TYPES.map((k) => (
                  <option key={k} value={k}>{tc(`homeType.${k}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="title" className={label}>{t("titleLabel")}</label>
            <input id="title" name="title" type="text" defaultValue={listing?.title} placeholder={t("titlePlaceholder")} className={field} />
            <p className={hint}>{t("titleHint")}</p>
          </div>
        </section>

        {/* 6. Description */}
        <section className={section}>
          <h2 className={h}>{t("secDescription")}</h2>
          <textarea id="description" name="description" defaultValue={listing?.description ?? ""} placeholder={t("descriptionPlaceholder")} rows={6} className={field} />
          <p className={hint}>{t("descriptionHint")}</p>
        </section>

        {/* 7. Open house + 8. Status */}
        <section className={section}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="openHouseAt" className={label}>{t("openHouseLabel")}</label>
              <input id="openHouseAt" name="openHouseAt" type="datetime-local" defaultValue={toPacificLocal(listing?.openHouseAt)} className={field} />
              <p className={hint}>{t("openHouseHint")}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="status" className={label}>{t("statusLabel")}</label>
              <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)} className={field}>
                {LISTING_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
              <p className={hint}>{t("statusHint")}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Live preview */}
      <aside className="mt-6 lg:mt-0">
        <div className="lg:sticky lg:top-24">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> {t("previewTitle")}
          </div>
          <PropertyCardPreview
            photo={coverPreview}
            price={priceDigits ? Number(priceDigits) : null}
            type={type}
            beds={beds}
            baths={baths}
            sqft={sqft}
            address={address}
            homeTypeLabel={tc(`homeType.${homeType}`)}
            status={status}
            agentName={agentName.replace(/,\s*Realtor/i, "")}
            labels={{
              forSale: tc("forSale"), forRent: tc("forRent"), pending: tc("pending"), sold: tc("sold"), rented: tc("rented"),
              photosComing: tc("photosComing"), bd: tc("bd"), ba: tc("ba"), sqft: tc("sqft"), listingBy: tc("listingBy", { name: "{name}" }),
              forSaleType: tc("typeForSale", { type: "{type}" }), forRentType: tc("typeForRent", { type: "{type}" }),
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">{t("previewHint")}</p>
        </div>
      </aside>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur lg:static lg:col-span-2 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">{t("saveHint")}</span>
          <div className="flex items-center gap-2">
            {listing && (
              <a href={`/listings/${listing.id}`} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-2.5 text-sm font-medium hover:bg-accent">
                {t("preview")}
              </a>
            )}
            <SubmitButton isEdit={!!listing} labels={{ saving: t("savePending"), create: t("saveCreate"), edit: t("saveEdit") }} />
          </div>
        </div>
      </div>
    </form>
  )
}

function SubmitButton({ isEdit, labels }: { isEdit: boolean; labels: { saving: string; create: string; edit: string } }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? labels.saving : isEdit ? labels.edit : labels.create}
    </button>
  )
}
