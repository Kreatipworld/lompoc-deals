import type { Metadata } from "next"

/**
 * Canonical + hreflang alternates for a public page. Relative paths —
 * they resolve against metadataBase (AUTH_URL) in app/layout.tsx.
 * `path` must start with "/". The default locale (en) is unprefixed;
 * Spanish lives under /es (next-intl localePrefix: "as-needed").
 *
 * The canonical must be self-referential per locale: a Spanish page that
 * canonicalizes to the English URL tells Google to drop /es from the index
 * and poisons the hreflang cluster. Always pass the rendering locale.
 */
export function pageAlternates(
  path: string,
  locale: string = "en",
): NonNullable<Metadata["alternates"]> {
  const esPath = path === "/" ? "/es" : `/es${path}`
  return {
    canonical: locale === "es" ? esPath : path,
    languages: { en: path, es: esPath, "x-default": path },
    // Page-level alternates replace the root's, so feed discovery rides along here.
    types: { "application/rss+xml": "/api/blog/rss" },
  }
}

/** The layout appends " | Lompoc Locals" (15 chars) — titles should land ≤ 60 total. */
const BRAND_SUFFIX_LEN = " | Lompoc Locals".length
export const TITLE_MAX = 60

/**
 * Build a page title that fits: "<name> — <descriptor>" when the whole thing
 * (plus the brand suffix) stays under 60 chars, otherwise just the name,
 * trimmed at a word boundary. Names that already say "Lompoc" skip the
 * descriptor — "Rolling Tire — Auto Repair Lompoc CA — Lompoc, CA" helps nobody.
 */
export function seoTitle(name: string, descriptor?: string, opts: { absolute?: boolean; max?: number } = {}): string {
  const budget = (opts.max ?? TITLE_MAX) - (opts.absolute ? 0 : BRAND_SUFFIX_LEN)
  const clean = name.replace(/\s+/g, " ").trim()
  // A name that already says "Lompoc" drops the redundant town from the descriptor
  // ("Lompoc Museum — Things to Do", not "— Things to Do in Lompoc"), but keeps the
  // descriptor itself: it's what separates a /hotels page from the same hotel's /biz page.
  const desc = /lompoc/i.test(clean) && descriptor
    ? descriptor.replace(/\s*(?:in|en|de|—|-)?\s*Lompoc(?:,?\s*CA)?/i, "").replace(/\s+/g, " ").trim()
    : descriptor
  const withDesc = desc ? `${clean} — ${desc}` : clean
  if (withDesc.length <= budget) return withDesc
  if (clean.length <= budget) return clean
  return clean.slice(0, budget - 1).replace(/\s+\S*$/, "") + "…"
}

/**
 * Meta description sized for search: 70–155 chars, cut at a word boundary,
 * padded with a factual tail when the source text is a stub.
 */
export function seoDescription(text: string | null | undefined, tail: string, max = 155, min = 70): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim()
  let out = clean
  if (out.length < min) out = [out, tail].filter(Boolean).join(out && !/[.!?]$/.test(out) ? ". " : " ").trim()
  if (out.length > max) out = out.slice(0, max - 1).replace(/\s+\S*$/, "") + "…"
  return out
}
