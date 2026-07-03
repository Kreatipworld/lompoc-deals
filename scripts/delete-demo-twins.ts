/**
 * Delete the 4 demo "twin" businesses left over from the demo-slug cleanup.
 * These collided with real scraped listings during the reslug (so they got a
 * "-lompoc" suffix) and now duplicate real businesses while carrying fake
 * seeded deals. Deleting the business cascades to its deals (and the deals'
 * events/favorites) via FK onDelete: "cascade".
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/delete-demo-twins.ts
 */
import { db } from "@/db/client"
import { businesses, deals } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

const TWIN_SLUGS = [
  "babcock-winery-lompoc",
  "pink-pig-bbq-lompoc",
  "rebel-floral-lompoc",
  "valley-embroidery-lompoc",
]

async function main() {
  const twins = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(inArray(businesses.slug, TWIN_SLUGS))

  if (twins.length === 0) {
    console.log("No demo twins found — nothing to do.")
    return
  }

  for (const t of twins) {
    const twinDeals = await db
      .select({ id: deals.id, title: deals.title })
      .from(deals)
      .where(eq(deals.businessId, t.id))
    console.log(
      `Deleting ${t.slug} (id ${t.id}, "${t.name}") with ${twinDeals.length} deal(s): ${twinDeals
        .map((d) => d.title)
        .join(", ") || "none"}`
    )
    await db.delete(businesses).where(eq(businesses.id, t.id))
  }
  console.log(`Deleted ${twins.length} demo twin businesses.`)
}

main().then(() => process.exit(0))
