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
    // --- real Lompoc businesses ---
    {
      name: "Alfie's Fish & Chips",
      categorySlug: "food-drink",
      description:
        "Traditional English-style fish and chips since 1972, using fresh (never frozen) fish with crispy batter. Lompoc's beloved original.",
      address: "610 N H St, Lompoc, CA 93436",
      lat: 34.6440,
      lng: -120.4579,
      phone: "(805) 736-5000",
      website: "https://alfiesfishandchips.com",
    },
    {
      name: "Wild West Pizza & Grill",
      categorySlug: "food-drink",
      description:
        "Fresh-dough pizzas with locally sourced ingredients in a Western-themed space with arcade games — great for families.",
      address: "1137 N H St, Lompoc, CA 93436",
      lat: 34.6520,
      lng: -120.4579,
      phone: "(805) 736-9000",
      website: "https://wildwestpizzalompoc.com",
    },
    {
      name: "La Botte Italian Restaurant",
      categorySlug: "food-drink",
      description:
        "Family-owned Italian eatery with handmade pastas, fresh seafood, and an impressive Sta. Rita Hills wine selection.",
      address: "112 S I St, Lompoc, CA 93436",
      lat: 34.6360,
      lng: -120.4565,
      phone: "(805) 735-8200",
      website: "https://labottelompoc.com",
    },
    {
      name: "Bravo Pizza",
      categorySlug: "food-drink",
      description:
        "Family-owned pizzeria since 1993 serving personal pies, specialty pizzas, calzones, salads, and wings.",
      address: "129 W Central Ave, Lompoc, CA 93436",
      lat: 34.6370,
      lng: -120.4620,
      phone: "(805) 736-2000",
      website: "https://bravopizzalompoc.com",
    },
    {
      name: "Rice Bowl",
      categorySlug: "food-drink",
      description:
        "Historic Chinese restaurant famous for giant egg rolls, chow mein, wonton soup, and generous family-sized portions.",
      address: "117 W Ocean Ave, Lompoc, CA 93436",
      lat: 34.6388,
      lng: -120.4600,
      phone: "(805) 736-2600",
      website: "https://ricebowllompoc.com",
    },
    {
      name: "Chow-Ya",
      categorySlug: "food-drink",
      description:
        "Asian-fusion featuring poke bowls, bulgogi, and spicy ramen with rich broths. Fresh, bold flavors every day.",
      address: "713 E Ocean Ave, Lompoc, CA 93436",
      lat: 34.6388,
      lng: -120.4480,
      phone: "(805) 737-2600",
      website: "https://chow-ya.com",
    },
    {
      name: "Hodges Automotive",
      categorySlug: "auto",
      description:
        "Full-service auto repair rated 4.9 stars, specializing in oil changes, brake service, and exhaust work. Honest and fast.",
      address: "807 E Chestnut Ave, Lompoc, CA 93436",
      lat: 34.6350,
      lng: -120.4470,
      phone: "(805) 736-9696",
      website: "https://hodgesautolompoc.com",
    },
    {
      name: "P&L Transmissions & Auto Repair",
      categorySlug: "auto",
      description:
        "Full-service shop specializing in transmission repair, engine work, brakes, emissions testing, and A/C service.",
      address: "322 N F St, Lompoc, CA 93436",
      lat: 34.6400,
      lng: -120.4555,
      phone: "(805) 736-0660",
      website: "https://pltransmissions.com",
    },
    {
      name: "Camarena's Tires & More",
      categorySlug: "auto",
      description:
        "Bridgestone, Goodyear, and Michelin tire sales plus brake repair, wheel alignment, and lift kits.",
      address: "1500 E Ocean Ave, Lompoc, CA 93436",
      lat: 34.6388,
      lng: -120.4390,
      phone: "(805) 737-4400",
      website: "https://camarenastires.com",
    },
    {
      name: "Kaizen Collision Center",
      categorySlug: "auto",
      description:
        "Certified auto body and collision repair. Insurance-approved, quality workmanship with fast turnaround.",
      address: "501 N 8th St, Lompoc, CA 93436",
      lat: 34.6430,
      lng: -120.4530,
      phone: "(805) 735-6456",
      website: "https://kaizencollision.com",
    },
    {
      name: "Shear Salon & Day Spa",
      categorySlug: "health-beauty",
      description:
        "Full-service hair salon and day spa offering cuts, color, styling, facials, and relaxation treatments.",
      address: "1005 E Ocean Ave, Lompoc, CA 93436",
      lat: 34.6388,
      lng: -120.4450,
      phone: "(805) 736-8980",
      website: "https://shearsalondayspa.com",
    },
    {
      name: "Ramiro's Barbershop",
      categorySlug: "health-beauty",
      description:
        "Traditional barbershop offering precision cuts, fades, and beard trims. Well-loved local spot on H Street.",
      address: "734 N H St, Lompoc, CA 93436",
      lat: 34.6460,
      lng: -120.4579,
      phone: "(805) 734-8810",
      website: "https://ramirosbarbershop.com",
    },
    {
      name: "Famous Nails and Spa",
      categorySlug: "health-beauty",
      description:
        "Popular nail salon and spa offering manicures, pedicures, gel, and acrylic services at competitive prices.",
      address: "406 W Ocean Ave, Lompoc, CA 93436",
      lat: 34.6388,
      lng: -120.4620,
      phone: "(805) 743-4096",
      website: "https://famousnailslompoc.com",
    },
    {
      name: "Planet Fitness Lompoc",
      categorySlug: "services",
      description:
        "24/7 accessible budget gym with cardio machines, free weights, and tanning. Judgment-free zone.",
      address: "1009 N H St, Lompoc, CA 93436",
      lat: 34.6490,
      lng: -120.4579,
      phone: "(805) 735-3055",
      website: "https://planetfitness.com",
    },
    {
      name: "Lompoc Family YMCA",
      categorySlug: "services",
      description:
        "Community fitness center with pools, group classes, youth programs, and wellness services for all ages.",
      address: "201 W College Ave, Lompoc, CA 93436",
      lat: 34.6370,
      lng: -120.4610,
      phone: "(805) 736-3483",
      website: "https://ciymca.org",
    },
    {
      name: "Movies Lompoc",
      categorySlug: "entertainment",
      description:
        "Lompoc's local movie theater showing current Hollywood releases. Affordable tickets, great popcorn.",
      address: "220 W Barton Ave, Lompoc, CA 93436",
      lat: 34.6395,
      lng: -120.4605,
      phone: "(805) 736-1558",
      website: "https://movieslompoc.com",
    },
    {
      name: "Certain Sparks Music",
      categorySlug: "retail",
      description:
        "Locally owned music store, music school, and recording studio in historic Old Town. Instruments, books, records, and sound equipment.",
      address: "107 S H St, Lompoc, CA 93436",
      lat: 34.6360,
      lng: -120.4579,
      phone: "(805) 588-9479",
      website: "https://certainsparks.com",
    },
    {
      name: "Luxury Nails Salon",
      categorySlug: "health-beauty",
      description:
        "Premium nail salon offering gel, dip powder, acrylics, and spa pedicures in a relaxing atmosphere.",
      address: "1313 N H St, Lompoc, CA 93436",
      lat: 34.6540,
      lng: -120.4579,
      phone: "(805) 735-1429",
      website: "https://luxurynailslompoc.com",
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
    // --- deals for real Lompoc businesses ---
    {
      business: "Alfie's Fish & Chips",
      type: "coupon",
      title: "$3 off any fish & chips combo",
      description: "Fresh fish, never frozen. Mention Lompoc Deals at checkout.",
      discountText: "$3 OFF",
      days: 21,
    },
    {
      business: "Alfie's Fish & Chips",
      type: "special",
      title: "Family meal deal — feed 4 for $40",
      description: "Four fish portions, large fries, and four drinks. Dine-in only.",
      discountText: "FAMILY DEAL",
      days: 30,
    },
    {
      business: "Alfie's Fish & Chips",
      type: "announcement",
      title: "Now open Sundays 11am–8pm",
      description: "By popular demand! Come enjoy fish & chips on the weekend.",
      days: 60,
    },
    {
      business: "Wild West Pizza & Grill",
      type: "coupon",
      title: "Large pizza for the price of a medium",
      description: "Any toppings. Dine-in or pickup. Show this deal.",
      discountText: "SIZE UP",
      days: 14,
    },
    {
      business: "Wild West Pizza & Grill",
      type: "special",
      title: "Kids eat free on Mondays",
      description: "One free kids meal per paying adult entrée. Dine-in only.",
      discountText: "FREE",
      days: 45,
    },
    {
      business: "La Botte Italian Restaurant",
      type: "coupon",
      title: "15% off dinner for two",
      description: "Valid Sunday–Thursday. Reserve by calling or mentioning Lompoc Deals.",
      discountText: "15% OFF",
      days: 30,
    },
    {
      business: "La Botte Italian Restaurant",
      type: "special",
      title: "Wine Wednesday — half off bottles",
      description: "Selected Sta. Rita Hills bottles 50% off every Wednesday evening.",
      discountText: "50% OFF",
      days: 60,
    },
    {
      business: "La Botte Italian Restaurant",
      type: "announcement",
      title: "New spring pasta menu debuts this week",
      description: "Chef's seasonal handmade pastas with local produce. Limited time.",
      days: 14,
    },
    {
      business: "Bravo Pizza",
      type: "coupon",
      title: "Buy any large pizza, get free breadsticks",
      description: "Garlic breadsticks fresh from the oven. Pickup or dine-in.",
      discountText: "FREE BREADSTICKS",
      days: 21,
    },
    {
      business: "Bravo Pizza",
      type: "special",
      title: "Tuesday special — 2 personal pizzas for $16",
      description: "Mix and match toppings. Every Tuesday, all day.",
      discountText: "2 FOR $16",
      days: 60,
    },
    {
      business: "Rice Bowl",
      type: "coupon",
      title: "Free egg roll with any lunch entrée",
      description: "Our famous giant egg rolls. Lunch hours: 11am–3pm.",
      discountText: "FREE EGG ROLL",
      days: 30,
    },
    {
      business: "Rice Bowl",
      type: "special",
      title: "Family dinner for 4 — $45 combo",
      description: "Includes fried rice, chow mein, two entrées, and egg rolls.",
      discountText: "FAMILY $45",
      days: 45,
    },
    {
      business: "Chow-Ya",
      type: "coupon",
      title: "$5 off any poke bowl",
      description: "Build your own or choose a signature bowl. Show deal at register.",
      discountText: "$5 OFF",
      days: 14,
    },
    {
      business: "Chow-Ya",
      type: "special",
      title: "Ramen happy hour 3–5pm weekdays",
      description: "Any ramen bowl for $10. Limited seats — first come, first served.",
      discountText: "$10 RAMEN",
      days: 30,
    },
    {
      business: "Hodges Automotive",
      type: "coupon",
      title: "$20 off full synthetic oil change",
      description: "Includes multi-point inspection. Mention Lompoc Deals when scheduling.",
      discountText: "$20 OFF",
      days: 45,
    },
    {
      business: "Hodges Automotive",
      type: "coupon",
      title: "Free tire rotation with any service",
      description: "Save $15–$20. Add it to any oil change, brake job, or inspection.",
      discountText: "FREE ROTATION",
      days: 30,
    },
    {
      business: "P&L Transmissions & Auto Repair",
      type: "coupon",
      title: "$50 off transmission service",
      description: "Fluid change, filter, and inspection. Most vehicles. Call to schedule.",
      discountText: "$50 OFF",
      days: 45,
    },
    {
      business: "P&L Transmissions & Auto Repair",
      type: "coupon",
      title: "Free A/C check this month",
      description: "Stay cool — free system check before summer. No obligation.",
      discountText: "FREE CHECK",
      days: 21,
    },
    {
      business: "Camarena's Tires & More",
      type: "coupon",
      title: "$40 off a set of 4 tires",
      description: "Bridgestone, Goodyear, or Michelin. Installation included.",
      discountText: "$40 OFF",
      days: 30,
    },
    {
      business: "Camarena's Tires & More",
      type: "special",
      title: "Free wheel alignment check",
      description: "Find out if you're out of alignment before it costs you tires.",
      discountText: "FREE",
      days: 21,
    },
    {
      business: "Kaizen Collision Center",
      type: "coupon",
      title: "Free paint touch-up with any repair",
      description: "Minor scratches and chips fixed free when you bring in collision work.",
      discountText: "FREE TOUCH-UP",
      days: 60,
    },
    {
      business: "Kaizen Collision Center",
      type: "announcement",
      title: "Now accepting all major insurance carriers",
      description: "Let us handle the claim paperwork. Loaner vehicles available.",
      days: 90,
    },
    {
      business: "Shear Salon & Day Spa",
      type: "coupon",
      title: "$15 off any color service",
      description: "Highlights, balayage, or full color. New clients and returning.",
      discountText: "$15 OFF",
      days: 30,
    },
    {
      business: "Shear Salon & Day Spa",
      type: "special",
      title: "Spa Sunday package — $79",
      description: "Facial, manicure, and blowout. Book online or by phone.",
      discountText: "$79 PACKAGE",
      days: 45,
    },
    {
      business: "Ramiro's Barbershop",
      type: "coupon",
      title: "$5 off any haircut",
      description: "Fades, tapers, classic cuts. Mention Lompoc Deals when you come in.",
      discountText: "$5 OFF",
      days: 21,
    },
    {
      business: "Ramiro's Barbershop",
      type: "special",
      title: "Dad & son combo — both cuts for $30",
      description: "Bring the little one in. Walk-ins welcome, Saturdays only.",
      discountText: "2 FOR $30",
      days: 30,
    },
    {
      business: "Famous Nails and Spa",
      type: "coupon",
      title: "$10 off gel manicure",
      description: "Long-lasting color with gel top coat. Mention Lompoc Deals.",
      discountText: "$10 OFF",
      days: 21,
    },
    {
      business: "Famous Nails and Spa",
      type: "special",
      title: "Pedicure & manicure combo — $45",
      description: "Relaxing spa treatment for hands and feet. Walk-ins welcome.",
      discountText: "$45 COMBO",
      days: 30,
    },
    {
      business: "Planet Fitness Lompoc",
      type: "coupon",
      title: "No enrollment fee this month",
      description: "Join for just $10/month with no startup cost. Classic membership.",
      discountText: "NO FEE",
      days: 30,
    },
    {
      business: "Planet Fitness Lompoc",
      type: "special",
      title: "Bring a friend free in April",
      description: "Guest privileges included for the month. PF Black Card members.",
      discountText: "FREE GUEST",
      days: 30,
    },
    {
      business: "Lompoc Family YMCA",
      type: "coupon",
      title: "First month free for new members",
      description: "Join the Y and get your first month at no charge. All ages.",
      discountText: "1 MONTH FREE",
      days: 45,
    },
    {
      business: "Lompoc Family YMCA",
      type: "special",
      title: "Youth swim lessons — spring session open",
      description: "8-week swim lesson sessions for ages 3–12. Limited spots.",
      discountText: "SIGN UP",
      days: 21,
    },
    {
      business: "Movies Lompoc",
      type: "coupon",
      title: "$2 off evening tickets",
      description: "Any showing after 5pm. One discount per Lompoc Deals redemption.",
      discountText: "$2 OFF",
      days: 30,
    },
    {
      business: "Movies Lompoc",
      type: "special",
      title: "Tuesday matinee — $7 tickets all day",
      description: "Any film, any showtime on Tuesdays. Cheapest tickets in town.",
      discountText: "$7 TICKETS",
      days: 60,
    },
    {
      business: "Movies Lompoc",
      type: "announcement",
      title: "Summer blockbusters lineup now posted",
      description: "Check the full schedule online. Advance tickets available.",
      days: 45,
    },
    {
      business: "Certain Sparks Music",
      type: "coupon",
      title: "10% off any instrument purchase",
      description: "Guitars, ukuleles, drums, and more. Show deal in store.",
      discountText: "10% OFF",
      days: 30,
    },
    {
      business: "Certain Sparks Music",
      type: "special",
      title: "Free first music lesson with instrument purchase",
      description: "30-minute private lesson included with any new instrument. All skill levels.",
      discountText: "FREE LESSON",
      days: 45,
    },
    {
      business: "Certain Sparks Music",
      type: "announcement",
      title: "Open mic night every 3rd Friday",
      description: "All genres, all skill levels. Doors open 6pm, performances 7–10pm.",
      days: 60,
    },
    {
      business: "Luxury Nails Salon",
      type: "coupon",
      title: "$8 off dip powder manicure",
      description: "Long-lasting, chip-resistant color. New and returning clients.",
      discountText: "$8 OFF",
      days: 21,
    },
    {
      business: "Luxury Nails Salon",
      type: "special",
      title: "Spa pedicure + paraffin wax — $50",
      description: "Relax and rejuvenate. Add-ons available. By appointment or walk-in.",
      discountText: "$50 SPECIAL",
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
