// Two events Andres sent Nov 9 (flyers in content/social/events/), facts from the flyers + lompocmurdermystery.com.
// The Gilded Lily: no drinks mentioned (no-alcohol rule); the flyer's bottles are darkened in our copy.
// Run: node --env-file=.env.local scripts/event-gilded-lily-and-blood-drive.mjs
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
async function add(e) {
  const [dup] = await sql`select id from events where business_id = ${e.biz} and title = ${e.title}`
  if (dup) { console.log("already there", dup.id, e.title); return }
  const img = (await put(`events/${e.file}`, readFileSync(`content/social/events/${e.file}`), { access: "public", contentType: "image/jpeg", addRandomSuffix: true })).url
  const [r] = await sql`insert into events (category, starts_at, ends_at, business_id, status, source, title, description, location, image_url, title_es, description_es)
    values (${e.category}, ${e.starts}, ${e.ends}, ${e.biz}, 'approved', 'business', ${e.title}, ${e.desc}, ${e.location}, ${img}, ${e.title_es}, ${e.desc_es})
    returning id`
  console.log("event", r.id, e.title, img)
}
await add({
  biz: 18, category: "arts", file: "gilded-lily.jpg",
  starts: "2026-12-13T01:30:00Z", ends: null,
  title: "The Gilded Lily: A 1920s Murder Mystery",
  title_es: "The Gilded Lily: misterio de asesinato de los años 20",
  location: "South Side Coffee Co., 105 S H St, Lompoc, CA 93436",
  desc: "South Side Coffee Co and The Certain Sparks Music Foundation present an interactive murder mystery set in Chicago, 1927. Doors open at 5:30 PM, hors d'oeuvres and a live band at 6, the investigation at 7, and accusations read at 8. Come in 1920s attire; your character packet arrives by email on Nov 21. $70 per ticket, only 80 seats, and ticket sales end Nov 20. The event needs at least 50 guests, or every ticket is refunded. Tickets at lompocmurdermystery.com.",
  desc_es: "South Side Coffee Co y The Certain Sparks Music Foundation presentan un misterio de asesinato interactivo ambientado en Chicago, 1927. Las puertas abren a las 5:30 PM, botanas y banda en vivo a las 6, la investigación a las 7 y las acusaciones a las 8. Ven vestido al estilo de los años 20; tu paquete de personaje llega por correo el 21 de noviembre. $70 por boleto, solo 80 lugares, y la venta termina el 20 de noviembre. El evento necesita al menos 50 invitados o se reembolsan todos los boletos. Boletos en lompocmurdermystery.com.",
})
await add({
  biz: 350, category: "community", file: "awaken-blood-drive.jpg",
  starts: "2026-12-03T23:30:00Z", ends: "2026-12-04T03:30:00Z",
  title: "Vitalant Blood Drive with Awaken Cardio Kickboxing",
  title_es: "Donación de sangre de Vitalant con Awaken Cardio Kickboxing",
  location: "Bloodmobile at 113 W Ocean Ave, Lompoc, CA 93436",
  desc: "Donate blood in the Vitalant Bloodmobile outside Awaken Cardio Kickboxing, 3:30 to 7:30 PM. Each donation can save up to 3 lives and supports local hospitals. Donors Dec 1 to 13 get a $10 Rewards gift card and an entry to win a $20,000 gift card; use code DECEMBER-2026-V when you schedule. Book at vitalant.org or 877-25-VITAL.",
  desc_es: "Dona sangre en el Bloodmobile de Vitalant afuera de Awaken Cardio Kickboxing, de 3:30 a 7:30 PM. Cada donación puede salvar hasta 3 vidas y apoya a los hospitales locales. Quienes donen del 1 al 13 de diciembre reciben una tarjeta de regalo de $10 y una entrada para ganar una tarjeta de $20,000; usa el código DECEMBER-2026-V al hacer tu cita. Reserva en vitalant.org o al 877-25-VITAL.",
})
