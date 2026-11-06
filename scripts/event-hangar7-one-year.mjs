// Hangar 7 Social House One Year Celebration (Sat Nov 7 2026, 7–11 PM), from the venue's own IG post + flyer (Andres sent it Nov 6).
// Facts only, no drinks mentioned (no-alcohol rule). The explorelompoc "Live Music" copy for that night (231) is hidden (pending)
// so the night shows once; the sync never touches status.
// Run: node --env-file=.env.local scripts/event-hangar7-one-year.mjs
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
const [dup] = await sql`select id from events where business_id = 286 and title ilike '%one year%'`
if (dup) { console.log("already there", dup.id); process.exit(0) }
const img = (await put("events/hangar7-one-year.jpg", readFileSync("content/social/events/hangar7-one-year.jpg"), { access: "public", contentType: "image/jpeg", addRandomSuffix: true })).url
const [e] = await sql`insert into events (category, starts_at, ends_at, business_id, status, source, title, description, location, image_url, title_es, description_es)
  values ('community', '2026-11-08T03:00:00Z', '2026-11-08T07:00:00Z', 286, 'approved', 'business',
    'Hangar 7 One Year Celebration',
    'Hangar 7 Social House turns one. Live band On The Flip Side plays outside, and a live DJ spins classic rock, pop and dance inside. Raffles and prizes, free swag and small bites. All ages welcome.',
    '107 W Ocean Ave, Lompoc, CA 93436', ${img},
    'Primer aniversario de Hangar 7',
    'Hangar 7 Social House cumple un año. La banda On The Flip Side toca afuera y un DJ en vivo pone rock clásico, pop y música para bailar adentro. Rifas y premios, regalos y botanas. Todas las edades son bienvenidas.')
  returning id`
await sql`update events set status = 'pending' where id = 231 and source = 'explorelompoc'`
console.log("event", e.id, img)
