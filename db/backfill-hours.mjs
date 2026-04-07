// One-off backfill: give the 19 seeded businesses sensible default hours
// so the new BusinessHours sidebar isn't empty everywhere.
// Run: node --env-file=.env.local db/backfill-hours.mjs

import { neon } from "@neondatabase/serverless"

const day = (open, close) => ({ open, close })
const closed = null

// Sensible category-based defaults
const HOURS_BY_CATEGORY = {
  "food-drink": {
    mon: day("11:00", "21:00"),
    tue: day("11:00", "21:00"),
    wed: day("11:00", "21:00"),
    thu: day("11:00", "21:00"),
    fri: day("11:00", "22:00"),
    sat: day("11:00", "22:00"),
    sun: day("11:00", "20:00"),
  },
  retail: {
    mon: day("10:00", "18:00"),
    tue: day("10:00", "18:00"),
    wed: day("10:00", "18:00"),
    thu: day("10:00", "18:00"),
    fri: day("10:00", "19:00"),
    sat: day("10:00", "19:00"),
    sun: closed,
  },
  auto: {
    mon: day("08:00", "17:00"),
    tue: day("08:00", "17:00"),
    wed: day("08:00", "17:00"),
    thu: day("08:00", "17:00"),
    fri: day("08:00", "16:00"),
    sat: closed,
    sun: closed,
  },
  "health-beauty": {
    mon: day("09:00", "19:00"),
    tue: day("09:00", "19:00"),
    wed: closed,
    thu: day("09:00", "19:00"),
    fri: day("09:00", "19:00"),
    sat: day("09:00", "16:00"),
    sun: closed,
  },
  services: {
    mon: day("06:00", "21:00"),
    tue: day("06:00", "21:00"),
    wed: day("06:00", "21:00"),
    thu: day("06:00", "21:00"),
    fri: day("06:00", "20:00"),
    sat: day("08:00", "18:00"),
    sun: day("08:00", "16:00"),
  },
  entertainment: {
    mon: day("12:00", "22:00"),
    tue: day("12:00", "22:00"),
    wed: day("12:00", "22:00"),
    thu: day("12:00", "22:00"),
    fri: day("12:00", "23:00"),
    sat: day("11:00", "23:00"),
    sun: day("11:00", "21:00"),
  },
  other: {
    mon: day("10:00", "17:00"),
    tue: day("10:00", "17:00"),
    wed: day("10:00", "17:00"),
    thu: day("10:00", "17:00"),
    fri: day("10:00", "17:00"),
    sat: day("10:00", "14:00"),
    sun: closed,
  },
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  const rows = await sql`
    select b.id, b.name, c.slug as cat_slug
    from businesses b
    left join categories c on c.id = b.category_id
  `

  console.log(`Backfilling hours for ${rows.length} businesses…`)
  for (const r of rows) {
    const hours = HOURS_BY_CATEGORY[r.cat_slug] ?? HOURS_BY_CATEGORY.other
    await sql`update businesses set hours_json = ${JSON.stringify(hours)}::jsonb where id = ${r.id}`
    console.log(`  ✓ ${r.name} (${r.cat_slug})`)
  }
  console.log("done.")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
