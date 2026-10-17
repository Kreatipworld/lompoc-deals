import { parseHours, formatHoursLine, DAY_KEYS, type Hours } from "@/lib/hours"
import type { FaqItem } from "@/components/faq-section"

/**
 * Search pieces for /biz pages (Oct 17 2026 SEO batch): which words the title may
 * promise, and the Q&A block. Everything here is derived from fields the page
 * already renders, so the title and answers can never claim what isn't there.
 */

export type BizSeoInput = {
  name: string
  address: string | null
  phone: string | null
  hoursJson: unknown
  photoCount: number
  activeDealTitles: string[]
}

export type BizSeoLabels = {
  // title words
  hours: string
  deals: string
  photos: string
  directions: string
  // FAQ copy (ICU-free: plain {name}/{x} replacement)
  qHours: string
  qWhere: string
  aWhere: string
  qPhone: string
  aPhone: string
  qDeals: string
  aDeals: string
  days: Record<keyof Hours, string>
  closed: string
}

/**
 * Deals we never advertise in search (titles, descriptions, Q&A): alcohol specials.
 * Standing rule since Oct 7 2026 — the deal still shows on the business's own page.
 */
const ALCOHOL_DEAL = /happy\s*hour|\bbeers?\b|\bwines?\b|cocktail|margarita|mimosa|sangria|tequila|vodka|whiske?y|\bbrews?\b|\bpints?\b|liquor|\bbar\s+special|\bdrinks?\b|bottomless/i

export function isAlcoholDeal(title: string): boolean {
  return ALCOHOL_DEAL.test(title)
}

export function hasKnownHours(hoursJson: unknown): boolean {
  const h = parseHours(hoursJson)
  return DAY_KEYS.some((k) => h[k] !== null)
}

/** The words a /biz title may promise, best first. */
export function bizTitleParts(b: BizSeoInput, l: BizSeoLabels): string[] {
  const parts: string[] = []
  if (hasKnownHours(b.hoursJson)) parts.push(l.hours)
  if (b.activeDealTitles.length > 0) parts.push(l.deals)
  if (b.photoCount >= 3) parts.push(l.photos)
  if (parts.length < 2 && b.address) parts.push(l.directions)
  return parts
}

/** "Mon–Fri: 9:00 AM – 5:00 PM; Sat: 10:00 AM – 2:00 PM; Sun: Closed" */
export function hoursSummary(hoursJson: unknown, days: Record<keyof Hours, string>, closed: string): string {
  const h = parseHours(hoursJson)
  const groups: { from: (typeof DAY_KEYS)[number]; to: (typeof DAY_KEYS)[number]; line: string }[] = []
  for (const k of DAY_KEYS) {
    const line = formatHoursLine(h[k], closed)
    const last = groups[groups.length - 1]
    if (last && last.line === line) last.to = k
    else groups.push({ from: k, to: k, line })
  }
  return groups.map((g) => `${g.from === g.to ? days[g.from] : `${days[g.from]}–${days[g.to]}`}: ${g.line}`).join("; ")
}

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "")

export function bizFaq(b: BizSeoInput, l: BizSeoLabels): FaqItem[] {
  const items: FaqItem[] = []
  const v = { name: b.name }
  if (hasKnownHours(b.hoursJson)) items.push({ q: fill(l.qHours, v), a: hoursSummary(b.hoursJson, l.days, l.closed) })
  if (b.address) items.push({ q: fill(l.qWhere, v), a: fill(l.aWhere, { ...v, address: b.address }) })
  if (b.phone) items.push({ q: fill(l.qPhone, v), a: fill(l.aPhone, { ...v, phone: b.phone }) })
  if (b.activeDealTitles.length > 0) {
    items.push({
      q: fill(l.qDeals, v),
      a: fill(l.aDeals, { ...v, count: String(b.activeDealTitles.length), deals: b.activeDealTitles.slice(0, 3).join("; ") }),
    })
  }
  return items
}

/** Category → the curated guide page that should link from every business in it. */
export const CATEGORY_GUIDE: Record<string, string> = {
  "food-drink": "restaurants",
  auto: "auto-repair",
  retail: "shopping",
}
