import type { Metadata } from "next"

/**
 * Canonical + hreflang alternates for a public page. Relative paths —
 * they resolve against metadataBase (AUTH_URL) in app/layout.tsx.
 * `path` must start with "/". The default locale (en) is unprefixed;
 * Spanish lives under /es (next-intl localePrefix: "as-needed").
 */
export function pageAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const esPath = path === "/" ? "/es" : `/es${path}`
  return {
    canonical: path,
    languages: { en: path, es: esPath, "x-default": path },
  }
}
