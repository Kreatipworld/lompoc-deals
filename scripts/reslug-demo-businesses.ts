/**
 * Strip the "demo-" prefix from business slugs so live deals don't link to
 * URLs that announce fake content (e.g. /biz/demo-florianos-pizzeria).
 *
 * If the stripped slug collides with an existing business, suffix with
 * "-lompoc" instead of overwriting.
 *
 * Usage: npm run reslug:demo-businesses
 */
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { eq, like } from "drizzle-orm"

async function main() {
  const demos = await db.select({ id: businesses.id, slug: businesses.slug })
    .from(businesses)
    .where(like(businesses.slug, "demo-%"))

  for (const b of demos) {
    const base = b.slug.replace(/^demo-/, "")
    const clash = await db.select({ id: businesses.id }).from(businesses)
      .where(eq(businesses.slug, base))
    const next = clash.length > 0 ? `${base}-lompoc` : base
    await db.update(businesses).set({ slug: next }).where(eq(businesses.id, b.id))
    console.log(`${b.slug} -> ${next}${clash.length > 0 ? "  (collision, suffixed)" : ""}`)
  }
  console.log(`Reslugged ${demos.length} businesses.`)
}

main().then(() => process.exit(0))
