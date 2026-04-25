import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"

// ---------- enums ----------
export const userRole = pgEnum("user_role", ["local", "business", "admin"])
export const businessStatus = pgEnum("business_status", [
  "pending",
  "approved",
  "rejected",
])
export const dealType = pgEnum("deal_type", [
  "coupon",
  "special",
  "announcement",
])
export const subscriptionTier = pgEnum("subscription_tier", [
  "free",
  "standard",
  "premium",
])
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "trialing",
])
export const feedPostType = pgEnum("feed_post_type", ["for_sale", "info"])
export const feedPostStatus = pgEnum("feed_post_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "sold",
])

// ---------- users ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  /** @deprecated Google OAuth was removed; column kept for rollback safety. Will be dropped in a future migration. */
  googleId: varchar("google_id", { length: 255 }).unique(),
  role: userRole("role").notNull().default("local"),
  name: varchar("name", { length: 200 }),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  city: varchar("city", { length: 100 }),
  zip: varchar("zip", { length: 20 }),
  interestsJson: jsonb("interests_json"),
  notificationEmails: boolean("notification_emails").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- categories ----------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
})

// ---------- businesses ----------
export const businesses = pgTable(
  "businesses",
  {
    id: serial("id").primaryKey(),
    ownerUserId: integer("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    phone: varchar("phone", { length: 50 }),
    website: varchar("website", { length: 500 }),
    hoursJson: jsonb("hours_json"),
    logoUrl: varchar("logo_url", { length: 1000 }),
    coverUrl: varchar("cover_url", { length: 1000 }),
    photosJson: jsonb("photos_json"),
    instagramUrl: varchar("instagram_url", { length: 500 }),
    facebookUrl: varchar("facebook_url", { length: 500 }),
    tiktokUrl: varchar("tiktok_url", { length: 500 }),
    youtubeUrl: varchar("youtube_url", { length: 500 }),
    yelpUrl: varchar("yelp_url", { length: 500 }),
    googleBusinessUrl: varchar("google_business_url", { length: 500 }),
    ownerFullName: varchar("owner_full_name", { length: 200 }),
    planOverride: subscriptionTier("plan_override"),
    gracePeriodEndsAt: timestamp("grace_period_ends_at", { withTimezone: true }),
    status: businessStatus("status").notNull().default("pending"),
    stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 200 }),
    stripeConnectOnboardingComplete: boolean("stripe_connect_onboarding_complete").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("businesses_slug_idx").on(t.slug),
  })
)

// ---------- deals ----------
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  type: dealType("type").notNull().default("coupon"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 1000 }),
  discountText: varchar("discount_text", { length: 200 }),
  terms: text("terms"),
  startsAt: timestamp("starts_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  viewCount: integer("view_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  paused: boolean("paused").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- favorites ----------
export const favorites = pgTable(
  "favorites",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.dealId] }),
  })
)

// ---------- property listings (real estate) ----------
export const listingType = pgEnum("listing_type", ["for-sale", "for-rent"])

export const propertyListings = pgTable("property_listings", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  type: listingType("type").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  beds: integer("beds"),
  baths: doublePrecision("baths"),
  sqft: integer("sqft"),
  address: text("address"),
  imageUrl: varchar("image_url", { length: 1000 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  zpid: varchar("zpid", { length: 50 }).unique(),
  detailUrl: varchar("detail_url", { length: 1000 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  photosJson: jsonb("photos_json"),
  yearBuilt: integer("year_built"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- business claims ----------
export const businessClaims = pgTable("business_claims", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- subscriptions ----------
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 200 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 200 }).unique(),
  tier: subscriptionTier("tier").notNull().default("free"),
  status: subscriptionStatus("status").notNull().default("trialing"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: integer("cancel_at_period_end").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- events ----------
export const eventCategory = pgEnum("event_category", [
  "community",
  "business-launch",
  "festival",
  "arts",
  "food",
  "sports",
  "market",
  "other",
])
export const eventStatus = pgEnum("event_status", [
  "pending",
  "approved",
  "cancelled",
])

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 500 }),
    imageUrl: varchar("image_url", { length: 1000 }),
    category: eventCategory("category").notNull().default("other"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    businessId: integer("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    submittedByUserId: integer("submitted_by_user_id").references(
      () => users.id,
      { onDelete: "set null" }
    ),
    status: eventStatus("status").notNull().default("pending"),
    source: varchar("source", { length: 50 }).notNull().default("user"),
    externalId: varchar("external_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sourceExternalIdx: uniqueIndex("events_source_external_id_idx").on(
      t.source,
      t.externalId
    ),
  })
)

// ---------- deal events ----------
export const dealEventType = pgEnum("deal_event_type", [
  "view",
  "click",
  "claim",
  "redeem",
])

export const dealEvents = pgTable("deal_events", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  eventType: dealEventType("event_type").notNull(),
  sessionId: varchar("session_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- activities ----------
export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 300 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description"),
    address: varchar("address", { length: 500 }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    imageUrl: varchar("image_url", { length: 1000 }),
    tips: text("tips"),
    seasonality: varchar("seasonality", { length: 200 }),
    sourceUrl: varchar("source_url", { length: 1000 }),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("activities_slug_idx").on(t.slug),
  })
)

// ---------- password reset tokens ----------
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- business follows ----------
export const businessFollows = pgTable(
  "business_follows",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.businessId] }),
  })
)

// ---------- telegram ----------
export const telegramSettings = pgTable("telegram_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const telegramMessages = pgTable("telegram_messages", {
  id: serial("id").primaryKey(),
  chatId: varchar("chat_id", { length: 50 }).notNull(),
  fromName: varchar("from_name", { length: 200 }),
  fromUsername: varchar("from_username", { length: 200 }),
  text: text("text").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- blog posts ----------
export const blogPostStatus = pgEnum("blog_post_status", [
  "draft",
  "published",
])

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 300 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 1000 }),
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags").$type<string[]>(),
    status: blogPostStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorName: varchar("author_name", { length: 200 }),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("blog_posts_slug_idx").on(t.slug),
  })
)

// ---------- garage sales ----------
export const garageSaleStatus = pgEnum("garage_sale_status", [
  "active",
  "expired",
  "removed",
])

/**
 * @deprecated 2026-04-24 — replaced by `feedPosts` (Phase 5 Town Feed).
 * Kept read-only for one release; will be dropped in a follow-up migration.
 * New code MUST use `feedPosts`. See docs/superpowers/specs/2026-04-24-town-feed-design.md.
 */
export const garageSales = pgTable("garage_sales", {
  id: serial("id").primaryKey(),
  postedByUserId: integer("posted_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  address: text("address").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  description: text("description").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  itemCategories: jsonb("item_categories").$type<string[]>(),
  photos: jsonb("photos").$type<string[]>(),
  status: garageSaleStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- subscribers ----------
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribeToken: varchar("unsubscribe_token", { length: 100 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------- feed posts ----------
export const feedPosts = pgTable(
  "feed_posts",
  {
    id: serial("id").primaryKey(),
    postedByUserId: integer("posted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: feedPostType("type").notNull(),

    // Common
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    photos: jsonb("photos"), // string[] of Vercel Blob URLs (0–4)

    // for_sale only
    priceCents: integer("price_cents"),
    saleStartsAt: timestamp("sale_starts_at", { withTimezone: true }),
    saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),

    // Optional location
    address: varchar("address", { length: 300 }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    // Moderation
    status: feedPostStatus("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByUserId: integer("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),

    // Highlight
    isFeatured: boolean("is_featured").notNull().default(false),

    // Lifecycle
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    statusExpiresIdx: index("feed_posts_status_expires_idx").on(t.status, t.expiresAt),
    typeStatusIdx: index("feed_posts_type_status_idx").on(t.type, t.status),
    postedByIdx: index("feed_posts_posted_by_idx").on(t.postedByUserId),
  })
)
