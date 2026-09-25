import { and, count, desc, eq, gt, isNotNull, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { saleListings, saleMessages, users } from "@/db/schema"

export type SaleListingRow = typeof saleListings.$inferSelect

/** The card's data, JSON-safe so the ISR page can hand it to the client browser. */
export type SaleCardData = {
  id: number
  kind: SaleListingRow["kind"]
  category: string
  title: string
  description: string
  descriptionEs: string | null
  priceCents: number | null
  priceType: string
  condition: string | null
  photo: string | null
  area: string | null
  address: string | null
  startsAt: string | null
  endsAt: string | null
  postedAt: string
  status: SaleListingRow["status"]
}

export function toCard(l: SaleListingRow): SaleCardData {
  return {
    id: l.id,
    kind: l.kind,
    category: l.category,
    title: l.title,
    description: l.description,
    descriptionEs: l.descriptionEs,
    priceCents: l.priceCents,
    priceType: l.priceType,
    condition: l.condition,
    photo: l.photos?.[0] ?? null,
    area: l.area,
    // A garage-sale address is public only while the sale is on (spec §5).
    address: l.kind === "garage-sale" && l.status === "active" ? l.address : null,
    startsAt: l.startsAt?.toISOString() ?? null,
    endsAt: l.endsAt?.toISOString() ?? null,
    postedAt: (l.approvedAt ?? l.createdAt).toISOString(),
    status: l.status,
  }
}

/** Live listings, newest approval first. One category or all. Capped — the browser filters client-side. */
export async function getActiveSaleListings(category?: string, limit = 240): Promise<SaleCardData[]> {
  const where = category
    ? and(eq(saleListings.status, "active"), gt(saleListings.expiresAt, sql`now()`), eq(saleListings.category, category))
    : and(eq(saleListings.status, "active"), gt(saleListings.expiresAt, sql`now()`))
  const rows = await db.select().from(saleListings).where(where).orderBy(desc(saleListings.approvedAt), desc(saleListings.id)).limit(limit)
  return rows.map(toCard)
}

export type SaleListingDetail = SaleListingRow & {
  seller: { firstName: string | null; memberSince: Date; email: string; locale: string }
}

export async function getSaleListingById(id: number): Promise<SaleListingDetail | null> {
  const [row] = await db
    .select({ listing: saleListings, sellerName: users.name, sellerSince: users.createdAt, sellerEmail: users.email, sellerLocale: users.locale })
    .from(saleListings)
    .innerJoin(users, eq(users.id, saleListings.userId))
    .where(eq(saleListings.id, id))
    .limit(1)
  if (!row) return null
  return {
    ...row.listing,
    seller: { firstName: row.sellerName, memberSince: row.sellerSince, email: row.sellerEmail, locale: row.sellerLocale },
  }
}

export async function countPendingForUser(userId: number): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(saleListings)
    .where(and(eq(saleListings.userId, userId), eq(saleListings.status, "pending")))
  return Number(r?.n ?? 0)
}

/** Messages this buyer sent this listing in the last 24 h — the relay rate limit. */
export async function countMessagesToday(listingId: number, email: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(saleMessages)
    .where(and(eq(saleMessages.listingId, listingId), eq(saleMessages.email, email), gt(saleMessages.createdAt, sql`now() - interval '1 day'`)))
  return Number(r?.n ?? 0)
}

// ── admin ──────────────────────────────────────────────────────────────────

export type AdminSaleListing = SaleListingRow & {
  poster: { id: number; name: string | null; email: string; createdAt: Date; salesBlockedAt: Date | null; priorListings: number }
}

async function withPoster(rows: { listing: SaleListingRow; posterId: number; name: string | null; email: string; createdAt: Date; salesBlockedAt: Date | null }[]): Promise<AdminSaleListing[]> {
  const ids = Array.from(new Set(rows.map((r) => r.posterId)))
  const priors = ids.length
    ? await db
        .select({ userId: saleListings.userId, n: count() })
        .from(saleListings)
        .where(sql`${saleListings.userId} in ${ids} and ${saleListings.status} <> 'pending'`)
        .groupBy(saleListings.userId)
    : []
  const priorBy = new Map(priors.map((p) => [p.userId, Number(p.n)]))
  return rows.map((r) => ({
    ...r.listing,
    poster: { id: r.posterId, name: r.name, email: r.email, createdAt: r.createdAt, salesBlockedAt: r.salesBlockedAt, priorListings: priorBy.get(r.posterId) ?? 0 },
  }))
}

const posterSelect = {
  listing: saleListings,
  posterId: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  salesBlockedAt: users.salesBlockedAt,
}

export async function getPendingSaleListings(): Promise<AdminSaleListing[]> {
  const rows = await db.select(posterSelect).from(saleListings).innerJoin(users, eq(users.id, saleListings.userId)).where(eq(saleListings.status, "pending")).orderBy(saleListings.createdAt)
  return withPoster(rows)
}

export async function getRecentSaleListings(limit = 60): Promise<AdminSaleListing[]> {
  const rows = await db
    .select(posterSelect)
    .from(saleListings)
    .innerJoin(users, eq(users.id, saleListings.userId))
    .where(sql`${saleListings.status} <> 'pending'`)
    .orderBy(desc(saleListings.updatedAt))
    .limit(limit)
  return withPoster(rows)
}

export async function getBlockedSellers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email, salesBlockedAt: users.salesBlockedAt })
    .from(users)
    .where(isNotNull(users.salesBlockedAt))
    .orderBy(desc(users.salesBlockedAt))
}

export async function countPendingSaleListings(): Promise<number> {
  const [r] = await db.select({ n: count() }).from(saleListings).where(eq(saleListings.status, "pending"))
  return Number(r?.n ?? 0)
}
