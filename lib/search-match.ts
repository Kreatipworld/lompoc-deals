import { sql, type AnyColumn, type SQL } from "drizzle-orm"
import { businesses } from "@/db/schema"

/**
 * How this platform compares what a person typed to what we stored.
 *
 * A leaf module on purpose: `lib/search.ts` and `lib/queries.ts` already import each other, and
 * every query in the app needs these, so they live somewhere neither has to reach through.
 *
 * ── The bug this exists to prevent ────────────────────────────────────────────────────────────
 * Eye on I, a wood-fired pizzeria, never appeared in a search for "pizza". Four residents searched
 * "js glass" and got an empty box, because the business is "J's Glass Co" and ILIKE cares about an
 * apostrophe nobody types. Both had been broken for as long as the feature existed, and both were
 * found by a person noticing — not by us.
 *
 * Two rules came out of it:
 *
 *   1. Never compare raw user input to a stored string. 145 of 472 business names here carry
 *      punctuation. Use `looseLike`, not `ilike`.
 *   2. A directory must find a business by what it DOES, not only by what it is called. Match the
 *      description as well as the name, everywhere — the plumber called Terrones and the jeweler
 *      called Vargas have the same problem Eye on I did.
 */

/** Fold a string to letters, digits and single spaces — the form both sides get compared in. */
export const normalizeForSearch = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()

/** The same folding, applied to a column inside SQL. */
export const normalizedCol = (col: AnyColumn | SQL) =>
  sql`regexp_replace(lower(coalesce(${col}, '')), '[^a-z0-9 ]', '', 'g')`

/**
 * Punctuation-insensitive LIKE. Use this anywhere user input meets a stored string.
 * `coalesce` matters: a null column must not drop the row from an OR of conditions.
 */
export const looseLike = (col: AnyColumn | SQL, q: string) =>
  sql`${normalizedCol(col)} like ${`%${normalizeForSearch(q)}%`}`

/**
 * The query plus its naive singular ("tacos" → "taco"). A searcher typing the
 * plural means the same thing as the singular, but substring matching doesn't:
 * "tacos" never appears inside "Mr. Taco", so every taquería *named* Taco
 * ranked below description matches. Words of 3 letters or fewer keep their s
 * ("gas" is not the plural of "ga"). Applied to both matching and ranking so
 * the two can never disagree about what counts as a name hit.
 */
export const queryVariants = (q: string): string[] => {
  const norm = normalizeForSearch(q)
  const singular = norm
    .split(" ")
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .join(" ")
  return singular !== norm ? [norm, singular] : [norm]
}

/** Business names, folded — used by both matching and the fuzzy fallback. */
export const normalizedName = normalizedCol(businesses.name)

/**
 * Drop rows that only matched because they name a *different* business.
 *
 * Big Jayke's is an Asian-fusion noodle shop. It surfaced for "pizza" because its story says the
 * founder started out "while working at Mi Amore Pizza and Pasta" — a competitor's name, not
 * something they sell. Told that they serve pizza, a resident drives over and finds yakisoba.
 *
 * The set of offending names is already in hand: any row whose own name matches the query is, by
 * definition, a business whose name contains the term. Blank those names out of the other rows'
 * text and re-check. A row survives only if the term still appears in words about itself.
 *
 * Rows matching on name or description are never touched — this only judges about-text evidence,
 * which is where borrowed names live.
 */
export function dropCompetitorMentions<
  T extends { name: string; description?: string | null; about?: string | null },
>(rows: T[], q: string): T[] {
  const term = normalizeForSearch(q)
  if (!term) return rows
  const nameMatches = rows.map((r) => normalizeForSearch(r.name)).filter((n) => n.includes(term))
  if (nameMatches.length === 0) return rows

  return rows.filter((r) => {
    const name = normalizeForSearch(r.name)
    if (name.includes(term)) return true
    if (normalizeForSearch(r.description ?? "").includes(term)) return true
    let about = normalizeForSearch(r.about ?? "")
    if (!about.includes(term)) return true // matched on something else entirely; not ours to judge
    for (const other of nameMatches) about = about.split(other).join(" ")
    return about.includes(term)
  })
}
