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

// ─────────────────────────────────────────────────────────────────────────────
// Member-facing "where people found you" buckets.
//
// `normalizeReferrer` above folds every same-origin navigation into "Direct",
// which hides the most useful signal an owner can get: that people reach their
// page from the Food & Drink category, the homepage, the directory, or search.
// This classifier keeps those, and reads the UTM tags the tracker already
// stores (props.src / props.med) so campaign traffic lands in the right bucket.

export type SourceKey =
  | "homepage"
  | "category"
  | "directory"
  | "search"
  | "deals"
  | "events"
  | "news"
  | "map"
  | "site_other"
  | "email"
  | "facebook"
  | "instagram"
  | "google"
  | "other_search"
  | "direct"
  | "other"

export const SOURCE_KEYS: readonly SourceKey[] = [
  "homepage", "category", "directory", "search", "deals", "events", "news", "map", "site_other",
  "email", "facebook", "instagram", "google", "other_search", "direct", "other",
]

const OWN_HOSTS = ["lompoclocals", "lompoc-deals"]

function isOwnHost(host: string): boolean {
  return OWN_HOSTS.some((h) => host.includes(h))
}

function sitePathBucket(pathname: string): SourceKey {
  // strip locale prefix: /en/..., /es/...
  const parts = pathname.split("/").filter(Boolean)
  if (parts[0] === "en" || parts[0] === "es") parts.shift()
  const first = parts[0] ?? ""
  if (first === "") return "homepage"
  switch (first) {
    case "category": return "category"
    case "businesses": return "directory"
    case "search": return "search"
    case "deals": case "feed": return "deals"
    case "events": return "events"
    case "news": return "news"
    case "map": return "map"
    default: return "site_other"
  }
}

function utmBucket(src: string | null | undefined): SourceKey | null {
  if (!src) return null
  const s = src.toLowerCase()
  if (s === "fb" || s === "facebook") return "facebook"
  if (s === "ig" || s === "instagram") return "instagram"
  if (s === "email" || s === "digest" || s === "newsletter") return "email"
  if (s === "google") return "google"
  return null
}

export function classifySource(input: {
  referrer: string | null | undefined
  utmSrc?: string | null
  utmMed?: string | null
}): SourceKey {
  const fromUtm = utmBucket(input.utmSrc)
  if (fromUtm) return fromUtm

  const raw = input.referrer
  if (!raw) return "direct"
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return "other"
  }
  const host = url.hostname.toLowerCase()
  if (!host) return "direct"
  if (isOwnHost(host)) return sitePathBucket(url.pathname)

  switch (normalizeReferrer(raw)) {
    case "Facebook": return "facebook"
    case "Instagram": return "instagram"
    case "Google": return "google"
    case "Twitter/X": return "other"
    case "Other search": return "other_search"
    case "Direct": return "direct"
    default: return "other"
  }
}
