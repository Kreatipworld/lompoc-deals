// Panadería Don Tacho's own special (owner, on camera Nov 4): free coffee every day with a pan purchase. Andres: "Add deal".
// Run: node --env-file=.env.local scripts/deal-panaderia-don-tacho.mjs
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
const [dup] = await sql`select id from deals where business_id = 689 and title ilike 'Free coffee%'`
if (dup) { console.log("already there", dup.id); process.exit(0) }
const img = (await put("deals/panaderia-don-tacho-free-coffee.png", readFileSync("content/social/video/out/panaderia-interview/flyer/flyer.png"), { access: "public", contentType: "image/png", addRandomSuffix: true })).url
const [d] = await sql`insert into deals (business_id, type, title, description, image_url, discount_text, terms, title_es, description_es, terms_es, discount_text_es, starts_at, expires_at)
  values (689, 'special', 'Free coffee with your pan', 'Buy your pan dulce at Panadería Don Tacho and your coffee is on the house, every single day. Help yourself at the coffee bar.',
    ${img}, 'Free coffee', 'With any bread purchase.', 'Café gratis con su pan', 'Compre su pan dulce en Panadería Don Tacho y el café va por cuenta de la casa, todos los días. Sírvase en la barra de café.',
    'Con cualquier compra de pan.', 'Café gratis', now(), '2027-11-05T08:00:00Z') returning id`
console.log("deal", d.id, img)
