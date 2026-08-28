/**
 * The news desk's judgment, as pure functions: which leads are ours, how to
 * pull an article's text out of a page, and which real photo a story gets.
 * The cron route (app/api/cron/news-desk) does the I/O; this stays testable.
 */
import { NEWS_TOPICS, deriveTopic, type NewsTopic } from "@/lib/news-topics"

export type Lead = { id: number; title: string; summary: string | null; url: string; source: string }

const LOCAL = /\b(lompoc|vandenberg|vsfb|lompoc valley|cabrillo high|lompoc high|allan hancock|la purisima|jalama|mission hills|vandenberg village|surf beach)\b/i
const ELSEWHERE = /\b(santa maria|orcutt|santa ynez|solvang|buellton|los olivos|los alamos|goleta|carpinteria|isla vista|montecito|santa barbara(?! county)|dos pueblos|san marcos|pioneer valley|righetti|st\.? joseph|san luis obispo|paso robles|guadalupe|nipomo|arroyo grande)\b/i
const NOT_NEWS = /\b(recipe|obituar|pet of the week|horoscope|crossword|letters? to the editor|opinion|commentary|column)\b/i
// Columnist bylines ("Bill Macfadyen: …") are opinion, not reporting.
const BYLINE = /^[A-Z][a-z]+(?: [A-Z][a-z]+){1,2}:\s/
// The hub brings neighbors what's good and useful about Lompoc. Crime, crashes
// and court news have their outlets; they are not ours.
const TRAGEDY = /\b(killed|dies|died|dead|death|fatal|murder|homicide|stabbing|shooting|shot|crash|collision|arrest(?:ed)?|court hearing|sentenced|pleads|guilty|fraud|lawsuit|sues?|overdose|assault|robbery|burglary|dui|manhunt)\b/i

/** Lompoc/Vandenberg only — a story that only mentions us in passing is not ours. */
export function isLompocLead(lead: Pick<Lead, "title" | "summary">): boolean {
  const t = `${lead.title} ${lead.summary ?? ""}`
  if (NOT_NEWS.test(t)) return false
  if (BYLINE.test(lead.title)) return false
  if (TRAGEDY.test(lead.title)) return false
  if (!LOCAL.test(t)) return false
  // Another town in the headline means the story is theirs — even when our
  // course, our police, or our venue is the supporting detail.
  if (ELSEWHERE.test(lead.title)) return false
  return true
}

/** Pull the article body out of a news page: JSON-LD articleBody first, then paragraphs. */
export function extractArticleText(html: string): string {
  const ld = html.match(/"articleBody"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  let text = ""
  if (ld) {
    try { text = JSON.parse(`"${ld[1]}"`) } catch { text = ld[1] }
  }
  if (text.length < 400) {
    const ps = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi), (m) => m[1])
    text = ps.join(" ")
  }
  text = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&quot;/g, '"')
    .replace(/Please log in, or sign up[^.]*\./gi, "").replace(/Thank you for reading![^.]*\./gi, "").replace(/Please purchase a subscription[^.]*\./gi, "")
    .replace(/Your current subscription does not provide[^.]*\./gi, "").replace(/Sorry\s*,\s*(?:no promotional|an error)[^.]*\./gi, "").replace(/Promotional Rates were found[^.]*\./gi, "")
    .replace(/do not remove/gi, "")
    .replace(/\s+/g, " ").trim()
  return text
}

export type CoverPick = { url: string; credit: string | null }
type PoolEntry = CoverPick & { match?: RegExp }

/**
 * Real media only. Pools are our own mirrored photos, public-domain U.S. Space
 * Force imagery, and official emblems — never generated art. A `match` entry is
 * preferred when the story mentions its subject.
 */
export const COVER_POOLS: Record<string, PoolEntry[]> = {
  "vandenberg-space": [
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/vandenberg-sld30-emblem.jpg", credit: "Emblem: Space Launch Delta 30, U.S. Space Force." },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-vandenberg-launches-2.jpeg", credit: null, match: /launch|falcon|starlink|rocket|liftoff/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-vandenberg-launches-6.jpeg", credit: null, match: /launch|falcon|starlink|rocket|liftoff/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-vandenberg-launches-3.jpeg", credit: null, match: /launch|falcon|starlink|rocket|liftoff/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/vandenberg-interns-spaceport.jpg", credit: "Photo: U.S. Space Force / Airman 1st Class Ian Hawkes (public domain, via DVIDS).", match: /spaceport|intern|industry day|technology/i },
  ],
  "city-hall": [
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-city-fire-patch.jpg", credit: "Image: Lompoc City Fire Department.", match: /\bfire\b|firefighter|fire chief|fire department/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-civic-center.jpg", credit: null, match: /city council|city hall|council|mayor|ordinance|city manager/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-city-pines.jpg", credit: null },
  ],
  "schools-sports": [
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/cabrillo-high-field.jpg", credit: null, match: /cabrillo/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/huyck-stadium.jpg", credit: null, match: /football|lompoc high|braves|huyck|track|stadium/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/riverbend-park-soccer.jpg", credit: null, match: /soccer|ayso|youth sports|river ?bend/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lusd-logo-card.jpg", credit: "Logo: Lompoc Unified School District.", match: /school district|lusd|board of education|elementary|middle school|teachers?/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lusd-logo-card.jpg", credit: "Logo: Lompoc Unified School District." },
  ],
  community: [
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-valley-harris-grade.jpg", credit: null },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-city-pines.jpg", credit: null },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/riverbend-park-soccer.jpg", credit: null, match: /park|youth|kids|families|soccer/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-ocean-beach-county-park-3.jpeg", credit: null, match: /beach|coast|ocean|cleanup/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-ryon-park-3.jpeg", credit: null, match: /ryon|park/i },
  ],
  business: [
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-city-pines.jpg", credit: null },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-lompoc-theatre-4.jpeg", credit: null, match: /downtown|ocean ave|h street|storefront|theatre|theater/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-valley-harris-grade.jpg", credit: null },
  ],
  "food-events": [
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-lompoc-theatre-4.jpeg", credit: null, match: /theatre|theater|concert|show|music/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/activities/g-ryon-park-3.jpeg", credit: null, match: /park|festival|fair|market/i },
    { url: "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/news-covers/lompoc-city-pines.jpg", credit: null },
  ],
}

/**
 * Pick a cover: the subject's own media wins (a member's cover, or an official
 * image passed in), then a keyword-matched pool photo, then the pool in rotation —
 * skipping anything used by a recent story so the front page never repeats.
 */
export function chooseCover(opts: { topic: NewsTopic; title: string; text: string; subjectCover?: string | null; recentUrls?: string[]; seed?: number }): CoverPick {
  if (opts.subjectCover) return { url: opts.subjectCover, credit: null }
  const pool = COVER_POOLS[opts.topic.slug] ?? COVER_POOLS.community
  const hay = `${opts.title} ${opts.text.slice(0, 1200)}`
  const recent = new Set(opts.recentUrls ?? [])
  const matched = pool.filter((p) => p.match && p.match.test(hay) && !recent.has(p.url))
  if (matched.length) return { url: matched[0].url, credit: matched[0].credit }
  const generic = pool.filter((p) => !p.match && !recent.has(p.url))
  const candidates = generic.length ? generic : pool.filter((p) => !recent.has(p.url)).length ? pool.filter((p) => !recent.has(p.url)) : pool
  const i = Math.abs(opts.seed ?? opts.title.length) % candidates.length
  return { url: candidates[i].url, credit: candidates[i].credit }
}

export function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90)
}

export function topicFromSlug(slug: string): NewsTopic {
  return NEWS_TOPICS.find((t) => t.slug === slug) ?? deriveTopic([], "")
}
