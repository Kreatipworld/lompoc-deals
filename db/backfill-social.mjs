// One-off backfill for verified social URLs found via web search.
// Run: node --env-file=.env.local db/backfill-social.mjs
// Skips fields that aren't found — those stay null until the owner sets them.

import { neon } from "@neondatabase/serverless"

const SOCIAL = {
  "old-town-kitchen-bar": {
    instagramUrl: "https://www.instagram.com/oldtownkitchen_805/",
    facebookUrl:
      "https://www.facebook.com/p/Old-Town-Kitchen-Bar-100063717123701/",
    yelpUrl: "https://www.yelp.com/biz/old-town-kitchen-and-bar-lompoc",
  },
  "south-side-coffee-co": {
    instagramUrl: "https://www.instagram.com/southsidecoffeeco_lompoc/",
    facebookUrl: "https://www.facebook.com/southsidecoffeecompany/",
    yelpUrl: "https://www.yelp.com/biz/south-side-coffee-lompoc",
  },
  "la-botte": {
    yelpUrl: "https://www.yelp.com/biz/la-botte-lompoc",
  },
  "chow-ya": {
    yelpUrl: "https://www.yelp.com/biz/chow-ya-lompoc",
  },
  "mikes-trains-hobbies": {
    facebookUrl: "https://www.facebook.com/Mikestrains/",
    yelpUrl: "https://www.yelp.com/biz/mikes-trains-and-hobbies-lompoc",
  },
  "hodges-automotive": {
    facebookUrl:
      "https://www.facebook.com/p/Hodges-Automotive-100067424510631/",
    yelpUrl: "https://www.yelp.com/biz/hodges-automotive-lompoc-2",
  },
  "pl-transmissions-auto-repair": {
    yelpUrl:
      "https://www.yelp.com/biz/p-and-l-transmissions-and-auto-repair-lompoc-2",
  },
  "lompoc-barber-lounge": {
    instagramUrl: "https://www.instagram.com/lompocbarberlounge/",
    facebookUrl:
      "https://www.facebook.com/p/Lompoc-Barber-Lounge-100075905722571/",
  },
  "ramiros-barbershop": {
    yelpUrl: "https://www.yelp.com/biz/ramiros-barber-shop-lompoc",
  },
  "pier-fitness": {
    instagramUrl: "https://www.instagram.com/pierfitness/",
    facebookUrl:
      "https://www.facebook.com/p/Pier-Fitness-Pilates-100063862755673/",
  },
  "yoga-vie": {
    facebookUrl: "https://www.facebook.com/YogaVieLompoc/",
  },
  "blooming-energy": {
    instagramUrl: "https://www.instagram.com/blooming.energy/",
    facebookUrl:
      "https://www.facebook.com/p/Blooming-Energy-100077168692634/",
  },
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)
  let updated = 0
  for (const [slug, fields] of Object.entries(SOCIAL)) {
    const ig = fields.instagramUrl ?? null
    const fb = fields.facebookUrl ?? null
    const tt = fields.tiktokUrl ?? null
    const yt = fields.youtubeUrl ?? null
    const yp = fields.yelpUrl ?? null
    const gb = fields.googleBusinessUrl ?? null
    const result = await sql`
      update businesses set
        instagram_url = coalesce(${ig}, instagram_url),
        facebook_url = coalesce(${fb}, facebook_url),
        tiktok_url = coalesce(${tt}, tiktok_url),
        youtube_url = coalesce(${yt}, youtube_url),
        yelp_url = coalesce(${yp}, yelp_url),
        google_business_url = coalesce(${gb}, google_business_url)
      where slug = ${slug}
      returning name
    `
    if (result.length) {
      console.log(
        `  ✓ ${result[0].name.padEnd(40)} ${Object.keys(fields).join(", ")}`
      )
      updated++
    }
  }
  console.log(`\n${updated} businesses updated`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
