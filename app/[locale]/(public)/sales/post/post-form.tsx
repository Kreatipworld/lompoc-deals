"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { Car, Package, Tag } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SuccessCheck } from "@/components/motion/success-check"
import { SalePhotosUploader } from "@/components/sale-photos-uploader"
import { createSaleListing, type PostState } from "@/lib/sales-actions"
import { categoriesForKind, CONDITIONS, PRICE_TYPES, type PriceType, type SaleKind } from "@/lib/sales"

const selectClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-base shadow-sm outline-none ring-primary/30 focus:ring-2 sm:text-sm"

function Submit({ label, pending: pendingLabel }: { label: string; pending: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? pendingLabel : label}
    </Button>
  )
}

function Pill({ active, children, onClick, name, value }: { active: boolean; children: React.ReactNode; onClick: () => void; name?: string; value?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-name={name}
      data-value={value}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-card hover:bg-accent"}`}
    >
      {children}
    </button>
  )
}

/**
 * The post form. Kind first (three big buttons), then only the fields that
 * kind needs. Photos upload as they are picked; the URLs ride in a hidden
 * field. Errors come back as codes and are translated here.
 */
export function SalePostForm({ userId }: { userId: number }) {
  const t = useTranslations("sales")
  const [kind, setKind] = useState<SaleKind>("item")
  const [category, setCategory] = useState<string>("furniture")
  const [priceType, setPriceType] = useState<PriceType>("fixed")
  const [condition, setCondition] = useState<string>("good")
  const [photos, setPhotos] = useState<string[]>([])
  const [state, action] = useFormState<PostState, FormData>(createSaleListing, undefined)

  const pickKind = (k: SaleKind) => {
    setKind(k)
    setCategory(categoriesForKind(k)[0])
    if (k === "garage-sale") setPriceType("fixed")
  }
  const isFree = priceType === "free" || category === "free"
  const isGarage = kind === "garage-sale"
  const isVehicle = kind === "vehicle"

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" data-sales-posted={state.id}>
        <SuccessCheck size={44} strokeWidth={3} />
        <h2 className="text-xl font-semibold">{t("post.successHeading")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t("post.successBody")}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link href="/sales" className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {t("post.successBrowse")}
          </Link>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-accent">
            {t("post.successAnother")}
          </button>
        </div>
      </div>
    )
  }

  const kinds: { k: SaleKind; icon: React.ReactNode; label: string; hint: string }[] = [
    { k: "item", icon: <Package className="h-5 w-5" />, label: t("post.kindItem"), hint: t("post.kindItemHint") },
    { k: "garage-sale", icon: <Tag className="h-5 w-5" />, label: t("post.kindGarage"), hint: t("post.kindGarageHint") },
    { k: "vehicle", icon: <Car className="h-5 w-5" />, label: t("post.kindVehicle"), hint: t("post.kindVehicleHint") },
  ]

  return (
    <form action={action} className="space-y-6" data-sales-post-form>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="priceType" value={priceType} />
      <input type="hidden" name="condition" value={isGarage ? "" : condition} />
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* Kind */}
      <fieldset>
        <legend className="text-sm font-medium">{t("post.kind")}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {kinds.map(({ k, icon, label, hint }) => (
            <button
              key={k}
              type="button"
              onClick={() => pickKind(k)}
              aria-pressed={kind === k}
              data-kind={k}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${kind === k ? "border-primary bg-primary/[0.06] text-primary" : "border-border/80 bg-card hover:bg-accent"}`}
            >
              {icon}
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Category */}
      {!isGarage && !isVehicle && (
        <div className="space-y-2">
          <Label htmlFor="category">{t("post.category")}</Label>
          <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
            {categoriesForKind(kind).map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}.name`)}
              </option>
            ))}
          </select>
        </div>
      )}
      {(isGarage || isVehicle) && <input type="hidden" name="category" value={category} />}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("post.title")} *</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={4}
          maxLength={120}
          placeholder={isGarage ? t("post.titlePlaceholderGarage") : isVehicle ? t("post.titlePlaceholderVehicle") : t("post.titlePlaceholderItem")}
        />
      </div>

      {/* Vehicle facts */}
      {isVehicle && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="year">{t("post.year")} *</Label>
            <Input id="year" name="year" inputMode="numeric" required minLength={4} maxLength={4} placeholder="2014" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">{t("post.make")} *</Label>
            <Input id="make" name="make" required maxLength={40} placeholder="Toyota" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">{t("post.model")} *</Label>
            <Input id="model" name="model" required maxLength={40} placeholder="Tacoma" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">{t("post.mileage")}</Label>
            <Input id="mileage" name="mileage" inputMode="numeric" maxLength={9} placeholder="121,000" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="transmission">{t("post.transmission")}</Label>
            <select id="transmission" name="transmission" defaultValue="" className={selectClass}>
              <option value="">{t("post.transmissionAny")}</option>
              <option value="automatic">{t("post.automatic")}</option>
              <option value="manual">{t("post.manual")}</option>
            </select>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t("post.description")} *</Label>
        <Textarea id="description" name="description" required minLength={10} maxLength={4000} rows={5} placeholder={t("post.descriptionPlaceholder")} />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label>{t("post.photos")}</Label>
        <p className="text-xs text-muted-foreground">{t("post.photosHint")}</p>
        <SalePhotosUploader userId={userId} onChange={setPhotos} />
      </div>

      {/* Price + condition */}
      {!isGarage && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">{t("post.price")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              {!isFree && (
                <div className="relative w-36">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="price" name="price" inputMode="decimal" className="pl-7" placeholder="120" required={!isFree} />
                </div>
              )}
              {PRICE_TYPES.map((p) => (
                <Pill key={p} active={priceType === p} onClick={() => setPriceType(p)} name="priceType" value={p}>
                  {t(`post.priceType.${p}`)}
                </Pill>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("post.condition")}</Label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <Pill key={c} active={condition === c} onClick={() => setCondition(c)} name="condition" value={c}>
                  {t(`conditions.${c}`)}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Where */}
      {isGarage ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">{t("post.address")} *</Label>
            <Input id="address" name="address" required maxLength={300} placeholder={t("post.addressPlaceholder")} autoComplete="street-address" />
            <p className="text-xs text-muted-foreground">{t("post.addressHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">{t("post.date")} *</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("post.endDate")}</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("post.startTime")}</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue="08:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t("post.endTime")}</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue="14:00" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="area">{t("post.area")} *</Label>
          <Input id="area" name="area" required maxLength={60} placeholder={t("post.areaPlaceholder")} />
          <p className="text-xs text-muted-foreground">{t("post.areaHint")}</p>
        </div>
      )}

      {/* Contact */}
      <fieldset className="space-y-3 rounded-2xl border border-border/80 bg-secondary/30 p-4">
        <legend className="px-1 text-sm font-medium">{t("post.contact")}</legend>
        <p className="text-xs text-muted-foreground">{t("post.contactHint")}</p>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">{t("post.phone")}</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" maxLength={30} autoComplete="tel" placeholder="(805) 555-0100" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showPhone" className="h-4 w-4 rounded border-border accent-primary" />
          {t("post.showPhone")}
        </label>
      </fieldset>

      {state && !state.ok && (
        <ul className="space-y-1 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" data-sales-errors>
          {state.errors.map((e) => (
            <li key={e}>{t(`errors.${e}`)}</li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">{t("post.rules")}</p>
      <Submit label={t("post.submit")} pending={t("post.submitting")} />
    </form>
  )
}
