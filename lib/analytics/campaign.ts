/**
 * Campaign attribution — how a visitor got here.
 *
 * The problem this solves: analytics_events already records what people do on the site, but every
 * visitor arrived anonymous, so "which post caused this claim?" was unanswerable. That is a bad
 * position to be in the week you start paying for reach.
 *
 * How it works, in three parts:
 *   1. Middleware sees ?utm_source=... on any request and writes a `lompoc_camp` cookie.
 *   2. track() reads that cookie and folds it into the props of EVERY event, so all sixteen
 *      existing event types become attributable without touching one call site.
 *   3. Queries group by props->>'src' / 'cmp' to join a post to the claims it produced.
 *
 * FIRST TOUCH WINS. The cookie is only written when absent, so the post that introduced someone to
 * Lompoc Locals keeps the credit even if they later arrive from a search or a different post. Last
 * touch would hand every conversion to whatever they clicked most recently, which flatters the
 * bottom of the funnel and hides what actually works.
 *
 * Keys are short (src/med/cmp/con) because this rides along in the props of every row.
 */

export const CAMPAIGN_COOKIE = "lompoc_camp"
/** 90 days: long enough to credit a slow decision, short enough that stale campaigns age out. */
export const CAMPAIGN_MAX_AGE = 60 * 60 * 24 * 90

export interface Campaign {
  src?: string
  med?: string
  cmp?: string
  con?: string
  /** ISO date of first touch, so a campaign's window can be reconstructed later. */
  at?: string
}

/** Values land in a JSONB column and in a cookie — keep them short and free of separators. */
const clean = (v: string | null): string | undefined => {
  if (!v) return undefined
  const s = v.trim().slice(0, 64).replace(/[^\w.\-]/g, "")
  return s.length ? s.toLowerCase() : undefined
}

/**
 * Pull campaign params out of a URL. Returns null when there is nothing to record, so callers can
 * skip writing a cookie on ordinary traffic.
 *
 * `gclid`/`fbclid` count as a source on their own: ad platforms append them automatically, and a
 * click that carries one is unambiguously paid even when the utm tags got lost in a redirect.
 */
export function campaignFromParams(params: URLSearchParams, now = new Date()): Campaign | null {
  const src =
    clean(params.get("utm_source")) ??
    (params.get("gclid") ? "google" : params.get("fbclid") ? "facebook" : undefined)
  const med = clean(params.get("utm_medium"))
  const cmp = clean(params.get("utm_campaign"))
  const con = clean(params.get("utm_content"))
  if (!src && !cmp) return null
  return { src, med, cmp, con, at: now.toISOString().slice(0, 10) }
}

export function encodeCampaign(c: Campaign): string {
  return encodeURIComponent(JSON.stringify(c))
}

/** Never throws: a malformed cookie must not take a page down or lose an event. */
export function decodeCampaign(raw: string | undefined | null): Campaign | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const c = parsed as Campaign
    if (!c.src && !c.cmp) return null
    return c
  } catch {
    return null
  }
}

/**
 * Tag an outbound link so the traffic it sends is attributable.
 *
 * Used by the social renderers and the digest so every published URL carries its origin. Existing
 * query strings are preserved, and an absolute URL stays absolute.
 */
export function tagUrl(
  url: string,
  { source, medium = "social", campaign, content }: {
    source: string
    medium?: string
    campaign: string
    content?: string
  }
): string {
  const hasProtocol = /^https?:\/\//i.test(url)
  const u = new URL(hasProtocol ? url : `https://${url.replace(/^\/+/, "")}`)
  u.searchParams.set("utm_source", source)
  u.searchParams.set("utm_medium", medium)
  u.searchParams.set("utm_campaign", campaign)
  if (content) u.searchParams.set("utm_content", content)
  return hasProtocol ? u.toString() : u.toString().replace(/^https:\/\//, "")
}
