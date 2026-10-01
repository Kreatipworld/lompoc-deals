#!/usr/bin/env node
/**
 * Seed tracked_keywords: the town-level starter list, plus for every member
 * business (active Growth/Plus subscription or a plan_override comp) its own
 * name and "lompoc <category>", each linked to the business with
 * target_path=/biz/<slug>. Idempotent — re-run any time members change:
 *
 *   node --env-file=.env.local scripts/seed-tracked-keywords.mjs
 *
 * docs/superpowers/specs/2026-09-30-keyword-positions-design.md
 */
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.error("Missing env: DATABASE_URL. Run: node --env-file=.env.local scripts/seed-tracked-keywords.mjs")
  process.exit(1)
}

const STARTER = [
  "lompoc", "lompoc locals", "lompoc restaurants", "restaurants in lompoc", "things to do in lompoc",
  "lompoc events", "lompoc news", "lompoc ca news", "lompoc football", "lompoc braves football",
  "cabrillo football", "lompoc high school football", "lompoc deals", "lompoc coupons", "lompoc garage sales",
  "lompoc yard sales", "lompoc plumber", "lompoc tires", "lompoc barber", "lompoc barbershop", "lompoc realtor",
  "homes for sale lompoc", "lompoc wineries", "lompoc tacos", "lompoc florist", "lompoc jewelers",
  "lompoc chalk festival", "lompoc chalks", "lompoc business directory", "lompoc map",
]

// Mirror of normalizeKeyword in lib/keyword-positions.ts.
const normalize = (s) =>
  s.toLowerCase().replace(/[^a-z0-9À-ɏ\s&']/g, " ").replace(/\s+/g, " ").trim()

const sql = neon(process.env.DATABASE_URL)

const members = await sql`
  select distinct b.id, b.name, b.slug, c.name as category
  from businesses b
  left join categories c on c.id = b.category_id
  left join subscriptions s on s.user_id = b.owner_user_id
    and s.status in ('active','trialing') and s.tier in ('standard','premium')
  where b.status = 'approved' and (b.plan_override in ('standard','premium') or s.id is not null)
  order by b.name`

const rows = STARTER.map((k) => ({ keyword: normalize(k), businessId: null, targetPath: null, note: "starter" }))
for (const m of members) {
  const path = `/biz/${m.slug}`
  const name = normalize(m.name)
  if (name) rows.push({ keyword: name, businessId: m.id, targetPath: path, note: "member name" })
  if (m.category) {
    const cat = normalize(m.category)
    if (cat) rows.push({ keyword: `lompoc ${cat}`.replace(/^lompoc lompoc /, "lompoc "), businessId: m.id, targetPath: path, note: "member category" })
  }
}

let inserted = 0
for (const r of rows) {
  if (!r.keyword) continue
  const res = await sql`
    insert into tracked_keywords (keyword, business_id, target_path, note)
    values (${r.keyword}, ${r.businessId}, ${r.targetPath}, ${r.note})
    on conflict (keyword) do nothing
    returning id`
  if (res.length) inserted++
}
const [{ n }] = await sql`select count(*)::int as n from tracked_keywords`
console.log(`${members.length} member business(es), ${rows.length} candidate keyword(s), ${inserted} new. tracked_keywords now has ${n}.`)
