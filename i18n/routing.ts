import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  // English-only mode: no /en or /es prefix on URLs.
  // Spanish translations stay in messages/es.json but are unreachable.
  localePrefix: "as-needed",
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]
