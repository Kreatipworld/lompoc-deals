import { db } from "./client"
import { businesses } from "./schema"
import { eq, isNotNull, ne, or, isNull, and } from "drizzle-orm"
import { normalizeGoogleHours } from "../lib/hours-normalizer"
import type { Hours } from "../lib/hours"

const DRY_RUN = process.argv.includes("--dry-run")

function isAlreadyCanonical(hoursJson: unknown): boolean {
  if (!hoursJson || typeof hoursJson !== "object") return false
  const obj = hoursJson as Record<string, unknown>
  return typeof obj.mon === "object" || typeof obj.tue === "object" || typeof obj.wed === "object"
}

function isLongKeyString(hoursJson: unknown): boolean {
  if (!hoursJson || typeof hoursJson !== "object") return false
  const obj = hoursJson as Record<string, unknown>
  return typeof obj.monday === "string" || typeof obj.tuesday === "string" || typeof obj.sunday === "string"
}

async function main() {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      hoursJson: businesses.hoursJson,
      hoursSource: businesses.hoursSource,
    })
    .from(businesses)
    .where(
      and(
        isNotNull(businesses.hoursJson),
        or(isNull(businesses.hoursSource), ne(businesses.hoursSource, "owner"))
      )
    )

  console.log(`Found ${rows.length} candidate rows${DRY_RUN ? " (dry run)" : ""}`)

  let converted = 0
  let alreadyCanonical = 0
  let skipped = 0
  const now = new Date()

  for (const row of rows) {
    if (isAlreadyCanonical(row.hoursJson)) {
      if (!DRY_RUN) {
        await db
          .update(businesses)
          .set({ hoursSource: "google", hoursSyncedAt: now })
          .where(eq(businesses.id, row.id))
      }
      alreadyCanonical++
      continue
    }

    if (isLongKeyString(row.hoursJson)) {
      const normalized: Hours = normalizeGoogleHours(row.hoursJson)
      console.log(`  #${row.id} ${row.name}`)
      if (!DRY_RUN) {
        await db
          .update(businesses)
          .set({ hoursJson: normalized, hoursSource: "google", hoursSyncedAt: now })
          .where(eq(businesses.id, row.id))
      }
      converted++
      continue
    }

    console.log(`  SKIP #${row.id} ${row.name} — unrecognized shape`)
    skipped++
  }

  console.log("")
  console.log(`Converted:        ${converted}`)
  console.log(`Already canonical: ${alreadyCanonical}`)
  console.log(`Skipped:          ${skipped}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
