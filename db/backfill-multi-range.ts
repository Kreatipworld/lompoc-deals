import { db } from "./client"
import { businesses } from "./schema"
import { eq, isNotNull, ne, or, isNull, and } from "drizzle-orm"
import { parseDayString } from "../lib/hours-normalizer"
import { DAY_KEYS, type DayHours, type Hours } from "../lib/hours"

const DRY_RUN = process.argv.includes("--dry-run")

function hasRawWithoutRanges(hours: Record<string, unknown>): boolean {
  for (const k of DAY_KEYS) {
    const v = hours[k]
    if (v && typeof v === "object") {
      const vo = v as Record<string, unknown>
      if (typeof vo.raw === "string" && !Array.isArray(vo.ranges)) return true
    }
  }
  return false
}

async function main() {
  const rows = await db
    .select({ id: businesses.id, name: businesses.name, hoursJson: businesses.hoursJson })
    .from(businesses)
    .where(
      and(
        isNotNull(businesses.hoursJson),
        or(isNull(businesses.hoursSource), ne(businesses.hoursSource, "owner"))
      )
    )

  let candidates = 0
  let updated = 0
  let rangesAdded = 0

  for (const row of rows) {
    if (!row.hoursJson || typeof row.hoursJson !== "object") continue
    const current = row.hoursJson as Record<string, unknown>
    if (!hasRawWithoutRanges(current)) continue
    candidates++

    const next: Hours = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }
    let changedThisRow = false

    for (const k of DAY_KEYS) {
      const v = current[k]
      if (v === null || v === undefined) {
        next[k] = null
        continue
      }
      if (typeof v !== "object") continue
      const vo = v as Record<string, unknown>

      if (typeof vo.open === "string" && typeof vo.close === "string") {
        next[k] = { open: vo.open, close: vo.close }
        continue
      }
      if (typeof vo.raw === "string") {
        if (Array.isArray(vo.ranges)) {
          // Already has ranges — keep as-is.
          next[k] = vo as unknown as DayHours
          continue
        }
        // Re-parse the raw string to recover structured ranges.
        const reparsed = parseDayString(vo.raw)
        if (reparsed && typeof reparsed === "object" && "raw" in reparsed && reparsed.ranges) {
          next[k] = reparsed
          rangesAdded++
          changedThisRow = true
        } else {
          // No ranges recoverable — keep raw alone.
          next[k] = { raw: vo.raw }
        }
      }
    }

    if (changedThisRow) {
      console.log(`  #${row.id} ${row.name}`)
      if (!DRY_RUN) {
        await db.update(businesses).set({ hoursJson: next }).where(eq(businesses.id, row.id))
      }
      updated++
    }
  }

  console.log("")
  console.log(`Candidates (had raw without ranges): ${candidates}`)
  console.log(`Rows updated: ${updated}${DRY_RUN ? " (dry run)" : ""}`)
  console.log(`Total raw days that gained ranges: ${rangesAdded}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
