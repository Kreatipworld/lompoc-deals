"use server"

import { randomBytes } from "crypto"
import { z } from "zod"
import { and, eq, gt, isNull } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { emailVerificationTokens, saleListings, saleMessages, users } from "@/db/schema"
import { geocodeAddress } from "@/lib/geocode"
import { notifyPlatform } from "@/lib/email"
import { sendSaleMessageRelayEmail, sendSalesVerifyEmail } from "@/lib/sales-email"
import {
  acceptsMessages,
  canPostAnother,
  canSendMessage,
  CONDITIONS,
  MAX_SALE_PHOTOS,
  pacificToUtc,
  PRICE_TYPES,
  SALE_KINDS,
  validateListing,
  type Condition,
  type ListingInput,
  type PriceType,
  type SaleKind,
  type ValidationError,
} from "@/lib/sales"
import { countMessagesToday, countPendingForUser } from "@/lib/sales-queries"

/**
 * Error codes, not sentences: the client translates them (`sales.errors.*`).
 * `signIn` / `verifyEmail` / `blocked` / `pendingCap` are the gates from spec §5.
 */
export type PostState =
  | { ok: true; id: number }
  | { ok: false; errors: (ValidationError | "signIn" | "verifyEmail" | "blocked" | "pendingCap" | "geocode" | "server")[] }
  | undefined

const str = (fd: FormData, k: string, max = 5000) => (fd.get(k)?.toString() ?? "").trim().slice(0, max)
const numOrNull = (s: string) => (s === "" ? null : Number.isFinite(Number(s)) ? Number(s) : NaN)

function parsePhotos(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || "[]")
    if (!Array.isArray(arr)) return []
    // Only our own Blob store — never a link to someone else's image.
    return arr.filter((u): u is string => typeof u === "string" && /^https:\/\/[^/]*\.public\.blob\.vercel-storage\.com\//.test(u)).slice(0, MAX_SALE_PHOTOS)
  } catch {
    return []
  }
}

function readListing(fd: FormData): ListingInput {
  const kindRaw = str(fd, "kind", 20)
  const kind = (SALE_KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as SaleKind) : "item"
  const priceTypeRaw = str(fd, "priceType", 8)
  const priceType = (PRICE_TYPES as readonly string[]).includes(priceTypeRaw) ? (priceTypeRaw as PriceType) : "fixed"
  const conditionRaw = str(fd, "condition", 12)
  const condition = (CONDITIONS as readonly string[]).includes(conditionRaw) ? (conditionRaw as Condition) : null
  const dollars = numOrNull(str(fd, "price", 12).replace(/[$,\s]/g, ""))
  const priceCents = dollars == null ? null : Number.isNaN(dollars) ? NaN : Math.round(dollars * 100)

  const date = str(fd, "date", 10)
  const endDate = str(fd, "endDate", 10) || date
  const startTime = str(fd, "startTime", 5) || "08:00"
  const endTime = str(fd, "endTime", 5) || "14:00"
  const startsAt = kind === "garage-sale" && date ? pacificToUtc(date, startTime) : null
  const endsAt = kind === "garage-sale" && endDate ? pacificToUtc(endDate, endTime) : null

  const year = numOrNull(str(fd, "year", 4))
  const mileage = numOrNull(str(fd, "mileage", 9).replace(/[,\s]/g, ""))
  const transmissionRaw = str(fd, "transmission", 10)
  const attrs =
    kind === "vehicle"
      ? {
          year: year == null || Number.isNaN(year) ? undefined : year,
          make: str(fd, "make", 40) || undefined,
          model: str(fd, "model", 40) || undefined,
          mileage: mileage == null || Number.isNaN(mileage) ? undefined : mileage,
          transmission: (transmissionRaw === "automatic" || transmissionRaw === "manual" ? transmissionRaw : undefined) as "automatic" | "manual" | undefined,
        }
      : null

  return {
    kind,
    category: str(fd, "category", 32),
    title: str(fd, "title", 200),
    description: str(fd, "description", 6000),
    photos: parsePhotos(str(fd, "photos", 20000)),
    priceCents: priceType === "free" ? null : priceCents,
    priceType,
    condition,
    attrs,
    address: kind === "garage-sale" ? str(fd, "address", 300) || null : null,
    area: kind === "garage-sale" ? null : str(fd, "area", 60) || null,
    startsAt,
    endsAt,
    contactPhone: str(fd, "contactPhone", 30) || null,
    showPhone: fd.get("showPhone") === "on" || fd.get("showPhone") === "true",
  }
}

/**
 * Post a listing → `pending`. Gates, in order: signed in · not blocked · email
 * verified · under the pending cap · valid · (garage sale) geocodes inside town.
 */
export async function createSaleListing(_prev: PostState, formData: FormData): Promise<PostState> {
  const session = await auth()
  if (!session?.user) return { ok: false, errors: ["signIn"] }
  const userId = parseInt(session.user.id, 10)
  if (formData.get("website")) return { ok: true, id: 0 } // honeypot: pretend

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, name: true, emailVerified: true, salesBlockedAt: true, role: true },
  })
  if (!user) return { ok: false, errors: ["signIn"] }
  if (user.salesBlockedAt) return { ok: false, errors: ["blocked"] }
  if (!user.emailVerified && user.role !== "admin") return { ok: false, errors: ["verifyEmail"] }
  if (!canPostAnother(await countPendingForUser(userId))) return { ok: false, errors: ["pendingCap"] }

  const input = readListing(formData)
  const errors = validateListing(input)
  if (errors.length) return { ok: false, errors }

  let lat: number | null = null
  let lng: number | null = null
  if (input.kind === "garage-sale" && input.address) {
    const geo = await geocodeAddress(`${input.address}`)
    if (geo) {
      lat = geo.lat
      lng = geo.lng
    }
    // No geocode is not fatal — the ZIP fence already held; the admin sees "no pin" and can decide.
  }

  try {
    const [row] = await db
      .insert(saleListings)
      .values({
        userId,
        kind: input.kind,
        category: input.category,
        title: input.title.trim(),
        description: input.description.trim(),
        priceCents: input.priceType === "free" ? null : input.priceCents,
        priceType: input.category === "free" ? "free" : input.priceType,
        condition: input.kind === "garage-sale" ? null : input.condition,
        attrs: input.attrs,
        photos: input.photos,
        address: input.address,
        area: input.area,
        lat,
        lng,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        contactPhone: input.contactPhone,
        showPhone: input.showPhone && !!input.contactPhone,
        status: "pending",
        // Placeholder until approval computes the real one (NOT NULL column).
        expiresAt: input.endsAt ?? new Date(Date.now() + 30 * 86_400_000),
      })
      .returning({ id: saleListings.id })

    const price = input.priceType === "free" ? "FREE" : input.priceCents != null ? `$${(input.priceCents / 100).toFixed(0)}${input.priceType === "obo" ? " OBO" : ""}` : "—"
    void notifyPlatform("🛒 New sale listing to review", [
      `${input.kind} · ${input.category} · ${price}`,
      input.title.trim(),
      `by ${user.name ?? "(no name)"} <${user.email}>`,
      input.kind === "garage-sale" ? `${input.address} · ${input.startsAt?.toISOString() ?? ""}` : `Area: ${input.area}`,
      `${input.photos.length} photo(s)`,
      `Review: ${process.env.AUTH_URL ?? ""}/admin/sales`,
    ])
    return { ok: true, id: row.id }
  } catch (err) {
    console.error("[sales] create failed:", err)
    return { ok: false, errors: ["server"] }
  }
}

// ── email verification (one-click) ─────────────────────────────────────────

export type VerifyState = { sent?: true; error?: "signIn" | "alreadyVerified" | "tooSoon" | "server" } | undefined

/** Emails the signed-in user a 24-hour one-click link. One link per 2 minutes. */
export async function requestSalesEmailVerification(): Promise<VerifyState> {
  const session = await auth()
  if (!session?.user) return { error: "signIn" }
  const userId = parseInt(session.user.id, 10)
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true, email: true, emailVerified: true, locale: true } })
  if (!user) return { error: "signIn" }
  if (user.emailVerified) return { error: "alreadyVerified" }

  const recent = await db.query.emailVerificationTokens.findFirst({
    where: and(eq(emailVerificationTokens.userId, userId), gt(emailVerificationTokens.createdAt, new Date(Date.now() - 2 * 60_000)), isNull(emailVerificationTokens.usedAt)),
    columns: { id: true },
  })
  if (recent) return { error: "tooSoon" }

  const token = randomBytes(24).toString("hex")
  try {
    await db.insert(emailVerificationTokens).values({ userId, token, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) })
    await sendSalesVerifyEmail(user.email, { token, locale: user.locale })
    return { sent: true }
  } catch (err) {
    console.error("[sales] verify email failed:", err)
    return { error: "server" }
  }
}

// ── buyer → seller relay ───────────────────────────────────────────────────

export type MessageState = { success?: true; error?: "invalid" | "email" | "unavailable" | "rateLimit" | "server" } | undefined

const messageSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().min(5).max(2000),
  sourcePath: z.string().trim().max(300).optional(),
  website: z.string().max(0).optional(), // honeypot
})

/**
 * Relay a buyer's message to the seller by email (reply-to = buyer). The
 * seller's address never reaches the browser; hello@ is not copied.
 * Limit: 5 per listing per buyer email per day.
 */
export async function sendSaleMessage(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = messageSchema.safeParse({ ...raw, phone: raw.phone || undefined, sourcePath: raw.sourcePath || undefined })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.path[0] === "email" ? "email" : "invalid" }
  }
  const d = parsed.data
  if (d.website) return { success: true }
  const email = d.email.toLowerCase()

  const [row] = await db
    .select({ listing: saleListings, sellerEmail: users.email, sellerLocale: users.locale })
    .from(saleListings)
    .innerJoin(users, eq(users.id, saleListings.userId))
    .where(eq(saleListings.id, d.listingId))
    .limit(1)
  if (!row || !acceptsMessages(row.listing.status, row.listing.expiresAt)) return { error: "unavailable" }
  if (!canSendMessage(await countMessagesToday(row.listing.id, email))) return { error: "rateLimit" }

  try {
    const [msg] = await db
      .insert(saleMessages)
      .values({ listingId: row.listing.id, name: d.name, email, phone: d.phone ?? null, message: d.message, sourcePath: d.sourcePath ?? null })
      .returning({ id: saleMessages.id })
    const id = await sendSaleMessageRelayEmail(row.sellerEmail, {
      listing: { id: row.listing.id, title: row.listing.title },
      buyer: { name: d.name, email, phone: d.phone, message: d.message },
      locale: row.sellerLocale,
    })
    if (id && msg) await db.update(saleMessages).set({ emailedAt: new Date() }).where(eq(saleMessages.id, msg.id))
    return { success: true }
  } catch (err) {
    console.error("[sales] message relay failed:", err)
    return { error: "server" }
  }
}
