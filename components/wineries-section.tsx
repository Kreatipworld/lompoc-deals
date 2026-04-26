import { Link } from "@/i18n/navigation"
import { Globe, MapPin, Phone, Wine } from "lucide-react"
import { getWineryBusinesses } from "@/lib/queries"
import { getTranslations } from "next-intl/server"

export async function WineriesSection() {
  const t = await getTranslations("wineriesSection")
  const wineries = await getWineryBusinesses()

  if (wineries.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12 text-center text-muted-foreground">
        <Wine className="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p>{t("noWineries")}</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {t("heading")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle", { count: wineries.length })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wineries.map((w) => (
          <Link
            key={w.id}
            href={`/biz/${w.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wine className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold leading-tight group-hover:text-primary">
                  {w.name}
                </h3>
                {w.address && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {w.address}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {w.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {w.description}
              </p>
            )}

            {/* Links */}
            <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
              {w.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {w.phone}
                </span>
              )}
              {w.website && (
                <span className="flex items-center gap-1 text-primary">
                  <Globe className="h-3 w-3" />
                  {t("visitWebsite")}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
