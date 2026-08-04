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

/** Business names, folded — used by both matching and the fuzzy fallback. */
export const normalizedName = normalizedCol(businesses.name)
