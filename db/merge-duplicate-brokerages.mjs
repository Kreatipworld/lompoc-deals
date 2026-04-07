// Manually merge known duplicate brokerages and then delete the dupes.
// Run: node --env-file=.env.local db/merge-duplicate-brokerages.mjs

import { neon } from "@neondatabase/serverless"

// Pairs of [keep-slug, delete-slug] — listings from the deleted one are
// reassigned to the kept one.
const MERGES = [
  // Keep the original "Hinkens Group", delete the auto-created variant
  ["hinkens-group", "the-hinkens-group-realty-pro"],
  // Keep the auto-created BHHS Santa Barbara (it has the real listing),
  // delete the manually-added "California Properties" empty one
  ["berkshire-hathaway-homeservices-santa-barbara", "berkshire-hathaway-lompoc"],
]

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  for (const [keepSlug, deleteSlug] of MERGES) {
    const keep = await sql`select id, name from businesses where slug = ${keepSlug}`
    const del = await sql`select id, name from businesses where slug = ${deleteSlug}`

    if (!keep.length) {
      console.log(`  ✗ keep-slug not found: ${keepSlug}`)
      continue
    }
    if (!del.length) {
      console.log(`  ↻ delete-slug not found (already merged): ${deleteSlug}`)
      continue
    }

    const keepId = keep[0].id
    const delId = del[0].id

    // Reassign any listings
    const moved = await sql`
      update property_listings
      set business_id = ${keepId}
      where business_id = ${delId}
      returning id
    `
    console.log(
      `  → ${moved.length} listings moved from "${del[0].name}" → "${keep[0].name}"`
    )

    // Delete the duplicate brokerage
    await sql`delete from businesses where id = ${delId}`
    console.log(`  ✗ deleted duplicate: ${del[0].name}`)
  }

  // Show final state
  console.log("\n== Final brokerages with listing counts ==")
  const final = await sql`
    select b.name, count(pl.id)::int as listings
    from businesses b
    join categories c on c.id = b.category_id
    left join property_listings pl on pl.business_id = b.id and pl.status = 'active'
    where c.slug = 'real-estate'
    group by b.id, b.name
    order by listings desc, b.name
  `
  final.forEach((r) =>
    console.log(`  ${r.listings.toString().padStart(3)} | ${r.name}`)
  )
  console.log(`\nTotal: ${final.length} brokerages`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
