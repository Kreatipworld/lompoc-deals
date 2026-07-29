// Placeholder owner accounts created by our own tooling (scraper, seed scripts,
// demo data). A business owned by one of these has no real owner yet, so it
// should surface the "Claim this business" flow. Real claimants own their
// listing under a real email, and manually-onboarded members use their own
// managed accounts — neither should be treated as unclaimed.
//
// Keep this list in sync with the owner emails used by:
//   - db/scrape-google-places.ts  → scraper@lompocdeals.system
//   - db/seed*.{ts,mjs}           → seedowner@lompocdeals.internal, owner@lompocdeals.test
//   - lib/zillow-sync.ts          → system@lompocdeals.test
const PLACEHOLDER_OWNER_EMAILS = new Set([
  "system@lompocdeals.test",
  "scraper@lompocdeals.system",
  "seedowner@lompocdeals.internal",
  "owner@lompocdeals.test",
  "demo-deals@lompoc-locals.local",
])

/**
 * True when a business has no real owner yet and should show the claim CTA.
 * Treats a missing owner email and any known placeholder account as unclaimed.
 */
export function isUnclaimedBusiness(ownerEmail: string | null | undefined): boolean {
  if (!ownerEmail) return true
  return PLACEHOLDER_OWNER_EMAILS.has(ownerEmail.toLowerCase())
}
