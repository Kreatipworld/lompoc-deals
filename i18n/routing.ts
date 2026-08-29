import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  // English (default) is unprefixed: /deals. Spanish lives under /es: /es/deals.
  // Legacy /en/* URLs are redirected to the unprefixed form by the intl middleware.
  localePrefix: "as-needed",
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]
