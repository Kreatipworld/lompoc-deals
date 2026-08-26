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
