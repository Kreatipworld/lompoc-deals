"use client"

import { useLocale, useTranslations } from "next-intl"
import { formatDistanceToNowStrict } from "date-fns"
import { es } from "date-fns/locale"
import { Camera, MapPin } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SafeImage } from "@/components/safe-image"
import { formatSalePrice, garageSaleWhen } from "@/lib/sales"
import type { SaleCardData } from "@/lib/sales-queries"

/** "Sat, Oct 3 · 8 AM–2 PM" in Pacific time. */
export function SaleCard({ item, priority = false }: { item: SaleCardData; priority?: boolean }) {
  const t = useTranslations("sales")
  const locale = useLocale()
  const intl = locale === "es" ? "es-US" : "en-US"
  const price = formatSalePrice(item, { free: t("card.free"), obo: t("card.obo") }, intl)
  const when = item.kind === "garage-sale" ? garageSaleWhen(item.startsAt, item.endsAt, intl) : null
  const ago = formatDistanceToNowStrict(new Date(item.postedAt), { addSuffix: true, locale: locale === "es" ? es : undefined })
  const place = item.kind === "garage-sale" ? item.address : item.area
  const over = item.status === "sold" || item.status === "expired"

  return (
    <Link
      href={`/sales/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      data-sale-card={item.id}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary/[0.04]">
        {item.photo ? (
          <SafeImage
            src={item.photo}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            optWidth={640}
            loading={priority ? "eager" : "lazy"}
            fallback={<Placeholder label={t("card.noPhoto")} />}
          />
        ) : (
          <Placeholder label={item.kind === "garage-sale" ? t("card.garageSale") : t("card.noPhoto")} />
        )}
        {over && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-[11px] font-semibold text-background">
            {item.status === "sold" ? t("card.sold") : t("card.ended")}
          </span>
        )}
        {!over && item.kind === "garage-sale" && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-gold-foreground">
            {t("card.garageSale")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {price ? (
          <p className="font-display text-lg font-bold leading-none tabular-nums">{price}</p>
        ) : when ? (
          <p className="font-display text-base font-bold leading-tight">{when}</p>
        ) : null}
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90">{item.title}</p>
        {place && (
          <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{place}</span>
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/80">{t("browse.posted", { ago })}</p>
      </div>
    </Link>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <Camera className="h-7 w-7" strokeWidth={1.25} aria-hidden />
      <span className="text-xs">{label}</span>
    </div>
  )
}
