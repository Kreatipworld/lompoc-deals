import { redirect } from "next/navigation"

// Legacy URL — the partner marketing page now lives at /partners. The real
// redirect is handled at the routing layer by next.config.mjs's redirects()
// (a page-level redirect() here proved unreliable once next-intl's
// middleware rewrites the unprefixed/`/es/` URLs internally — it never fired
// for those paths). This page-level redirect stays as a defensive fallback.
export default function ForBusinessesPage() {
  redirect("/partners")
}
