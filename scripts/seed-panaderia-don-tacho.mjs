// One-off: create Panadería Don Tacho (Mexican bakery, 1133 N H St Ste B) from the logo and
// Google profile screenshot Andres sent Nov 4 2026. No photos yet, so the cover is a logo card.
// Usage: node --env-file=.env.local scripts/seed-panaderia-don-tacho.mjs <dir with logo-square.png, cover.png>
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const dir = process.argv[2]
const sql = neon(process.env.DATABASE_URL)
const existing = await sql`select id from businesses where slug = 'panaderia-don-tacho'`
if (existing.length) { console.log("already exists:", existing[0].id); process.exit(0) }

const up = async (name) => (await put(`biz-photos/panaderia-don-tacho/${name}`, readFileSync(`${dir}/${name}`), { access: "public", contentType: "image/png", addRandomSuffix: true })).url
const logo = await up("logo-square.png")
const cover = await up("cover.png")

const [row] = await sql`insert into businesses
  (owner_user_id, name, slug, description, description_es, category_id, address, lat, lng, phone, logo_url, cover_url, photos_json, status, about, about_source, about_es, seo_descriptor, seo_descriptor_es)
values (16, 'Panadería Don Tacho', 'panaderia-don-tacho',
  'Traditional Mexican bakery on N H St: pan dulce, conchas and fresh bread, baked the traditional way.',
  'Panadería mexicana tradicional en la N H St: pan dulce, conchas y pan fresco, hecho a la manera tradicional.',
  1, '1133 N H St Ste B, Lompoc, CA 93436', 34.6563343, -120.4586179, '(805) 631-2172', ${logo}, ${cover}, ${JSON.stringify([cover])}::jsonb, 'approved',
  ${"Panadería Don Tacho bakes traditional Mexican bread (pan tradicional mexicano) in Lompoc, in the shopping center at 1133 N H St, Suite B. Look for Tachito, the bakery's smiling bread mascot, on the sign. Call (805) 631-2172 for today's bread."},
  'owner',
  ${"Panadería Don Tacho hornea pan tradicional mexicano en Lompoc, en el centro comercial de 1133 N H St, Suite B. Busca a Tachito, la mascota sonriente de la panadería, en el letrero. Llama al (805) 631-2172 para preguntar por el pan del día."},
  'Mexican Bakery, Lompoc', 'Panadería Mexicana en Lompoc')
returning id, slug`
console.log("created", row)
