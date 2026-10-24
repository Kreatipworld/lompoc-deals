// One-off: create GL Painting (service-area painter, Kreatip client) and upload its logo + cover.
// Usage: node --env-file=.env.local scripts/seed-gl-painting.mjs <dir with logo-square.png, cover.png>
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const dir = process.argv[2]
const sql = neon(process.env.DATABASE_URL)
const existing = await sql`select id from businesses where slug = 'gl-painting'`
if (existing.length) { console.log("already exists:", existing[0].id); process.exit(0) }

const up = async (name) => (await put(`biz-photos/gl-painting/${name}`, readFileSync(`${dir}/${name}`), { access: "public", contentType: "image/png", addRandomSuffix: true })).url
const logo = await up("logo-square.png")
const cover = await up("cover.png")

const [row] = await sql`insert into businesses
  (owner_user_id, name, slug, description, description_es, category_id, phone, email, email_source, website, logo_url, cover_url, photos_json, status, about, about_source, about_es, seo_descriptor, seo_descriptor_es)
values (16, 'GL Painting', 'gl-painting',
  'House and commercial painting for Lompoc: interior, exterior, cabinets, drywall repair and deck and fence staining. State-licensed painting contractor. Call or text for an estimate.',
  'Pintura de casas y negocios en Lompoc: interiores, exteriores, gabinetes, reparación de drywall y tinte de decks y cercas. Contratista de pintura con licencia estatal. Llama o envía un mensaje para un presupuesto.',
  17, '(805) 336-2283', 'gustavolopez19907@gmail.com', 'owner', 'https://glpaintingco.com', ${logo}, ${cover}, ${JSON.stringify([cover])}::jsonb, 'approved',
  ${"GL Painting is a state-licensed painting contractor run by Gustavo Lopez, serving homes and businesses in Lompoc and across Santa Barbara and Ventura Counties.\n\nThe work covers interior painting (walls, ceilings, trim and doors), exterior painting (stucco, siding, trim and eaves), cabinet painting, commercial painting scheduled around business hours, drywall repair, and deck and fence staining. A service-area business: they come to you. Send a photo of the job for an estimate."},
  'website',
  ${"GL Painting es un contratista de pintura con licencia estatal dirigido por Gustavo Lopez, que atiende casas y negocios en Lompoc y en los condados de Santa Barbara y Ventura.\n\nEl trabajo incluye pintura de interiores (paredes, techos, molduras y puertas), pintura de exteriores (estuco, revestimiento, molduras y aleros), pintura de gabinetes, pintura comercial programada según el horario del negocio, reparación de drywall y tinte de decks y cercas. Es un negocio de área de servicio: van a tu casa. Envía una foto del trabajo para un presupuesto."},
  'Interior & Exterior Painting', 'Pintura en Lompoc')
returning id, slug`
console.log("created", row)
