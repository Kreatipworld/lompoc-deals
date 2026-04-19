import { and, desc, eq, gt, gte, ilike, inArray, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { deals, businesses, categories, favorites, propertyListings, events, dealEvents, activities, blogPosts } from "@/db/schema"

export type DealCardData = {
  id: number
  type: "coupon" | "special" | "announcement"
  title: string
  description: string | null
  imageUrl: string | null
  discountText: string | null
  terms: string | null
  expiresAt: Date
  business: {
    id: number
    name: string
    slug: string
    logoUrl: string | null
    coverUrl: string | null
    categoryName: string | null
    categorySlug: string | null
    address: string | null
    phone: string | null
  }
}

const baseDealSelect = {
  id: deals.id,
  type: deals.type,
  title: deals.title,
  description: deals.description,
  imageUrl: deals.imageUrl,
  discountText: deals.discountText,
  terms: deals.terms,
  expiresAt: deals.expiresAt,
  bizId: businesses.id,
  bizName: businesses.name,
  bizSlug: businesses.slug,
  bizLogoUrl: businesses.logoUrl,
  bizCoverUrl: businesses.coverUrl,
  bizAddress: businesses.address,
  bizPhone: businesses.phone,
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
  terms: string | null
  expiresAt: Date
  bizId: number
  bizName: string
  bizSlug: string
  bizLogoUrl: string | null
  bizCoverUrl: string | null
  bizAddress: string | null
  bizPhone: string | null
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
    terms: r.terms,
    expiresAt: r.expiresAt,
    business: {
      id: r.bizId,
      name: r.bizName,
      slug: r.bizSlug,
      logoUrl: r.bizLogoUrl,
      coverUrl: r.bizCoverUrl,
      categoryName: r.catName,
      categorySlug: r.catSlug,
      address: r.bizAddress,
      phone: r.bizPhone,
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

export async function getFeaturedDeals(limit = 6): Promise<DealCardData[]> {
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

export async function getBusinessesByCategorySlug(categorySlug: string): Promise<DirectoryBusiness[]> {
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
    .where(and(eq(businesses.status, "approved"), eq(categories.slug, categorySlug)))
    .groupBy(businesses.id, categories.id)
    .orderBy(businesses.name)
  return rows
}

export async function getFeaturedBusinesses(limit = 6): Promise<DirectoryBusiness[]> {
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
    .orderBy(sql`count(${deals.id}) filter (where ${deals.expiresAt} > now()) desc`, businesses.name)
    .limit(limit)
  return rows
}

export type PropertyListing = {
  id: number
  type: "for-sale" | "for-rent"
  title: string
  description: string | null
  priceCents: number
  beds: number | null
  baths: number | null
  sqft: number | null
  address: string | null
  imageUrl: string | null
  business: { id: number; name: string; slug: string }
}

export async function getListingsByBusinessId(
  businessId: number
): Promise<PropertyListing[]> {
  const rows = await db
    .select({
      id: propertyListings.id,
      type: propertyListings.type,
      title: propertyListings.title,
      description: propertyListings.description,
      priceCents: propertyListings.priceCents,
      beds: propertyListings.beds,
      baths: propertyListings.baths,
      sqft: propertyListings.sqft,
      address: propertyListings.address,
      imageUrl: propertyListings.imageUrl,
      bizId: businesses.id,
      bizName: businesses.name,
      bizSlug: businesses.slug,
    })
    .from(propertyListings)
    .innerJoin(businesses, eq(propertyListings.businessId, businesses.id))
    .where(
      and(
        eq(propertyListings.businessId, businessId),
        eq(propertyListings.status, "active")
      )
    )
    .orderBy(desc(propertyListings.createdAt))
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    priceCents: r.priceCents,
    beds: r.beds,
    baths: r.baths,
    sqft: r.sqft,
    address: r.address,
    imageUrl: r.imageUrl,
    business: { id: r.bizId, name: r.bizName, slug: r.bizSlug },
  }))
}

export async function getAllRealEstateListings(
  type?: "for-sale" | "for-rent"
): Promise<PropertyListing[]> {
  const conditions = [
    eq(propertyListings.status, "active"),
    eq(categories.slug, "real-estate"),
    eq(businesses.status, "approved"),
  ]
  if (type) conditions.push(eq(propertyListings.type, type))

  const rows = await db
    .select({
      id: propertyListings.id,
      type: propertyListings.type,
      title: propertyListings.title,
      description: propertyListings.description,
      priceCents: propertyListings.priceCents,
      beds: propertyListings.beds,
      baths: propertyListings.baths,
      sqft: propertyListings.sqft,
      address: propertyListings.address,
      imageUrl: propertyListings.imageUrl,
      bizId: businesses.id,
      bizName: businesses.name,
      bizSlug: businesses.slug,
    })
    .from(propertyListings)
    .innerJoin(businesses, eq(propertyListings.businessId, businesses.id))
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(propertyListings.createdAt))
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    priceCents: r.priceCents,
    beds: r.beds,
    baths: r.baths,
    sqft: r.sqft,
    address: r.address,
    imageUrl: r.imageUrl,
    business: { id: r.bizId, name: r.bizName, slug: r.bizSlug },
  }))
}

export async function getListingById(id: number) {
  const rows = await db
    .select({
      listing: propertyListings,
      bizId: businesses.id,
      bizName: businesses.name,
      bizSlug: businesses.slug,
      bizPhone: businesses.phone,
      bizWebsite: businesses.website,
    })
    .from(propertyListings)
    .innerJoin(businesses, eq(propertyListings.businessId, businesses.id))
    .where(eq(propertyListings.id, id))
    .limit(1)
  if (!rows.length) return null
  const r = rows[0]
  return {
    ...r.listing,
    business: {
      id: r.bizId,
      name: r.bizName,
      slug: r.bizSlug,
      phone: r.bizPhone,
      website: r.bizWebsite,
    },
  }
}

export type MapBusiness = {
  id: number
  name: string
  slug: string
  lat: number
  lng: number
  activeDealCount: number
  categoryName: string | null
  categorySlug: string | null
  hoursJson: unknown
  address: string | null
}

export async function getMapBusinesses(): Promise<MapBusiness[]> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      lat: businesses.lat,
      lng: businesses.lng,
      address: businesses.address,
      hoursJson: businesses.hoursJson,
      categoryName: categories.name,
      categorySlug: categories.slug,
      activeDealCount: sql<number>`count(${deals.id}) filter (where ${deals.expiresAt} > now())::int`,
    })
    .from(businesses)
    .leftJoin(deals, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(
      and(
        eq(businesses.status, "approved"),
        sql`${businesses.lat} is not null and ${businesses.lng} is not null`
      )
    )
    .groupBy(businesses.id, categories.id)

  return rows
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      lat: r.lat as number,
      lng: r.lng as number,
      address: r.address,
      hoursJson: r.hoursJson,
      categoryName: r.categoryName,
      categorySlug: r.categorySlug,
      activeDealCount: r.activeDealCount,
    }))
}

export async function getAllCategories() {
  // Only return categories that have at least one approved business
  const rows = await db
    .selectDistinct({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
    })
    .from(categories)
    .innerJoin(businesses, and(eq(businesses.categoryId, categories.id), eq(businesses.status, "approved")))
    .orderBy(categories.name)
  return rows
}

export type CategoryWithDeals = {
  id: number
  name: string
  slug: string
  icon: string | null
  deals: DealCardData[]
}

export async function getDealsGroupedByCategory(
  perCategory = 6
): Promise<CategoryWithDeals[]> {
  const cats = await getAllCategories()
  const results = await Promise.all(
    cats.map(async (cat) => {
      const catDeals = await getDealsByCategorySlug(cat.slug, perCategory)
      return { ...cat, deals: catDeals }
    })
  )
  // Only return categories that have at least one active deal
  return results.filter((c) => c.deals.length > 0)
}

export type WineryBusiness = {
  id: number
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  website: string | null
  logoUrl: string | null
}

export async function getWineryBusinesses(): Promise<WineryBusiness[]> {
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
    })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(eq(businesses.status, "approved"), eq(categories.slug, "wineries")))
    .orderBy(businesses.name)
  return rows
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
      .select({ n: sql<number>`count(distinct ${categories.id})::int` })
      .from(categories)
      .innerJoin(businesses, and(eq(businesses.categoryId, categories.id), eq(businesses.status, "approved"))),
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

  // Fetch owner email so we can detect the system placeholder for the claim CTA
  let ownerEmail: string | null = null
  const ownerRow = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.id, biz.ownerUserId),
    columns: { email: true },
  })
  if (ownerRow) ownerEmail = ownerRow.email

  const bizDeals = await db
    .select(baseDealSelect)
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(eq(businesses.id, biz.id), gt(deals.expiresAt, sql`now()`)))
    .orderBy(desc(deals.createdAt))

  return {
    business: { ...biz, category, ownerEmail },
    deals: bizDeals.map(rowToCard),
  }
}

// ─── User dashboard ──────────────────────────────────────────────────────────

export type UserCouponData = {
  dealId: number
  dealTitle: string
  dealType: "coupon" | "special" | "announcement"
  discountText: string | null
  imageUrl: string | null
  expiresAt: Date
  claimedAt: Date
  businessName: string
  businessSlug: string
  isExpired: boolean
}

export type UserRedemptionData = {
  dealId: number
  dealTitle: string
  discountText: string | null
  redeemedAt: Date
  businessName: string
  businessSlug: string
}

export async function getUserClaimedCoupons(userId: number): Promise<UserCouponData[]> {
  const rows = await db
    .select({
      dealId: deals.id,
      dealTitle: deals.title,
      dealType: deals.type,
      discountText: deals.discountText,
      imageUrl: deals.imageUrl,
      expiresAt: deals.expiresAt,
      claimedAt: dealEvents.createdAt,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(dealEvents)
    .innerJoin(deals, eq(dealEvents.dealId, deals.id))
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .where(and(eq(dealEvents.userId, userId), eq(dealEvents.eventType, "claim")))
    .orderBy(desc(dealEvents.createdAt))

  const now = new Date()
  return rows.map((r) => ({ ...r, isExpired: r.expiresAt < now }))
}

export async function getUserRedemptions(userId: number): Promise<UserRedemptionData[]> {
  const rows = await db
    .select({
      dealId: deals.id,
      dealTitle: deals.title,
      discountText: deals.discountText,
      redeemedAt: dealEvents.createdAt,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(dealEvents)
    .innerJoin(deals, eq(dealEvents.dealId, deals.id))
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .where(and(eq(dealEvents.userId, userId), eq(dealEvents.eventType, "redeem")))
    .orderBy(desc(dealEvents.createdAt))

  return rows
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventCardData = {
  id: number
  title: string
  description: string | null
  location: string | null
  imageUrl: string | null
  category: string
  startsAt: Date
  endsAt: Date | null
  business: { id: number; name: string; slug: string } | null
}

export async function getUpcomingEvents(
  category?: string,
  limit = 8
): Promise<EventCardData[]> {
  const now = sql`now()`

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      imageUrl: events.imageUrl,
      category: events.category,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      bizId: businesses.id,
      bizName: businesses.name,
      bizSlug: businesses.slug,
    })
    .from(events)
    .leftJoin(businesses, eq(events.businessId, businesses.id))
    .where(
      and(
        eq(events.status, "approved"),
        gte(events.startsAt, now),
        category
          ? eq(events.category, category as typeof events.category._.data)
          : undefined
      )
    )
    .orderBy(events.startsAt)
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    location: r.location,
    imageUrl: r.imageUrl,
    category: r.category,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    business:
      r.bizId && r.bizName && r.bizSlug
        ? { id: r.bizId, name: r.bizName, slug: r.bizSlug }
        : null,
  }))
}

// ─── Activities ───────────────────────────────────────────────────────────────

export type ActivityData = {
  id: number
  title: string
  slug: string
  category: string
  description: string | null
  address: string | null
  lat: number | null
  lng: number | null
  imageUrl: string | null
  tips: string | null
  seasonality: string | null
  sourceUrl: string | null
  featured: boolean
}

export async function getActivities(category?: string, limit = 50): Promise<ActivityData[]> {
  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      category: activities.category,
      description: activities.description,
      address: activities.address,
      lat: activities.lat,
      lng: activities.lng,
      imageUrl: activities.imageUrl,
      tips: activities.tips,
      seasonality: activities.seasonality,
      sourceUrl: activities.sourceUrl,
      featured: activities.featured,
    })
    .from(activities)
    .where(category ? eq(activities.category, category) : undefined)
    .orderBy(desc(activities.featured), activities.title)
    .limit(limit)
  return rows
}

export async function getFeaturedActivities(limit = 6): Promise<ActivityData[]> {
  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      category: activities.category,
      description: activities.description,
      address: activities.address,
      lat: activities.lat,
      lng: activities.lng,
      imageUrl: activities.imageUrl,
      tips: activities.tips,
      seasonality: activities.seasonality,
      sourceUrl: activities.sourceUrl,
      featured: activities.featured,
    })
    .from(activities)
    .where(eq(activities.featured, true))
    .orderBy(activities.title)
    .limit(limit)
  return rows
}

export async function getActivityBySlug(slug: string): Promise<ActivityData | null> {
  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      category: activities.category,
      description: activities.description,
      address: activities.address,
      lat: activities.lat,
      lng: activities.lng,
      imageUrl: activities.imageUrl,
      tips: activities.tips,
      seasonality: activities.seasonality,
      sourceUrl: activities.sourceUrl,
      featured: activities.featured,
    })
    .from(activities)
    .where(eq(activities.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function getActivityCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: activities.category })
    .from(activities)
    .orderBy(activities.category)
  return rows.map((r) => r.category)
}

export type MapActivity = {
  id: number
  title: string
  slug: string
  lat: number
  lng: number
  category: string
}

export async function getMapActivities(): Promise<MapActivity[]> {
  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      lat: activities.lat,
      lng: activities.lng,
      category: activities.category,
    })
    .from(activities)
    .where(sql`${activities.lat} is not null and ${activities.lng} is not null`)
  return rows
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      lat: r.lat as number,
      lng: r.lng as number,
      category: r.category,
    }))
}

// ---------- blog ----------

export type BlogPostCard = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  imageUrl: string | null
  category: string | null
  tags: string[] | null
  authorName: string | null
  publishedAt: Date | null
}

export type BlogPostFull = BlogPostCard & {
  content: string
  metaDescription: string | null
  updatedAt: Date
}

export async function getPublishedBlogPosts(
  limit = 20,
  offset = 0,
  category?: string
): Promise<BlogPostCard[]> {
  const conditions = [eq(blogPosts.status, "published")]
  if (category) conditions.push(eq(blogPosts.category, category))

  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      imageUrl: blogPosts.imageUrl,
      category: blogPosts.category,
      tags: blogPosts.tags,
      authorName: blogPosts.authorName,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset)

  return rows as BlogPostCard[]
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1)

  if (!rows[0]) return null
  const r = rows[0]
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    imageUrl: r.imageUrl,
    category: r.category,
    tags: r.tags as string[] | null,
    authorName: r.authorName,
    publishedAt: r.publishedAt,
    metaDescription: r.metaDescription,
    updatedAt: r.updatedAt,
  }
}

export async function getBlogCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: blogPosts.category })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), sql`${blogPosts.category} is not null`))
    .orderBy(blogPosts.category)
  return rows.map((r) => r.category).filter(Boolean) as string[]
}

export async function countPublishedBlogPosts(category?: string): Promise<number> {
  const conditions = [eq(blogPosts.status, "published")]
  if (category) conditions.push(eq(blogPosts.category, category))
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(and(...conditions))
  return Number(rows[0]?.count ?? 0)
}

export async function getRecentBlogPosts(limit = 3): Promise<BlogPostCard[]> {
  return getPublishedBlogPosts(limit, 0)
}

// ---------- blog ↔ business recommendations ----------

export type BlogBusinessCard = {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  categoryName: string | null
  categorySlug: string | null
  activeDealCount: number
}

/**
 * Maps a blog post category to related business category slugs,
 * then returns up to `limit` approved businesses in those categories.
 */
const BLOG_CATEGORY_TO_BUSINESS_SLUGS: Record<string, string[]> = {
  "food-dining": ["restaurants", "food-drink", "bars", "coffee"],
  "wine-country": ["wineries", "bars", "food-drink"],
  "things-to-do": ["entertainment", "services", "activities", "restaurants"],
  "outdoor-adventures": ["services", "activities", "entertainment"],
  "community-guides": ["retail", "services", "health-beauty", "auto"],
  "local-history": ["entertainment", "services", "other"],
}

export async function getBusinessesForBlogCategory(
  blogCategory: string | null,
  limit = 3
): Promise<BlogBusinessCard[]> {
  const slugs = blogCategory ? (BLOG_CATEGORY_TO_BUSINESS_SLUGS[blogCategory] ?? null) : null

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      logoUrl: businesses.logoUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
      activeDealCount: sql<number>`count(${deals.id}) filter (where ${deals.expiresAt} > now() and ${deals.paused} = false)::int`,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .leftJoin(deals, eq(deals.businessId, businesses.id))
    .where(
      and(
        eq(businesses.status, "approved"),
        slugs ? inArray(categories.slug, slugs) : undefined
      )
    )
    .groupBy(businesses.id, categories.id)
    .orderBy(
      sql`count(${deals.id}) filter (where ${deals.expiresAt} > now() and ${deals.paused} = false) desc`,
      businesses.name
    )
    .limit(limit)

  return rows as BlogBusinessCard[]
}
