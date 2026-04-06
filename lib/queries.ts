import { and, desc, eq, gt, ilike, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, businesses, categories } from "@/db/schema"

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

function rowToCard(r: typeof baseDealSelect extends infer _ ? any : never): DealCardData {
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

export async function getAllCategories() {
  return db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  })
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
