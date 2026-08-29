/**
 * Business categories live in the DB with English-only names ("Food & Drink").
 * Every surface that shows a category to a reader must go through this helper so
 * /es pages read "Comida y bebida" instead of the raw column. Keys mirror
 * `categories.slug` exactly (10 rows); an unknown slug falls back to the DB name.
 *
 * Server:  const t = await getTranslations({ locale, namespace: "categoryLabels" })
 * Client:  const t = useTranslations("categoryLabels")
 *          categoryLabel(t, slug, dbName)
 */
export const CATEGORY_SLUGS = [
  "auto",
  "dispensaries",
  "entertainment",
  "food-drink",
  "health-beauty",
  "other",
  "real-estate",
  "retail",
  "services",
  "wineries",
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

const KNOWN = new Set<string>(CATEGORY_SLUGS)

export function categoryLabel(
  t: (key: string) => string,
  slug: string | null | undefined,
  fallback?: string | null
): string {
  if (slug && KNOWN.has(slug)) return t(slug)
  return fallback ?? slug ?? ""
}
