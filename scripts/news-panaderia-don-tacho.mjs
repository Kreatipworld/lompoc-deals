// News story (DRAFT): Panadería Don Tacho opens at 1133 N H St. Facts from the owner's own interview (Nov 4 2026).
// Cover = a frame of our own footage. No owner name (news desk rule). Publish only after Andres says so: PUBLISH=1.
// Run: node --env-file=.env.local scripts/news-panaderia-don-tacho.mjs
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const SLUG = "panaderia-don-tacho-now-open-lompoc"
const COVER = "content/social/video/out/panaderia-interview/stills/news-cover.jpg"

const content = `<p>North H Street has a new place to pick up pan dulce. Panadería Don Tacho is now open at 1133 North H Street, Suite B, in the same center as The Shack, with a case full of traditional Mexican bread.</p>
<p>Walk in and the first thing you see is the case under the big "Panadería Don Tacho" sign: pink and vanilla conchas, chocolate conchas, golden muffins in red paper, and trays of pastries stacked shelf after shelf.</p>
<h2>What to try first</h2>
<p>The bakery points first-timers to three things: telera, the soft split roll that makes the best torta; its pistachio bread; and its puerquitos, the little pig-shaped cookies made with piloncillo that taste like Sunday at grandma's.</p>
<h2>Free coffee, every day</h2>
<p>Here's the part regulars will remember: buy your pan at Panadería Don Tacho and the coffee is on the house, every single day. There's a coffee bar inside, so grab a cup while you pick your bread.</p>
<h2>Why this matters</h2>
<p>A neighborhood panadería is the kind of place a town builds its mornings around. Having one on the north side means fresh bolillos and conchas without a drive across town, and another local family business on a block that keeps growing.</p>
<p>Panadería Don Tacho is on Lompoc Locals: see its <a href="/biz/panaderia-don-tacho">page, address and phone</a>, or call (805) 631-2172.</p>`

const contentEs = `<p>La calle North H tiene un nuevo lugar para comprar pan dulce. Panadería Don Tacho ya abrió en el 1133 North H Street, Suite B, en el mismo centro que The Shack, con una vitrina llena de pan mexicano tradicional.</p>
<p>Al entrar, lo primero que se ve es la vitrina bajo el gran letrero de "Panadería Don Tacho": conchas rosas y de vainilla, conchas de chocolate, panquecitos dorados en papel rojo y charolas de pan, repisa tras repisa.</p>
<h2>Qué probar primero</h2>
<p>La panadería recomienda tres cosas para empezar: la telera, el pan suave perfecto para tortas; su pan de pistache; y sus puerquitos, las galletas de piloncillo en forma de cochinito que saben a domingo en casa de la abuela.</p>
<h2>Café gratis, todos los días</h2>
<p>Esto es lo que más van a recordar: compre su pan en Panadería Don Tacho y el café va por cuenta de la casa, todos los días. Hay una barra de café adentro para servirse mientras escoge su pan.</p>
<h2>Por qué importa</h2>
<p>Una panadería de barrio es el tipo de lugar alrededor del cual un pueblo arma sus mañanas. Tener una en el lado norte significa bolillos y conchas frescas sin cruzar la ciudad, y otro negocio familiar local en una cuadra que sigue creciendo.</p>
<p>Panadería Don Tacho está en Lompoc Locals: vea su <a href="/es/biz/panaderia-don-tacho">página, dirección y teléfono</a>, o llame al (805) 631-2172.</p>`

const row = {
  title: "Panadería Don Tacho Is Now Open on North H Street",
  excerpt: "Traditional Mexican bread at 1133 N H St, Suite B: telera, pistachio bread, puerquitos and conchas, with free coffee every day when you buy your pan.",
  titleEs: "Panadería Don Tacho ya abrió en la calle North H",
  excerptEs: "Pan mexicano tradicional en el 1133 N H St, Suite B: telera, pan de pistache, puerquitos y conchas, con café gratis todos los días al comprar su pan.",
  meta: "Panadería Don Tacho is now open at 1133 N H St, Suite B in Lompoc: traditional Mexican bread and free coffee every day with your purchase.",
  metaEs: "Panadería Don Tacho ya abrió en el 1133 N H St, Suite B en Lompoc: pan mexicano tradicional y café gratis todos los días con su compra.",
}
const tags = ["bakery", "pan dulce", "north h street", "new business", "panaderia don tacho", "topic:business"]

const [existing] = await sql`select id, image_url from blog_posts where slug = ${SLUG}`
const imageUrl = existing?.image_url ?? (await put("news/panaderia-don-tacho-cover.jpg", readFileSync(COVER), { access: "public", contentType: "image/jpeg", addRandomSuffix: true })).url
const publish = process.env.PUBLISH === "1"

if (existing) {
  await sql`update blog_posts set title=${row.title}, excerpt=${row.excerpt}, content=${content}, title_es=${row.titleEs}, excerpt_es=${row.excerptEs},
    content_es=${contentEs}, meta_description=${row.meta}, meta_description_es=${row.metaEs}, tags=${JSON.stringify(tags)}::jsonb, image_url=${imageUrl},
    status=${publish ? "published" : "draft"}, published_at=${publish ? new Date() : null}, updated_at=now() where id=${existing.id}`
  console.log("updated", existing.id, publish ? "PUBLISHED" : "draft")
} else {
  const [r] = await sql`insert into blog_posts (slug, title, excerpt, content, image_url, category, tags, status, published_at, author_name, meta_description, title_es, excerpt_es, content_es, meta_description_es)
    values (${SLUG}, ${row.title}, ${row.excerpt}, ${content}, ${imageUrl}, 'local-news', ${JSON.stringify(tags)}::jsonb, ${publish ? "published" : "draft"},
      ${publish ? new Date() : null}, 'Lompoc Locals Team', ${row.meta}, ${row.titleEs}, ${row.excerptEs}, ${contentEs}, ${row.metaEs}) returning id`
  console.log("inserted", r.id, publish ? "PUBLISHED" : "draft", imageUrl)
}
