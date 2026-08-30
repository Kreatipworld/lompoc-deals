/**
 * Content lives in English in the DB with an `_es` twin per text column
 * (businesses.description_es, deals.title_es, events.description_es, blog_posts.content_es …).
 * The twin is filled by /api/cron/translate-content and nulled whenever the English source
 * changes, so "no twin yet" is a normal state — every reader falls back to English.
 *
 *   const description = pick(locale, row.description, row.descriptionEs)
 */
export type Locale = "en" | "es" | string

export function pick<T extends string | null | undefined>(locale: Locale, en: T, es: string | null | undefined): T | string {
  if (locale === "es" && es && es.trim()) return es
  return en
}

/** Convenience for mapping a whole row: `localizeFields(locale, row, ["title", "description"])`. */
export function localizeFields<R extends Record<string, unknown>>(locale: Locale, row: R, fields: string[]): R {
  if (locale !== "es") return row
  const out: Record<string, unknown> = { ...row }
  for (const f of fields) {
    const es = row[`${f}Es`]
    if (typeof es === "string" && es.trim()) out[f] = es
  }
  return out as R
}
