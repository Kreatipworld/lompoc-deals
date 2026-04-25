/**
 * db/migrate-garage-sales-to-feed.ts
 *
 * One-shot data migration. Copies every row from garage_sales into
 * feed_posts with type="for_sale". Supports --dry-run.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx db/migrate-garage-sales-to-feed.ts --dry-run
 *   node --env-file=.env.local node_modules/.bin/tsx db/migrate-garage-sales-to-feed.ts
 */

import { and, eq } from "drizzle-orm"
import { db } from "./client"
import { feedPosts, garageSales } from "./schema"

const DRY_RUN = process.argv.includes("--dry-run")

function combineDateTime(date: Date | null, time: string | null): Date | null {
  if (!date) return null
  if (!time) return date
  const [h, m] = time.split(":").map((s) => parseInt(s, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return date
  const out = new Date(date)
  out.setHours(h, m, 0, 0)
  return out
}

function computeExpiresAt(saleEndsAt: Date | null, createdAt: Date): Date {
  if (saleEndsAt) {
    const out = new Date(saleEndsAt)
    out.setHours(out.getHours() + 24)
    return out
  }
  const out = new Date(createdAt)
  out.setDate(out.getDate() + 30)
  return out
}

function deriveTitle(description: string | null): string {
  if (!description) return "Garage sale"
  const trimmed = description.trim()
  if (!trimmed) return "Garage sale"
  return trimmed.length <= 80 ? trimmed : trimmed.slice(0, 77).trimEnd() + "…"
}

async function main() {
  console.log(`🔄  Migrating garage_sales → feed_posts${DRY_RUN ? " (DRY RUN)" : ""}\n`)

  const oldRows = await db.select().from(garageSales)
  console.log(`Found ${oldRows.length} garage_sales rows`)

  let migrated = 0
  let skipped = 0
  let nullUser = 0

  for (const row of oldRows) {
    // feedPosts.postedByUserId is notNull — skip orphaned rows
    if (row.postedByUserId === null) {
      console.log(`  [${row.id}] skipped: postedByUserId is null`)
      nullUser++
      skipped++
      continue
    }

    // Idempotency: skip if a feed_post for this user+createdAt already exists
    const existing = await db
      .select({ id: feedPosts.id })
      .from(feedPosts)
      .where(
        and(
          eq(feedPosts.postedByUserId, row.postedByUserId),
          eq(feedPosts.createdAt, row.createdAt)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      skipped++
      continue
    }

    const saleStartsAt = combineDateTime(row.startDate ?? null, row.startTime ?? null)
    const saleEndsAt = combineDateTime(row.endDate ?? null, row.endTime ?? null)
    const expiresAt = computeExpiresAt(saleEndsAt, row.createdAt)
    const status: "approved" | "expired" =
      row.status === "active" ? "approved" : "expired"

    const insertValues = {
      postedByUserId: row.postedByUserId,
      type: "for_sale" as const,
      title: deriveTitle(row.description ?? null),
      description: row.description ?? null,
      photos: row.photos ?? null,
      priceCents: null,
      saleStartsAt,
      saleEndsAt,
      address: row.address ?? null,
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      status,
      approvedAt: row.createdAt,
      approvedByUserId: null,
      rejectionReason: null,
      isFeatured: false,
      expiresAt,
      createdAt: row.createdAt,
    }

    if (DRY_RUN) {
      console.log(
        `  [${row.id}] would insert: title="${insertValues.title}" status=${status} expiresAt=${expiresAt.toISOString()}`
      )
    } else {
      await db.insert(feedPosts).values(insertValues)
    }
    migrated++
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`SUMMARY`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  garage_sales rows : ${oldRows.length}`)
  console.log(`  ${DRY_RUN ? "would migrate" : "migrated"}     : ${migrated}`)
  console.log(`  skipped (already) : ${skipped}`)
  if (nullUser > 0) {
    console.log(`  skipped (no user) : ${nullUser}`)
  }
  console.log(`  mode              : ${DRY_RUN ? "DRY RUN — no writes" : "LIVE"}`)

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
