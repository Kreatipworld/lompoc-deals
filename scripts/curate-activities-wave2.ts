/**
 * Curate wave-2 activity photos and apply the copy corrections the photos surfaced.
 *
 * Google Places hands back whatever the crowd uploaded — parking lots, signage, watermarked
 * stock, and occasionally a shot of somewhere else entirely. PICKS below is a hand-reviewed
 * order for each activity (1-based, against the original photos_json order): lead photo first,
 * rejects omitted.
 *
 * Re-runnable: it re-reads the ORIGINAL Places order from blob filenames (g-<slug>-<n>.jpeg),
 * so running it twice does not compound.
 *
 * Usage: node --env-file=.env.local node_modules/.bin/tsx scripts/curate-activities-wave2.ts
 */
import { db } from "@/db/client"
import { activities } from "@/db/schema"
import { eq } from "drizzle-orm"

/** slug -> ordered 1-based indices into the original Places photo set. Omitted = rejected. */
const PICKS: Record<string, number[]> = {
  // valley view from the trail leads; gazebo on the wildflower slope second
  "beattie-park": [2, 4, 1, 5],
  // only the two that unambiguously show Burton Mesa chaparral — the water shots are unverifiable
  "burton-mesa-ecological-reserve": [4, 5],
  // interior with work on the walls leads — it's a gallery, show the art
  "cypress-gallery": [3, 2, 5, 4],
  "ken-adam-park": [1, 5, 2, 4],
  // dropped the loose horses and the golf scooters
  "la-purisima-golf-course": [1, 2, 4],
  "lompoc-aquatic-center": [2, 1, 3, 4],
  // 1 and 5 are an artist's rendering of the restored theatre, not the building today
  "lompoc-theatre": [4, 2, 3],
  "miguelito-park": [1, 2, 3, 4],
  "ocean-beach-county-park": [3, 2, 5, 4],
  "point-sal": [1, 5, 2, 4],
  // 4 and 5 are a hillside trail that isn't Ryon
  "ryon-park": [3, 1, 2],
  "skydiving-lompoc": [4, 1, 2, 3],
  // dropped the watermarked sunset — it's someone else's photograph
  "surf-beach": [4, 5, 3, 1],
}

/** Corrections the photos made obvious. Merged over what the seed script wrote. */
const COPY: Record<string, { description?: string; tips?: string }> = {
  "surf-beach": {
    tips:
      "Check the current plover closure boundaries before you go; they change year to year and fines are real. Posted hours are daylight only — the gate closes at sunset. Water is cold and rip currents are strong, so this is a walking-and-watching beach far more than a swimming one. Bring a jacket even in August.",
  },
  "ken-adam-park": {
    description:
      "A neighborhood park on the north side with open turf, a playground under enormous old oaks, and enough room to actually run — the kind of park you use on a Tuesday rather than plan a trip around.\n\nIt also holds an astronaut memorial, which tells you everything about where you live: a quiet residential park, and a monument to people who went to space, ten minutes from the base that sent them.\n\nIt's quieter than Ryon and less of a drive than Miguelito, which makes it the practical choice for an after-school hour or a walk that needs to be short. It appears on almost no visitor guide to Lompoc — which is exactly why it's here.",
  },
  "ocean-beach-county-park": {
    description:
      "Where the Santa Ynez River finally meets the Pacific, the county keeps a small park most people in town have driven past without stopping. It's the last turnout before Surf Beach, and it's the better spot if what you want is quiet.\n\nA wooden boardwalk runs out over the wetland to a covered observation gazebo above the lagoon — which is the whole reason birders drive here. Herons, egrets, pelicans, and migrating shorebirds work the river mouth, with the old railroad trestle in the background and ice plant blooming across the dunes in spring.\n\nThere are picnic tables, restrooms, and a short walk down to the sand. On days when the wind is howling at Surf, it's often noticeably calmer down by the river.",
  },
  "lompoc-theatre": {
    description:
      "The Lompoc Theatre opened on H Street in 1927 — vaudeville stage, movie house, the center of a downtown night out — and then sat dark for decades while the town changed around it. The marquee still says est. 1927, and it is the most photographed thing in Old Town.\n\nThe building is still there, and a community effort has been slowly bringing it back: stabilizing the structure, restoring the facade, raising money a piece at a time toward reopening it as a working venue. The interior is raw — bare brick, exposed ceiling, scaffolding — and the group behind the restoration opens it for events often enough that standing inside it is a real possibility, not a someday.\n\nIt's one of the few genuinely historic buildings left on the street, and worth the five-minute stop on any walk through Old Town.",
    tips:
      "Interior access depends on what's scheduled — watch for open houses and fundraiser events rather than showing up expecting to get in; we list them on the events calendar as they're announced. The facade photographs best in late afternoon when the light comes down H Street.",
  },
}

async function main() {
  for (const [slug, picks] of Object.entries(PICKS)) {
    const [row] = await db
      .select({ id: activities.id, photosJson: activities.photosJson })
      .from(activities)
      .where(eq(activities.slug, slug))

    if (!row) {
      console.log(`SKIP  ${slug} — not in the database`)
      continue
    }

    const current = Array.isArray(row.photosJson) ? (row.photosJson as string[]) : []
    if (!current.length) {
      console.log(`SKIP  ${slug} — no photos to curate`)
      continue
    }

    // Rebuild the original Places order from the blob filenames so re-runs are idempotent.
    const byIndex = new Map<number, string>()
    for (const url of current) {
      const m = url.match(/g-.*-(\d+)\.jpeg/)
      if (m) byIndex.set(Number(m[1]), url)
    }

    const curated = picks.map((n) => byIndex.get(n)).filter((u): u is string => !!u)
    if (!curated.length) {
      console.log(`SKIP  ${slug} — picks matched nothing (already curated to a different set?)`)
      continue
    }

    await db
      .update(activities)
      .set({
        photosJson: curated,
        imageUrl: curated[0],
        ...(COPY[slug] ?? {}),
        updatedAt: new Date(),
      })
      .where(eq(activities.id, row.id))

    const dropped = current.length - curated.length
    console.log(
      `ok    ${slug.padEnd(32)} ${curated.length} kept, ${dropped} dropped` +
        `${COPY[slug] ? " · copy updated" : ""}`
    )
  }
}

main().then(() => process.exit(0))
