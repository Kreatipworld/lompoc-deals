import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  integer,
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
