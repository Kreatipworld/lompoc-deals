import "dotenv/config"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { db } from "./client"
import { categories, users, businesses, deals } from "./schema"

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function daysFromNow(d: number) {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date
}

async function main() {
  console.log("seeding…")

  // ---- categories ----
  const catRows = [
    { name: "Food & Drink", slug: "food-drink", icon: "utensils" },
    { name: "Retail", slug: "retail", icon: "shopping-bag" },
    { name: "Services", slug: "services", icon: "wrench" },
    { name: "Health & Beauty", slug: "health-beauty", icon: "heart" },
    { name: "Auto", slug: "auto", icon: "car" },
    { name: "Entertainment", slug: "entertainment", icon: "ticket" },
    { name: "Other", slug: "other", icon: "more-horizontal" },
  ]
  await db.insert(categories).values(catRows).onConflictDoNothing()
  const allCats = await db.query.categories.findMany()
  const catBySlug = Object.fromEntries(allCats.map((c) => [c.slug, c.id]))
  console.log(`✓ ${allCats.length} categories`)

  // ---- demo owner user ----
  const passwordHash = await bcrypt.hash("password123", 10)
  await db
    .insert(users)
    .values({
      email: "owner@lompocdeals.test",
      passwordHash,
      role: "business",
    })
    .onConflictDoNothing()
  const owner = (
    await db.query.users.findMany({
      where: (u, { eq }) => eq(u.email, "owner@lompocdeals.test"),
    })
  )[0]
  console.log(`✓ demo owner user (id=${owner.id})`)

  // ---- businesses ----
  const bizSeed = [
    {
      name: "Flower Field Coffee Co.",
      categorySlug: "food-drink",
      description:
        "Single-origin pour-overs and fresh pastries on H Street, owned and run by locals.",
      address: "115 N H St, Lompoc, CA 93436",
      lat: 34.6488,
      lng: -120.4577,
      phone: "(805) 555-0142",
      website: "https://flowerfieldcoffee.example",
    },
    {
      name: "Valley Vines Wine Bar",
      categorySlug: "food-drink",
      description:
        "Local Sta. Rita Hills wines by the glass plus a small charcuterie menu.",
      address: "201 E Ocean Ave, Lompoc, CA 93436",
      lat: 34.6385,
      lng: -120.4571,
      phone: "(805) 555-0188",
      website: "https://valleyvines.example",
    },
    {
      name: "Mission Auto Care",
      categorySlug: "auto",
      description:
        "Family-owned auto repair since 1998 — oil changes, brakes, and full inspections.",
      address: "820 N H St, Lompoc, CA 93436",
      lat: 34.6577,
      lng: -120.4575,
      phone: "(805) 555-0210",
      website: "https://missionauto.example",
    },
    {
      name: "Lompoc Cuts Barbershop",
      categorySlug: "health-beauty",
      description:
        "Classic and modern cuts, hot-towel shaves, and beard work. Walk-ins welcome.",
      address: "120 S I St, Lompoc, CA 93436",
      lat: 34.6378,
      lng: -120.4598,
      phone: "(805) 555-0177",
      website: "https://lompoccuts.example",
    },
    {
      name: "Sunny Skies Boutique",
      categorySlug: "retail",
      description:
        "Hand-picked clothing, gifts, and home goods from California makers.",
      address: "112 W Ocean Ave, Lompoc, CA 93436",
      lat: 34.6386,
      lng: -120.4596,
      phone: "(805) 555-0155",
      website: "https://sunnyskiesboutique.example",
    },
  ]

  const insertedBiz: { id: number; name: string }[] = []
  for (const b of bizSeed) {
    const [row] = await db
      .insert(businesses)
      .values({
        ownerUserId: owner.id,
        name: b.name,
        slug: slugify(b.name),
        description: b.description,
        categoryId: catBySlug[b.categorySlug],
        address: b.address,
        lat: b.lat,
        lng: b.lng,
        phone: b.phone,
        website: b.website,
        status: "approved",
      })
      .onConflictDoNothing()
      .returning({ id: businesses.id, name: businesses.name })
    if (row) insertedBiz.push(row)
  }

  // If onConflictDoNothing skipped, fetch existing
  const allBiz = await db.query.businesses.findMany()
  const bizByName = Object.fromEntries(allBiz.map((b) => [b.name, b.id]))
  console.log(`✓ ${allBiz.length} businesses`)

  // ---- deals (10 across the businesses) ----
  const dealSeed: {
    business: string
    type: "coupon" | "special" | "announcement"
    title: string
    description: string
    discountText?: string
    days: number
  }[] = [
    {
      business: "Flower Field Coffee Co.",
      type: "coupon",
      title: "$1 off any drink before 9am",
      description: "Earlybird discount, all week. One per customer.",
      discountText: "$1 OFF",
      days: 14,
    },
    {
      business: "Flower Field Coffee Co.",
      type: "special",
      title: "Buy 5 lattes, get 1 free",
      description: "Punch card available at the counter.",
      discountText: "BOGO",
      days: 60,
    },
    {
      business: "Valley Vines Wine Bar",
      type: "special",
      title: "Half-price wine flights on Tuesdays",
      description: "Three Sta. Rita Hills pours for the price of one and a half.",
      discountText: "50% OFF",
      days: 30,
    },
    {
      business: "Valley Vines Wine Bar",
      type: "announcement",
      title: "Live jazz this Friday at 7pm",
      description: "Local trio. No cover.",
      days: 7,
    },
    {
      business: "Mission Auto Care",
      type: "coupon",
      title: "$25 off any oil change",
      description: "Synthetic or conventional. Mention Lompoc Deals.",
      discountText: "$25 OFF",
      days: 45,
    },
    {
      business: "Mission Auto Care",
      type: "coupon",
      title: "Free brake inspection",
      description: "30-minute check, no obligation.",
      discountText: "FREE",
      days: 21,
    },
    {
      business: "Lompoc Cuts Barbershop",
      type: "coupon",
      title: "$5 off your first haircut",
      description: "New clients only. Walk-ins welcome.",
      discountText: "$5 OFF",
      days: 30,
    },
    {
      business: "Lompoc Cuts Barbershop",
      type: "special",
      title: "Hot-towel shave special",
      description: "Add a hot-towel shave to any cut for just $10.",
      discountText: "$10",
      days: 14,
    },
    {
      business: "Sunny Skies Boutique",
      type: "coupon",
      title: "20% off your first order",
      description: "In-store only. Show this deal at checkout.",
      discountText: "20% OFF",
      days: 21,
    },
    {
      business: "Sunny Skies Boutique",
      type: "announcement",
      title: "New spring collection now in stock",
      description: "California makers, small batches. Come see what's new.",
      days: 30,
    },
  ]

  let dealCount = 0
  for (const d of dealSeed) {
    const businessId = bizByName[d.business]
    if (!businessId) continue
    await db.insert(deals).values({
      businessId,
      type: d.type,
      title: d.title,
      description: d.description,
      discountText: d.discountText,
      startsAt: new Date(),
      expiresAt: daysFromNow(d.days),
    })
    dealCount++
  }
  console.log(`✓ ${dealCount} deals`)

  console.log("done.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .then(() => process.exit(0))

// silence unused-import warnings if any
void randomBytes
