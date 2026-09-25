/**
 * Lompoc Sales — the rules of the marketplace, with no database in them.
 * docs/superpowers/specs/2026-09-25-sales-marketplace-design.md
 *
 * Everything here is pure so lib/sales.test.ts can assert the fence
 * (ZIP 93436/37/38), the photo/price rules, the pending cap, and the status
 * transitions without a connection string.
 */
import { extractZip, LOMPOC_ZIPS } from "@/lib/lompoc-zip"

export const SALE_KINDS = ["item", "garage-sale", "vehicle"] as const
export type SaleKind = (typeof SALE_KINDS)[number]

export const SALE_CATEGORIES = [
  "garage-sales",
  "vehicles",
  "furniture",
  "electronics",
  "tools",
  "baby-kids",
  "clothing",
  "home-garden",
  "sports-outdoors",
  "appliances",
  "free",
  "other",
] as const
export type SaleCategory = (typeof SALE_CATEGORIES)[number]

export const SALE_STATUSES = ["pending", "active", "sold", "expired", "hidden", "rejected"] as const
export type SaleStatus = (typeof SALE_STATUSES)[number]

export const PRICE_TYPES = ["fixed", "obo", "free"] as const
export type PriceType = (typeof PRICE_TYPES)[number]

export const CONDITIONS = ["new", "like-new", "good", "fair"] as const
export type Condition = (typeof CONDITIONS)[number]

export const MAX_SALE_PHOTOS = 8
export const MAX_PENDING_PER_USER = 5
export const MAX_MESSAGES_PER_LISTING_PER_EMAIL_PER_DAY = 5
export const LISTING_DAYS = 30
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 4000
export const AREA_MAX = 60

/** Which categories a kind may pick from. */
export function categoriesForKind(kind: SaleKind): readonly SaleCategory[] {
  if (kind === "garage-sale") return ["garage-sales"]
  if (kind === "vehicle") return ["vehicles"]
  return SALE_CATEGORIES.filter((c) => c !== "garage-sales" && c !== "vehicles")
}

export function isSaleCategory(s: string): s is SaleCategory {
  return (SALE_CATEGORIES as readonly string[]).includes(s)
}

/** Canned rejection reasons (spec §5). Free text is allowed on top. */
export const REJECT_REASONS = [
  "prohibited-weapons",
  "prohibited-animals",
  "prohibited-counterfeit",
  "prohibited-tickets",
  "prohibited-illegal",
  "not-local",
  "spam",
  "unclear",
  "other",
] as const
export type RejectReason = (typeof REJECT_REASONS)[number]

export type ListingInput = {
  kind: SaleKind
  category: string
  title: string
  description: string
  photos: string[]
  priceCents: number | null
  priceType: PriceType
  condition: Condition | null
  attrs: { year?: number; make?: string; model?: string; mileage?: number; transmission?: "automatic" | "manual" } | null
  address: string | null
  area: string | null
  startsAt: Date | null
  endsAt: Date | null
  contactPhone: string | null
  showPhone: boolean
}

/** Error codes map 1:1 to `sales.errors.*` in messages/*.json so the form can translate them. */
export type ValidationError =
  | "kind"
  | "category"
  | "titleShort"
  | "titleLong"
  | "titleLink"
  | "descriptionShort"
  | "descriptionLong"
  | "photosRequired"
  | "photosTooMany"
  | "priceRequired"
  | "priceInvalid"
  | "conditionRequired"
  | "vehicleAttrs"
  | "addressRequired"
  | "addressZip"
  | "areaRequired"
  | "datesRequired"
  | "datesOrder"
  | "phoneInvalid"

const URL_RE = /(https?:\/\/|www\.|\.com\b|\.net\b|\.org\b)/i

export function hasLink(s: string): boolean {
  return URL_RE.test(s)
}

/** True when the address's ZIP is one of ours — the only place a sale may be. */
export function inLompocZip(address: string | null | undefined): boolean {
  if (!address) return false
  const zip = extractZip(address)
  return zip !== null && LOMPOC_ZIPS.has(zip)
}

/**
 * Validate a listing before it touches the database. Returns every problem
 * found, so the form can show them all at once. Geocoding is the caller's job;
 * this checks the ZIP written in the address.
 */
export function validateListing(input: ListingInput): ValidationError[] {
  const errors: ValidationError[] = []
  if (!SALE_KINDS.includes(input.kind)) errors.push("kind")
  if (!isSaleCategory(input.category) || !categoriesForKind(input.kind).includes(input.category)) errors.push("category")

  const title = input.title.trim()
  if (title.length < 4) errors.push("titleShort")
  else if (title.length > TITLE_MAX) errors.push("titleLong")
  else if (hasLink(title)) errors.push("titleLink")

  const description = input.description.trim()
  if (description.length < 10) errors.push("descriptionShort")
  else if (description.length > DESCRIPTION_MAX) errors.push("descriptionLong")

  if (input.photos.length > MAX_SALE_PHOTOS) errors.push("photosTooMany")
  const isFree = input.priceType === "free" || input.category === "free"
  const photosOptional = isFree || input.kind === "garage-sale"
  if (!photosOptional && input.photos.length === 0) errors.push("photosRequired")

  if (input.kind === "garage-sale") {
    if (!input.address || !input.address.trim()) errors.push("addressRequired")
    else if (!inLompocZip(input.address)) errors.push("addressZip")
    if (!input.startsAt || !input.endsAt) errors.push("datesRequired")
    else if (input.endsAt.getTime() <= input.startsAt.getTime()) errors.push("datesOrder")
  } else {
    if (!input.area || !input.area.trim()) errors.push("areaRequired")
    if (isFree) {
      // Free is free: any price the form still carried is ignored, not an error.
    } else if (input.priceCents == null) errors.push("priceRequired")
    else if (!Number.isInteger(input.priceCents) || input.priceCents <= 0 || input.priceCents > 100_000_000) errors.push("priceInvalid")
    if (!input.condition || !CONDITIONS.includes(input.condition)) errors.push("conditionRequired")
  }

  if (input.kind === "vehicle") {
    const a = input.attrs
    const year = a?.year
    const yearOk = typeof year === "number" && year >= 1900 && year <= new Date().getFullYear() + 1
    const mileageOk = a?.mileage == null || (Number.isInteger(a.mileage) && a.mileage >= 0 && a.mileage < 2_000_000)
    if (!a || !yearOk || !a.make?.trim() || !a.model?.trim() || !mileageOk) errors.push("vehicleAttrs")
  }

  if (input.contactPhone && input.contactPhone.replace(/\D/g, "").length < 10) errors.push("phoneInvalid")

  return errors
}

/** The 5-pending cap (spec §3). */
export function canPostAnother(pendingCount: number): boolean {
  return pendingCount < MAX_PENDING_PER_USER
}

/** Relay rate limit: 5 messages per listing, per buyer email, per day (spec §5). */
export function canSendMessage(sentTodayForListingByEmail: number): boolean {
  return sentTodayForListingByEmail < MAX_MESSAGES_PER_LISTING_PER_EMAIL_PER_DAY
}

/**
 * When a listing stops being shown. Items and vehicles: 30 days from approval.
 * Garage sales: the end of the sale (the address is hidden once it is over).
 */
export function computeExpiresAt(kind: SaleKind, approvedAt: Date, endsAt: Date | null): Date {
  if (kind === "garage-sale" && endsAt) return endsAt
  return new Date(approvedAt.getTime() + LISTING_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Status machine. `admin` may do everything below; the seller (`owner`) only
 * marks sold / re-lists (phase 2 UI). The public never transitions anything.
 */
const TRANSITIONS: Record<SaleStatus, Partial<Record<SaleStatus, "admin" | "owner" | "system">>> = {
  pending: { active: "admin", rejected: "admin", hidden: "admin" },
  active: { sold: "owner", hidden: "admin", expired: "system" },
  sold: { active: "owner" },
  expired: { pending: "owner", hidden: "admin" },
  hidden: { active: "admin", rejected: "admin" },
  rejected: { pending: "owner" },
}

export type Actor = "admin" | "owner" | "system" | "public"

export function canTransition(from: SaleStatus, to: SaleStatus, actor: Actor): boolean {
  const who = TRANSITIONS[from]?.[to]
  if (!who) return false
  if (actor === "admin") return true
  return who === actor
}

/** Statuses the public may read. Everything else is a 404 for everyone but admin. */
export function isPubliclyVisible(status: SaleStatus): boolean {
  return status === "active" || status === "sold" || status === "expired"
}

/** Only an active listing takes messages; sold/expired render a banner instead. */
export function acceptsMessages(status: SaleStatus, expiresAt: Date, now = new Date()): boolean {
  return status === "active" && expiresAt.getTime() > now.getTime()
}

/** "$1,250" · "$1,250 OBO" · "FREE" — or null for a garage sale. */
export function formatSalePrice(
  l: { kind: SaleKind | string; priceCents: number | null; priceType: string; category: string },
  labels: { free: string; obo: string },
  intl = "en-US"
): string | null {
  if (l.kind === "garage-sale") return null
  if (l.priceType === "free" || l.category === "free" || l.priceCents == null) return labels.free
  const dollars = `$${(l.priceCents / 100).toLocaleString(intl, { maximumFractionDigits: 0 })}`
  return l.priceType === "obo" ? `${dollars} ${labels.obo}` : dollars
}

/**
 * Pacific wall-clock ("2026-10-03", "08:00") → the instant it names, DST-aware.
 * A garage sale at 8 AM in Lompoc is 15:00Z in summer and 16:00Z in winter.
 */
export function pacificToUtc(date: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!m || !tm) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const [h, mi] = [Number(tm[1]), Number(tm[2])]
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null
  // Guess with the UTC clock, then correct by the zone's offset at that instant.
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const offsetMin = pacificOffsetMinutes(new Date(guess))
  const first = new Date(guess - offsetMin * 60_000)
  // Re-check once in case the guess straddled a DST switch.
  const offset2 = pacificOffsetMinutes(first)
  return offset2 === offsetMin ? first : new Date(guess - offset2 * 60_000)
}

function pacificOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(at)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
  return Math.round((asUtc - at.getTime()) / 60_000)
}

/** First name for the public "Seller: Maria · member since 2026" line. */
export function sellerFirstName(name: string | null | undefined, fallback: string): string {
  const first = (name ?? "").trim().split(/\s+/)[0]
  return first ? first : fallback
}

/** Digits-only for tel:/sms: links. */
export function phoneHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "")
  return digits.startsWith("+") ? digits : `+1${digits.replace(/^1/, "")}`
}
