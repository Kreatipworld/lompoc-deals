import { Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { MapPin, Search } from "lucide-react"

/**
 * The not-found boundary for every localised route.
 *
 * Without a `not-found.tsx` *inside* the `[locale]` segment, `notFound()` resolved to the root
 * boundary outside the locale layout and the response went out as **200** — a soft 404. Unmatched
 * routes 404ed correctly, but every dynamic detail page that calls `notFound()` — /biz, /category,
 * /events — told search engines a deleted business was a live page. Found 2026-07-31 after
 * deleting a duplicate listing and noticing its URL still answered 200.
 *
 * Keep this file. Deleting it silently reintroduces soft 404s across the whole site.
 * Copy comes from the `siteMeta` namespace so a Spanish visitor gets a Spanish 404.
 */
export async function generateMetadata() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "siteMeta" })
  return { title: t("notFoundTitle"), robots: { index: false, follow: true } }
}

export default async function LocaleNotFound() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "siteMeta" })
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <MapPin className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{t("notFoundHeading")}</h1>
      <p className="mt-3 text-muted-foreground">{t("notFoundBody")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("notFoundHome")}
        </Link>
        <Link
          href="/businesses"
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Search className="h-4 w-4" />
          {t("notFoundBrowse")}
        </Link>
      </div>
    </div>
  )
}
