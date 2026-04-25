/**
 * db/seed-feed-demo.ts
 *
 * Seeds 15 demo feed_posts (mix of for_sale, yard_sale, info) plus 3 events
 * so the /feed (Neighborhood) page has populated demo content for launch.
 *
 * Idempotent — re-running won't create duplicates (matches by exact title).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx db/seed-feed-demo.ts
 *   node --env-file=.env.local node_modules/.bin/tsx db/seed-feed-demo.ts --remove   # cleanup
 */

import { db } from "./client"
import { feedPosts, events, users } from "./schema"
import { eq, inArray, and } from "drizzle-orm"

const REMOVE = process.argv.includes("--remove")
const DEMO_USER_EMAIL = "demo-feed@lompoc-deals.local"
const DEMO_SOURCE = "feed-demo-seeder"

function daysAhead(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ─── Demo content ───────────────────────────────────────────────────────────

type DemoFeedPost = {
  type: "for_sale" | "info"
  title: string
  description: string
  priceCents: number | null
  saleStartsAt: Date | null
  saleEndsAt: Date | null
  address: string | null
  photos: string[] | null
  isFeatured?: boolean
}

const DEMO_POSTS: DemoFeedPost[] = [
  // Single-item for sale
  {
    type: "for_sale",
    title: "Mid-century walnut couch — gently used",
    description:
      "Solid walnut frame, original cushions, no stains or rips. Comes from a smoke-free home. Pickup only — H Street near the post office.",
    priceCents: 12000,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "200 W H St, Lompoc, CA 93436",
    photos: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=70"],
    isFeatured: true,
  },
  {
    type: "for_sale",
    title: "Surfboard — 6'2\" shortboard, low miles",
    description:
      "Used a handful of times at Jalama. Single ding repaired professionally. Comes with a leash. Cash only.",
    priceCents: 28000,
    saleStartsAt: null,
    saleEndsAt: null,
    address: null,
    photos: ["https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "for_sale",
    title: "Kids' bike with training wheels",
    description: "16\" purple bike, my daughter outgrew it. Tires hold air, brakes work. $30 firm.",
    priceCents: 3000,
    saleStartsAt: null,
    saleEndsAt: null,
    address: null,
    photos: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "for_sale",
    title: "Free firewood — already split",
    description:
      "Took down a couple of eucalyptus trees, have a pile of split firewood available. First come, first served. Backyard pickup, bring a truck.",
    priceCents: 0,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "100 N V St, Lompoc, CA 93436",
    photos: ["https://images.unsplash.com/photo-1542830880-c41cd47fb4d7?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "for_sale",
    title: "Vintage Pyrex set — full collection",
    description:
      "Inherited a complete set from my mom's kitchen. All four bowls + lids, no chips. Photos show real condition.",
    priceCents: 9500,
    saleStartsAt: null,
    saleEndsAt: null,
    address: null,
    photos: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "for_sale",
    title: "Ladder — 8 ft fiberglass, like new",
    description: "Bought for one project, never used again. Sells for $180 new at Home Depot.",
    priceCents: 7500,
    saleStartsAt: null,
    saleEndsAt: null,
    address: null,
    photos: null,
  },

  // Yard sales (for_sale with sale window)
  {
    type: "for_sale",
    title: "Multi-family yard sale — Saturday + Sunday",
    description:
      "Three neighbors clearing out garages. Furniture, kids' toys, tools, kitchen stuff, books. Cash only. Early birds welcome.",
    priceCents: null,
    saleStartsAt: daysAhead(3),
    saleEndsAt: daysAhead(4),
    address: "421 W Maple Ave, Lompoc, CA 93436",
    photos: ["https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=1200&auto=format&fit=crop&q=70"],
    isFeatured: true,
  },
  {
    type: "for_sale",
    title: "Estate sale — Saturday only",
    description:
      "Selling everything from my grandmother's house. China, linens, jewelry, vintage tools. 8am-1pm sharp.",
    priceCents: null,
    saleStartsAt: daysAhead(5),
    saleEndsAt: daysAhead(5),
    address: "316 N N St, Lompoc, CA 93436",
    photos: ["https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "for_sale",
    title: "Moving sale — must go this weekend",
    description:
      "Couch, dining table, queen bed frame, washer + dryer (working). All reasonable offers considered. Saturday + Sunday 9am-3pm.",
    priceCents: null,
    saleStartsAt: daysAhead(2),
    saleEndsAt: daysAhead(3),
    address: "1100 N Daisy St, Lompoc, CA 93436",
    photos: null,
  },

  // Info posts
  {
    type: "info",
    title: "Lost cat — orange tabby near Calle Real",
    description:
      "Our cat Marbles slipped out Tuesday night. Orange tabby, no collar but he's chipped. Very friendly, may walk up to you. Please call 805-555-0123 if you see him. Reward.",
    priceCents: null,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "Calle Real area, Lompoc, CA 93436",
    photos: ["https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "info",
    title: "Block party Saturday — H Street",
    description:
      "Annual H Street block party this Saturday 4-9pm. Potluck — bring a dish to share. Music, kids' games, ice cream truck around 6pm. Friendly dogs welcome on leash.",
    priceCents: null,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "H Street between Ocean and Cypress, Lompoc, CA 93436",
    photos: null,
  },
  {
    type: "info",
    title: "FYI: water main work Tuesday morning",
    description:
      "City crews will be replacing the water main on N Street between Maple and Walnut. Expect the water to be off 8am-noon Tuesday. Fill up jugs the night before.",
    priceCents: null,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "N St between Maple and Walnut, Lompoc, CA 93436",
    photos: null,
  },
  {
    type: "info",
    title: "Free piano — you haul",
    description:
      "Upright piano, plays fine but needs a tuning. Free if you can get it out by next weekend. Need at least 4 strong people + a truck. Garage access.",
    priceCents: null,
    saleStartsAt: null,
    saleEndsAt: null,
    address: "Vandenberg Village area",
    photos: ["https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1200&auto=format&fit=crop&q=70"],
  },
  {
    type: "info",
    title: "Carpool wanted — Lompoc to Vandenberg AFB",
    description:
      "Looking to share a ride to base, M-F, 7am-4pm shift. Will split gas. Hablo español también.",
    priceCents: null,
    saleStartsAt: null,
    saleEndsAt: null,
    address: null,
    photos: null,
  },
  {
    type: "info",
    title: "Babysitter available — high schooler with experience",
    description:
      "Lompoc High senior, CPR certified, references from three local families. Available evenings + weekends. $18/hr.",
    priceCents: null,
    saleStartsAt: null,
    saleEndsAt: null,
    address: null,
    photos: null,
  },
]

const DEMO_EVENTS = [
  {
    title: "Lompoc Flower Festival — opening day",
    description:
      "Annual celebration of Lompoc's flower fields. Parade at 10am, food trucks all day, live music in Ryon Park. Free admission.",
    location: "Ryon Park, Lompoc, CA",
    imageUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&auto=format&fit=crop&q=70",
    category: "festival" as const,
    startsAt: daysAhead(7),
    endsAt: daysAhead(7),
  },
  {
    title: "Farmers Market — Friday afternoon",
    description:
      "Weekly farmers market at the Lompoc Civic Center plaza. Local produce, baked goods, flowers, hot food. Every Friday 2-6pm.",
    location: "Lompoc Civic Center plaza, Lompoc, CA",
    imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop&q=70",
    category: "market" as const,
    startsAt: daysAhead(2),
    endsAt: daysAhead(2),
  },
  {
    title: "Live music at Cork & Tap — local jazz trio",
    description:
      "Local jazz trio playing standards + originals. No cover. Reservations recommended for tables.",
    location: "Cork & Tap, 113 N H St, Lompoc, CA 93436",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=70",
    category: "arts" as const,
    startsAt: daysAhead(4),
    endsAt: daysAhead(4),
  },
]

// ─── Seeder logic ───────────────────────────────────────────────────────────

async function findOrCreateDemoUser(): Promise<number> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEMO_USER_EMAIL),
  })
  if (existing) return existing.id

  const [created] = await db
    .insert(users)
    .values({
      email: DEMO_USER_EMAIL,
      role: "local",
      name: "Lompoc Locals (demo)",
    })
    .returning({ id: users.id })
  console.log(`  + created demo user "${DEMO_USER_EMAIL}" (id=${created.id})`)
  return created.id
}

async function removeDemo() {
  console.log(`🧹  Removing demo content…\n`)
  const titles = DEMO_POSTS.map((p) => p.title)
  const eventTitles = DEMO_EVENTS.map((e) => e.title)

  const deletedFeed = await db
    .delete(feedPosts)
    .where(inArray(feedPosts.title, titles))
    .returning({ id: feedPosts.id })
  console.log(`  - removed ${deletedFeed.length} feed_posts`)

  const deletedEvents = await db
    .delete(events)
    .where(and(inArray(events.title, eventTitles), eq(events.source, DEMO_SOURCE)))
    .returning({ id: events.id })
  console.log(`  - removed ${deletedEvents.length} events`)
  console.log(`\n✅ Demo content removed.`)
}

async function main() {
  if (REMOVE) {
    await removeDemo()
    process.exit(0)
  }

  console.log(`🌱  Seeding demo content for /feed (Neighborhood)…\n`)

  const demoUserId = await findOrCreateDemoUser()

  let inserted = 0
  let skipped = 0

  for (const post of DEMO_POSTS) {
    const existing = await db.query.feedPosts.findFirst({
      where: eq(feedPosts.title, post.title),
    })
    if (existing) {
      skipped++
      continue
    }

    // expires_at = saleEndsAt + 24h, or 30 days from now for non-windowed for_sale,
    // or 7 days for info
    const now = new Date()
    let expiresAt: Date
    if (post.type === "info") {
      expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 7)
    } else if (post.saleEndsAt) {
      expiresAt = new Date(post.saleEndsAt)
      expiresAt.setHours(expiresAt.getHours() + 24)
    } else {
      expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + 30)
    }

    // Stagger approvedAt across the past 6 hours so order varies and a few get NEW badges
    const approvedAt = new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000)

    await db.insert(feedPosts).values({
      postedByUserId: demoUserId,
      type: post.type,
      title: post.title,
      description: post.description,
      photos: post.photos ?? null,
      priceCents: post.priceCents,
      saleStartsAt: post.saleStartsAt,
      saleEndsAt: post.saleEndsAt,
      address: post.address,
      lat: null,
      lng: null,
      status: "approved",
      approvedAt,
      approvedByUserId: null,
      isFeatured: post.isFeatured ?? false,
      expiresAt,
      createdAt: approvedAt,
    })
    inserted++
    console.log(`  + ${post.type.padEnd(8)} "${post.title}"`)
  }

  // Events
  let eventInserted = 0
  let eventSkipped = 0
  for (const ev of DEMO_EVENTS) {
    const existing = await db.query.events.findFirst({
      where: and(eq(events.title, ev.title), eq(events.source, DEMO_SOURCE)),
    })
    if (existing) {
      eventSkipped++
      continue
    }

    await db.insert(events).values({
      title: ev.title,
      description: ev.description,
      location: ev.location,
      imageUrl: ev.imageUrl,
      category: ev.category,
      startsAt: ev.startsAt,
      endsAt: ev.endsAt,
      submittedByUserId: demoUserId,
      status: "approved",
      source: DEMO_SOURCE,
    })
    eventInserted++
    console.log(`  + event    "${ev.title}"`)
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`SUMMARY`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  feed_posts inserted : ${inserted}`)
  console.log(`  feed_posts skipped  : ${skipped} (already existed)`)
  console.log(`  events inserted     : ${eventInserted}`)
  console.log(`  events skipped      : ${eventSkipped} (already existed)`)
  console.log(`  demo user           : ${DEMO_USER_EMAIL} (id=${demoUserId})`)
  console.log(`\nVisit http://localhost:3001/en/feed to see the seeded content.`)

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
