import { getTranslations } from "next-intl/server"
import {
  Accessibility,
  Armchair,
  Baby,
  CalendarCheck,
  CreditCard,
  Heart,
  PawPrint,
  ShoppingBag,
  SquareParking,
  Toilet,
  Truck,
  Users,
  Utensils,
  Wifi,
  Info,
  type LucideIcon,
} from "lucide-react"
import { AMENITIES } from "@/lib/amenities"

const ICONS: Record<string, LucideIcon> = {
  Accessibility,
  Armchair,
  Baby,
  CalendarCheck,
  CreditCard,
  Heart,
  PawPrint,
  ShoppingBag,
  SquareParking,
  Toilet,
  Truck,
  Users,
  Utensils,
  Wifi,
}

export async function BusinessAbout({
  about,
  amenities,
  source,
}: {
  about: string | null
  amenities: string[] | null
  source: { about: string | null; amenities: string | null }
}) {
  const t = await getTranslations("businesses.profile")
  const tAmenity = await getTranslations("businesses.amenities")

  const hasAbout = !!about && about.trim().length > 0
  // Keep only known slugs, in canonical order
  const shown = AMENITIES.filter((a) => (amenities ?? []).includes(a.slug))
  const hasAmenities = shown.length > 0

  if (!hasAbout && !hasAmenities) return null

  const googleSourced =
    (hasAbout && source.about === "google") ||
    (hasAmenities && source.amenities === "google")

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        {hasAbout && (
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {t("aboutTitle")}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {about}
            </p>
          </div>
        )}

        {hasAmenities && (
          <div className={hasAbout ? "mt-6 border-t pt-6" : ""}>
            <h3 className="mb-3 font-display text-base font-semibold tracking-tight">
              {t("amenitiesTitle")}
            </h3>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a) => {
                const Icon = ICONS[a.icon] ?? Info
                return (
                  <li key={a.slug} className="flex items-center gap-2 text-sm text-foreground">
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                    {tAmenity(a.slug)}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {googleSourced && (
          <p className="mt-5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Info className="h-3 w-3" />
            {t("aboutFromGoogle")}
          </p>
        )}
      </div>
    </section>
  )
}
