import { and, desc, eq, gt, ilike, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, businesses, categories, favorites } from "@/db/schema"

export type DealCardData = {
  id: number
  type: "coupon" | "special" | "announcement"
  title: string
  description: string | null
  imageUrl: string | null
  discountText: string | null
  expiresAt: Date
  business: {
    id: number
    name: string
    slug: string
    logoUrl: string | null
    categoryName: string | null
    categorySlug: string | null
  }
}

const baseDealSelect = {
  id: deals.id,
  type: deals.type,
  title: deals.title,
  description: deals.description,
  imageUrl: deals.imageUrl,
  discountText: deals.discountText,
  expiresAt: deals.expiresAt,
  bizId: businesses.id,
  bizName: businesses.name,
  bizSlug: businesses.slug,
  bizLogoUrl: businesses.logoUrl,
  catName: categories.name,
  catSlug: categories.slug,
}

type DealRow = {
  id: number
  type: "coupon" | "special" | "announcement"
  title: string
  description: string | null
  imageUrl: string | null
  discountText: string | null
  expiresAt: Date
  bizId: number
  bizName: string
  bizSlug: string
  bizLogoUrl: string | null
  catName: string | null
  catSlug: string | null
}

function rowToCard(r: DealRow): DealCardData {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    imageUrl: r.imageUrl,
    discountText: r.discountText,
    expiresAt: r.expiresAt,
    business: {
      id: r.bizId,
      name: r.bizName,
      slug: r.bizSlug,
      logoUrl: r.bizLogoUrl,
      categoryName: r.catName,
      categorySlug: r.catSlug,
    },
  }
}

const activeAndApproved = and(
  gt(deals.expiresAt, sql`now()`),
  eq(businesses.status, "approved")
)

export async function getActiveDeals(limit = 50): Promise<DealCardData[]> {
  const rows = await db
    .select(baseDealSelect)
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(activeAndApproved)
    .orderBy(desc(deals.createdAt))
    .limit(limit)
  return rows.map(rowToCard)
}

export async function getDealsByCategorySlug(
  slug: string,
  limit = 50
): Promise<DealCardData[]> {
  const rows = await db
    .select(baseDealSelect)
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(activeAndApproved, eq(categories.slug, slug)))
    .orderBy(desc(deals.createdAt))
    .limit(limit)
  return rows.map(rowToCard)
}

export async function searchDeals(
  q: string,
  limit = 50
): Promise<DealCardData[]> {
  const term = `%${q}%`
  const rows = await db
    .select(baseDealSelect)
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(
      and(
        activeAndApproved,
        or(
          ilike(deals.title, term),
          ilike(deals.description, term),
          ilike(businesses.name, term)
        )
      )
    )
    .orderBy(desc(deals.createdAt))
    .limit(limit)
  return rows.map(rowToCard)
}

export type DirectoryBusiness = {
  id: number
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  website: string | null
  logoUrl: string | null
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
  activeDealCount: number
}

export async function getDirectoryBusinesses(): Promise<DirectoryBusiness[]> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      address: businesses.address,
      phone: businesses.phone,
      website: businesses.website,
      logoUrl: businesses.logoUrl,
      categoryId: businesses.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      activeDealCount: sql<number>`count(${deals.id}) filter (where ${deals.expiresAt} > now())::int`,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .leftJoin(deals, eq(deals.businessId, businesses.id))
    .where(eq(businesses.status, "approved"))
    .groupBy(businesses.id, categories.id)
    .orderBy(businesses.name)
  return rows
}

export type MapBusiness = {
  id: number
  name: string
  slug: string
  lat: number
  lng: number
  activeDealCount: number
}

export async function getMapBusinesses(): Promise<MapBusiness[]> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      lat: businesses.lat,
      lng: businesses.lng,
      activeDealCount: sql<number>`count(${deals.id}) filter (where ${deals.expiresAt} > now())::int`,
    })
    .from(businesses)
    .leftJoin(deals, eq(deals.businessId, businesses.id))
    .where(
      and(
        eq(businesses.status, "approved"),
        sql`${businesses.lat} is not null and ${businesses.lng} is not null`
      )
    )
    .groupBy(businesses.id)

  return rows
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      lat: r.lat as number,
      lng: r.lng as number,
      activeDealCount: r.activeDealCount,
    }))
}

export async function getAllCategories() {
  return db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  })
}

export async function getSiteStats() {
  const [bizRow, dealRow, catRow] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(businesses)
      .where(eq(businesses.status, "approved")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(deals)
      .innerJoin(businesses, eq(deals.businessId, businesses.id))
      .where(activeAndApproved),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(categories),
  ])
  return {
    businesses: bizRow[0]?.n ?? 0,
    activeDeals: dealRow[0]?.n ?? 0,
    categories: catRow[0]?.n ?? 0,
  }
}

export async function getFavoritedDeals(
  userId: number
): Promise<DealCardData[]> {
  const rows = await db
    .select(baseDealSelect)
    .from(favorites)
    .innerJoin(deals, eq(favorites.dealId, deals.id))
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(eq(favorites.userId, userId), activeAndApproved))
    .orderBy(desc(deals.createdAt))
  return rows.map(rowToCard)
}

export async function getBusinessBySlug(slug: string) {
  const biz = await db.query.businesses.findFirst({
    where: (b, { and: a, eq: e }) =>
      a(e(b.slug, slug), e(b.status, "approved")),
  })
  if (!biz) return null

  let category: { name: string; slug: string } | null = null
  if (biz.categoryId) {
    const c = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, biz.categoryId!),
    })
    if (c) category = { name: c.name, slug: c.slug }
  }

  const bizDeals = await db
    .select(baseDealSelect)
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(eq(businesses.id, biz.id), gt(deals.expiresAt, sql`now()`)))
    .orderBy(desc(deals.createdAt))

  return {
    business: { ...biz, category },
    deals: bizDeals.map(rowToCard),
  }
}
