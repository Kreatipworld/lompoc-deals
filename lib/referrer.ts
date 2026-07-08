export type ReferrerSource =
  | "Facebook"
  | "Instagram"
  | "Google"
  | "Twitter/X"
  | "Other search"
  | "Direct"
  | "Other"

/**
 * Map a raw referrer string to a coarse traffic-source bucket.
 *
 * Matches on the URL's hostname labels (not raw substrings), so query strings
 * like `?ref=x.com` and lookalike hosts like `notgoogle.evil.com` don't get
 * misbucketed.
 */
export function normalizeReferrer(raw: string | null | undefined): ReferrerSource {
  if (!raw) return "Direct"

  let host: string
  try {
    host = new URL(raw).hostname.toLowerCase()
  } catch {
    return "Other" // unparseable referrer
  }
  if (!host) return "Direct"

  if (host.includes("lompoc-deals") || host.includes("lompoclocals"))
    return "Direct" // same-origin navigation (legacy + current domain)

  const labels = host.split(".")
  const has = (label: string) => labels.includes(label)

  if (has("facebook") || has("fb")) return "Facebook"
  if (has("instagram")) return "Instagram"
  if (has("google")) return "Google"
  if (host === "t.co" || has("twitter") || host === "x.com" || host.endsWith(".x.com")) return "Twitter/X"
  if (has("bing") || has("duckduckgo") || has("yahoo")) return "Other search"
  return "Other"
}
