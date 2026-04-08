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

// ---------- users ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("local"),
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
    instagramUrl: varchar("instagram_url", { length: 500 }),
    facebookUrl: varchar("facebook_url", { length: 500 }),
    tiktokUrl: varchar("tiktok_url", { length: 500 }),
    youtubeUrl: varchar("youtube_url", { length: 500 }),
    yelpUrl: varchar("yelp_url", { length: 500 }),
    googleBusinessUrl: varchar("google_business_url", { length: 500 }),
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
