/**
 * Update activity images to real Lompoc photos.
 * Source: Wikimedia Commons (public domain / CC-licensed) + Unsplash
 * Run: npx tsx db/update-activity-images.ts
 */
import "dotenv/config"
import { db } from "./client"
import { activities } from "./schema"
import { eq } from "drizzle-orm"

const IMAGE_UPDATES = [
  {
    slug: "la-purisima-mission",
    imageUrl: "/activities/la-purisima-mission.jpg",
    // Source: Wikimedia Commons, public domain — actual La Purisima Mission, Lompoc CA
  },
  {
    slug: "lompoc-flower-fields",
    imageUrl: "/activities/lompoc-flower-fields.jpg",
    // Source: Wikimedia Commons (NARA archive) — actual Lompoc flower fields
  },
  {
    slug: "lompoc-murals-tour",
    imageUrl: "/activities/lompoc-murals.jpg",
    // Source: Wikimedia Commons — actual Lompoc mural by Ann Thompson, Ocean Blvd & I St
  },
  {
    slug: "jalama-beach",
    imageUrl: "/activities/jalama-beach.jpg",
    // Source: Wikimedia Commons — actual Jalama Beach County Park, Santa Barbara County
  },
  {
    slug: "lompoc-wine-ghetto",
    imageUrl: "/activities/wine-ghetto-tasting.jpg",
    // Source: Unsplash — wine tasting scene
  },
  {
    slug: "vandenberg-launches",
    imageUrl: "/activities/vandenberg-launch.jpg",
    // Source: Wikimedia Commons (USAF photo) — Falcon 9 launch from Vandenberg AFB, 2013
  },
]

async function update() {
  console.log("Updating activity images...")
  for (const item of IMAGE_UPDATES) {
    const result = await db
      .update(activities)
      .set({ imageUrl: item.imageUrl })
      .where(eq(activities.slug, item.slug))
    console.log(`  ✓ ${item.slug} → ${item.imageUrl}`)
  }
  console.log("Done.")
  process.exit(0)
}

update().catch((err) => {
  console.error(err)
  process.exit(1)
})
