import type { Metadata } from "next"

/**
 * Absolute origin for every generated URL (sitemap, og:url, JSON-LD).
 * AUTH_URL is the canonical domain (https://www.lompoclocals.com) in production.
 */
export const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

/** Absolute URL for the Spanish twin of an English path ("" or "/" → "/es"). */
export function esUrl(path: string): string {
  const p = path === "/" ? "" : path
  return `${siteUrl}/es${p}`
}

/**
 * Canonical + hreflang alternates for a public page. Relative paths —
 * they resolve against metadataBase (AUTH_URL) in app/layout.tsx.
 * `path` must start with "/". The default locale (en) is unprefixed;
 * Spanish lives under /es (next-intl localePrefix: "as-needed").
 *
 * The canonical must be self-referential per locale: a Spanish page that
 * canonicalizes to the English URL tells Google to drop /es from the index
 * and poisons the hreflang cluster. Always pass the rendering locale.
 *
 * Options:
 *   esPath — override the Spanish alternate. Use it for content that exists
 *   only in English (blog posts, news stories): pass the English `path` itself
 *   so `hreflang="es"` points at the English URL instead of advertising an
 *   /es twin that just renders the same English body. When esPath equals
 *   path, the canonical is the English URL for BOTH locales (there is no
 *   distinct Spanish document to self-reference).
 *     pageAlternates(`/news/${slug}`, locale, { esPath: `/news/${slug}` })
 */
export function pageAlternates(
  path: string,
  locale: string = "en",
  opts: { esPath?: string } = {},
): NonNullable<Metadata["alternates"]> {
  const esPath = opts.esPath ?? (path === "/" ? "/es" : `/es${path}`)
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
 * Click-earning title for a business page (Oct 17 2026: page-1 /biz results drew
 * 0.4% CTR because the title was just the name — Google already shows the
 * business's own site for that). The title names what our page has that a bare
 * name doesn't: "Hangar 7 Social House, Lompoc: Hours, Deals & Photos".
 *
 * `parts` must only list things the page really shows (the caller decides).
 * Absolute title — the brand suffix rides along only when it still fits in 60.
 * Falls back by dropping parts from the end, then to "<name> · Lompoc", then the name.
 */
export function bizSeoTitle(name: string, parts: string[], locale: string = "en"): string {
  const clean = name.replace(/\s+/g, " ").trim()
  const and = locale === "es" ? " y " : " & "
  const lead = /lompoc/i.test(clean) ? clean : `${clean}, Lompoc`
  const join = (p: string[]) => (p.length <= 1 ? p.join("") : `${p.slice(0, -1).join(", ")}${and}${p[p.length - 1]}`)
  const withBrand = (s: string) => (s.length + BRAND_SUFFIX_LEN <= TITLE_MAX ? `${s} | Lompoc Locals` : s)
  for (let n = parts.length; n > 0; n--) {
    const candidate = `${lead}: ${join(parts.slice(0, n))}`
    if (candidate.length <= TITLE_MAX) return withBrand(candidate)
  }
  if (lead.length <= TITLE_MAX) return withBrand(lead)
  return seoTitle(clean, undefined, { absolute: true })
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
