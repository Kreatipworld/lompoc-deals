import { MapPin, Clock } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { SafeImage } from "@/components/safe-image"
import { DAY_KEYS, DAY_LABELS, formatHoursLine, isOpenNow, parseHours } from "@/lib/hours"

/**
 * A miniature of the listing the owner is about to claim.
 *
 * Someone arriving here came from an email they did not ask for, on a phone, and their first
 * question is not "how do I sign up" — it is "who made a page about my business, and is this
 * real?" A form with a text badge saying "Claiming X" answers neither, and looks like every
 * phishing page ever built.
 *
 * So the page leads with their own storefront. Recognition does what reassuring copy cannot: they
 * see their cover photo, their address, and whether the shop reads as open right now, and the
 * suspicion drops before they have read a word. The live dot is the point — the page exists
 * already, without them, which is exactly the thing that makes claiming it feel worth doing.
 *
 * Everything here is already public on the listing, so nothing is revealed to whoever opens the
 * link that they could not see by visiting the page itself.
 */
export async function ClaimPreview({
  name,
  category,
  address,
  coverUrl,
  logoUrl,
  hoursJson,
}: {
  name: string
  category?: string | null
  address?: string | null
  coverUrl?: string | null
  logoUrl?: string | null
  hoursJson?: unknown
}) {
  const t = await getTranslations("auth.signupLanding")
  const hours = hoursJson ? parseHours(hoursJson) : null
  const openNow = hours ? isOpenNow(hours) : false
  // Today's line, so the card says something true right now rather than a week of times.
  const todayIdx = (new Date().getDay() + 6) % 7
  const todayKey = DAY_KEYS[todayIdx]
  const todayLine = hours ? formatHoursLine(hours[todayKey]) : ""

  // On a closed day the honest line is when they open next, not "Closed · Sat Closed" — which
  // states the same fact twice and tells a customer nothing they can act on.
  let nextOpen: string | null = null
  if (hours && !todayLine.match(/\d/)) {
    for (let i = 1; i <= 7; i++) {
      const key = DAY_KEYS[(todayIdx + i) % 7]
      const line = formatHoursLine(hours[key])
      if (line.match(/\d/)) {
        nextOpen = `${DAY_LABELS[key]} ${line}`
        break
      }
    }
  }
  const hoursDetail = todayLine.match(/\d/)
    ? `${DAY_LABELS[todayKey]} ${todayLine}`
    : nextOpen
      ? t("previewOpens", { when: nextOpen })
      : null
  // Street only — the full postal address on a card this size wraps to three lines and reads as a
  // form field rather than as a place.
  const street = address?.split(",")[0]?.trim() ?? null

  return (
    <figure className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative h-28 w-full bg-gradient-to-br from-primary/25 via-primary/10 to-accent sm:h-32">
        {coverUrl && (
          <SafeImage
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            fallback={null}
          />
        )}
        {/* Sits over the seam so the card reads as one object rather than a photo above a box. */}
        {logoUrl && (
          <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-xl border-2 border-card bg-card shadow-md">
            <SafeImage
              src={logoUrl}
              alt=""
              className="h-full w-full object-contain"
              fallback={null}
            />
          </div>
        )}
      </div>

      <figcaption className={`p-4 ${logoUrl ? "pt-8" : "pt-4"}`}>
        <p className="font-display text-lg font-semibold leading-tight tracking-tight">{name}</p>

        <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
          {(category || street) && (
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              <span>
                {category}
                {category && street ? " · " : ""}
                {street}
              </span>
            </p>
          )}
          {hoursDetail && (
            <p className="flex items-start gap-1.5">
              <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              <span>
                <span className={openNow ? "font-medium text-[#0B992F]" : "font-medium"}>
                  {openNow ? t("previewOpenNow") : t("previewClosed")}
                </span>
                {" · "}
                {hoursDetail}
              </span>
            </p>
          )}
        </div>

        <p className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs font-medium text-muted-foreground">
          {/* The one animated thing on the page, and it earns it: the page is live at this moment. */}
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0B992F] opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0B992F]" />
          </span>
          {t("previewLive")}
        </p>
      </figcaption>
    </figure>
  )
}
