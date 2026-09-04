/**
 * One-time cleanup: every calendar row synced from the tourism feed gets a
 * description in our own words (facts taken from the old text), our own topic
 * cover instead of a hotlinked third-party image, and a cleared Spanish twin so
 * the translate cron rewrites it. Run: npx tsx scripts/clean-synced-events.ts [--dry] [--upcoming]
 */
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { and, eq, gt } from "drizzle-orm"
import { eventCoverUrl, isOwnCover, writeEventBlurb } from "@/lib/event-copy"

const dry = process.argv.includes("--dry")
const upcomingOnly = process.argv.includes("--upcoming")

async function main() {
  const rows = await db
    .select()
    .from(events)
    .where(upcomingOnly ? and(eq(events.source, "explorelompoc"), gt(events.startsAt, new Date())) : eq(events.source, "explorelompoc"))
    .orderBy(events.startsAt)
  console.log(`${rows.length} synced rows${dry ? " (dry run)" : ""}`)
  let done = 0, failed = 0
  for (const ev of rows) {
    const cover = isOwnCover(ev.imageUrl) ? ev.imageUrl! : eventCoverUrl(ev.category)
    const blurb = await writeEventBlurb({ title: ev.title, location: ev.location ?? "Lompoc, CA", startsAt: ev.startsAt, endsAt: ev.endsAt, category: ev.category, sourceText: ev.description })
    if (!blurb) { failed++; console.log(`  !! no blurb for #${ev.id} ${ev.title}`) }
    if (dry) { console.log(`#${ev.id} ${ev.title}\n   → ${blurb}\n   cover ${cover}`); continue }
    await db.update(events).set({
      description: blurb ?? null,
      descriptionEs: null,
      imageUrl: cover,
    }).where(eq(events.id, ev.id))
    done++
    if (done % 10 === 0) console.log(`  ${done}/${rows.length}`)
  }
  console.log(`updated ${done}, blurb failures ${failed}`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
