"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Compass } from "lucide-react"
import { categoryLabel, CATEGORY_SLUGS } from "@/lib/category-label"
import { SearchBar } from "@/components/search-bar"
import { ReportBug } from "@/components/report-bug"

/**
 * A missing category is a guessable URL, not a typo in a permalink: people
 * reach /category/<word> by hand (the owner hit /category/partners on Sep 21
 * 2026, and retired slugs like /category/dispensaries are still in old posts).
 * Dead-ending them on the generic 404 throws away a visitor who told us exactly
 * what they were looking for, so this boundary names the ten real categories.
 *
 * It still answers **404** — notFound() sets the status, this only replaces the
 * body. scripts/check-production.mjs asserts /category/bogus-xyz → 404; keep it
 * that way or Google indexes every invented slug.
 */
export default function CategoryNotFound() {
  // Client component (Oct 17 2026): the server version read the locale from request
  // headers, which made every unknown slug a 500 once /category became ISR. The ten
  // slugs are a constant; labels come from the layout's NextIntlClientProvider.
  const t = useTranslations("siteMeta")
  const tLabels = useTranslations("categoryLabels")
  const tCat = useTranslations("category")
  const cats = CATEGORY_SLUGS.map((slug) => ({ slug, name: slug }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
      <Compass className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {t("categoryNotFoundHeading")}
      </h1>
      <p className="mt-3 text-muted-foreground">{t("categoryNotFoundBody")}</p>

      <div className="mx-auto mt-6 max-w-md">
        <SearchBar />
      </div>

      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/category/${c.slug}`}
              className="inline-flex items-center rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
            >
              {categoryLabel(tLabels, c.slug, c.name)}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/businesses"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {tCat("allBusinesses")}
        </Link>
        <Link
          href="/members"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t("categoryNotFoundMembers")}
        </Link>
      </div>

      <div className="mt-6">
        <ReportBug source="not_found" />
      </div>
    </div>
  )
}
