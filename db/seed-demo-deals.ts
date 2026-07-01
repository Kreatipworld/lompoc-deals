/**
 * db/seed-demo-deals.ts
 *
 * Seeds ~8 demo businesses (slug prefix "demo-") each with one active deal so
 * the homepage Weekly Deals Digest (and /deals, business pages, counts) have
 * populated content while trying the platform.
 *
 * All demo businesses are tagged by the "demo-" slug prefix and owned by a
 * single demo user, so they are fully removable in one command.
 *
 * Idempotent — re-running skips businesses whose slug already exists.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx db/seed-demo-deals.ts
 *   node --env-file=.env.local node_modules/.bin/tsx db/seed-demo-deals.ts --remove   # cleanup
 */

import { db } from "./client"
import { businesses, deals, users, categories } from "./schema"
import { eq, like, inArray } from "drizzle-orm"

const REMOVE = process.argv.includes("--remove")
const DEMO_USER_EMAIL = "demo-deals@lompoc-locals.local"
const DEMO_SLUG_PREFIX = "demo-"

function daysAhead(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

type DemoDeal = {
  slug: string // business slug (without prefix)
  bizName: string
  categorySlug: string
  image: string
  address: string
  lat: number
  lng: number
  dealTitle: string
  dealType: "coupon" | "special" | "announcement"
  discountText: string
  description: string
  terms: string
}

// ─── Demo content (mirrors the Lompoc Locals weekly flyer) ───────────────────
const DEMO: DemoDeal[] = [
  {
    slug: "south-side-coffee", bizName: "South Side Coffee Co.", categorySlug: "food-drink",
    image: "/categories/food-drink.jpg", address: "512 S H St, Lompoc, CA 93436", lat: 34.6352, lng: -120.4568,
    dealTitle: "Buy one latte, get one free", dealType: "special", discountText: "BOGO free latte",
    description: "Two lattes for the price of one at our South H St café.",
    terms: "Mon–Fri before noon. Dine-in only. One per customer.",
  },
  {
    slug: "babcock-winery", bizName: "Babcock Winery & Vineyards", categorySlug: "wineries",
    image: "/categories/wineries.jpg", address: "5175 CA-246, Lompoc, CA 93436", lat: 34.6108, lng: -120.3402,
    dealTitle: "Tasting flight for two", dealType: "special", discountText: "2-FOR-1",
    description: "Small-lot Pinot & Chardonnay on the Sta. Rita Hills wine trail.",
    terms: "Sat & Sun, 11am–5pm. One per table. 21+ only.",
  },
  {
    slug: "pink-pig-bbq", bizName: "Pink Pig BBQ", categorySlug: "food-drink",
    image: "/categories/food-drink.jpg", address: "117 N H St, Lompoc, CA 93436", lat: 34.6412, lng: -120.4571,
    dealTitle: "Free side with any plate", dealType: "special", discountText: "FREE side",
    description: "Slow-smoked BBQ in Old Town — pick any side, on us.",
    terms: "Mon–Thu. Dine-in or takeout. One per order.",
  },
  {
    slug: "rebel-floral", bizName: "Rebel Floral", categorySlug: "services",
    image: "/categories/services.jpg", address: "224 North H St, Lompoc, CA 93436", lat: 34.6431, lng: -120.4573,
    dealTitle: "Second bouquet half off", dealType: "coupon", discountText: "50% OFF 2nd",
    description: "Mixed seasonal bouquets, hand-arranged fresh daily.",
    terms: "Second bouquet of equal or lesser value. While supplies last.",
  },
  {
    slug: "mariposa-nails", bizName: "Mariposa Nails", categorySlug: "health-beauty",
    image: "/categories/health-beauty.jpg", address: "1005 E Ocean Ave, Lompoc, CA 93436", lat: 34.6389, lng: -120.4442,
    dealTitle: "Gel manicure + pedicure", dealType: "coupon", discountText: "20% OFF",
    description: "Gel mani-pedi combo at our Ocean Ave salon.",
    terms: "Tue–Thu. Walk-ins welcome, no appointment.",
  },
  {
    slug: "kaizen-collision", bizName: "Kaizen Collision Center", categorySlug: "auto",
    image: "/categories/auto.jpg", address: "501 N 8th St, Lompoc, CA 93436", lat: 34.6438, lng: -120.4616,
    dealTitle: "Collision repair estimate", dealType: "special", discountText: "FREE estimate",
    description: "Full-service collision repair — free written estimate.",
    terms: "All major insurance carriers accepted. Loaner check available.",
  },
  {
    slug: "valley-embroidery", bizName: "Valley Embroidery", categorySlug: "retail",
    image: "/categories/retail.jpg", address: "119 W Walnut Ave, Lompoc, CA 93436", lat: 34.6465, lng: -120.4585,
    dealTitle: "Custom embroidery, $25+", dealType: "coupon", discountText: "$5 OFF",
    description: "Custom apparel & embroidery — serving Vandenberg SFB.",
    terms: "$25 minimum. Unit & squadron orders welcome.",
  },
  {
    slug: "florianos-pizzeria", bizName: "Floriano's Pizzeria", categorySlug: "food-drink",
    image: "/categories/food-drink.jpg", address: "128 W Ocean Ave, Lompoc, CA 93436", lat: 34.6396, lng: -120.4578,
    dealTitle: "Any large pie", dealType: "coupon", discountText: "$5 OFF",
    description: "Wood-fired pizza in Old Town Lompoc.",
    terms: "Dine-in or takeout this week. One per visit.",
  },
]

async function ensureDemoUser(): Promise<number> {
  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_USER_EMAIL) })
  if (existing) return existing.id
  const [created] = await db
    .insert(users)
    .values({ email: DEMO_USER_EMAIL, role: "business", name: "Lompoc Locals Demo" })
    .returning({ id: users.id })
  console.log(`  + created demo user "${DEMO_USER_EMAIL}" (id=${created.id})`)
  return created.id
}

async function remove() {
  console.log("Removing demo deals + businesses…")
  const demoBiz = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(like(businesses.slug, `${DEMO_SLUG_PREFIX}%`))
  const ids = demoBiz.map((b) => b.id)
  if (ids.length) {
    // deals cascade on business delete, but delete explicitly for a clean count
    const delDeals = await db.delete(deals).where(inArray(deals.businessId, ids)).returning({ id: deals.id })
    const delBiz = await db.delete(businesses).where(inArray(businesses.id, ids)).returning({ id: businesses.id })
    console.log(`  - removed ${delDeals.length} deals, ${delBiz.length} businesses`)
  } else {
    console.log("  (no demo businesses found)")
  }
  const delUser = await db.delete(users).where(eq(users.email, DEMO_USER_EMAIL)).returning({ id: users.id })
  console.log(`  - removed ${delUser.length} demo user`)
  console.log("Done.")
}

async function seed() {
  const ownerUserId = await ensureDemoUser()
  const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id]))

  let bizCount = 0
  let dealCount = 0
  for (const d of DEMO) {
    const slug = `${DEMO_SLUG_PREFIX}${d.slug}`
    const existing = await db.query.businesses.findFirst({ where: eq(businesses.slug, slug) })
    if (existing) {
      console.log(`  = business "${d.bizName}" already exists (id=${existing.id}), skipping`)
      continue
    }
    const [biz] = await db
      .insert(businesses)
      .values({
        ownerUserId,
        name: d.bizName,
        slug,
        description: d.description,
        categoryId: catBySlug.get(d.categorySlug) ?? null,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        coverUrl: d.image,
        status: "approved",
      })
      .returning({ id: businesses.id })
    bizCount++
    await db.insert(deals).values({
      businessId: biz.id,
      type: d.dealType,
      title: d.dealTitle,
      description: d.description,
      imageUrl: d.image,
      discountText: d.discountText,
      terms: d.terms,
      expiresAt: daysAhead(30),
    })
    dealCount++
    console.log(`  + ${d.bizName} — ${d.dealTitle} (${d.discountText})`)
  }
  console.log(`\nSeeded ${bizCount} demo businesses, ${dealCount} deals.`)
  console.log("Remove later with:  node --env-file=.env.local node_modules/.bin/tsx db/seed-demo-deals.ts --remove")
}

async function main() {
  if (REMOVE) await remove()
  else await seed()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
