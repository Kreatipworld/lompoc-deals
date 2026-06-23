export type ReferrerSource =
  | "Facebook"
  | "Instagram"
  | "Google"
  | "Twitter/X"
  | "Other search"
  | "Direct"
  | "Other"

/** Map a raw referrer string to a coarse traffic-source bucket. */
export function normalizeReferrer(raw: string | null | undefined): ReferrerSource {
  if (!raw) return "Direct"
  const r = raw.toLowerCase()

  if (r.includes("lompoc-deals")) return "Direct" // same-origin navigation
  if (r.includes("facebook.com") || r.includes("fb.me") || r.includes("fb.com")) return "Facebook"
  if (r.includes("instagram.com")) return "Instagram"
  if (r.includes("google.")) return "Google"
  if (r.includes("t.co") || r.includes("twitter.com") || r.includes("x.com")) return "Twitter/X"
  if (r.includes("bing.") || r.includes("duckduckgo.") || r.includes("yahoo.")) return "Other search"
  return "Other"
}
