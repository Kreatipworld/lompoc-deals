import { NextResponse } from "next/server"
import { revalidatePath, unstable_noStore } from "next/cache"
import { logCronRun } from "@/lib/cron-log"
import { revalidateBusinessSurfaces } from "@/lib/revalidate-business"
import { runTranslationPass, TABLE_NAMES } from "@/lib/translate-content"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Daily Spanish pass: any `_es` column that is NULL while its English twin has
 * text gets translated. Runs at 17:00 UTC so a story the news desk publishes
 * at 15:00 has Spanish the same afternoon. ?dry=1 counts only; ?limit= caps
 * rows per table; ?table= restricts to one table.
 */
export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (the Neon
  // driver goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = new URL(request.url)
  const dryRun = url.searchParams.get("dry") === "1"
  const limitPerTable = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 40) || 40, 1), 200)
  const table = url.searchParams.get("table")
  if (table && !TABLE_NAMES.includes(table)) {
    return NextResponse.json({ error: `unknown table; one of ${TABLE_NAMES.join(", ")}` }, { status: 400 })
  }

  try {
    const result = await runTranslationPass({ limitPerTable, dryRun, tables: table ? [table] : undefined })
    const translated = result.perTable.reduce((n, t) => n + t.translated, 0)

    if (!dryRun && translated > 0) {
      for (const p of ["/", "/es", "/es/deals", "/es/businesses", "/es/events", "/es/news", "/es/blog", "/es/activities", "/es/garage-sales"]) {
        revalidatePath(p)
      }
      const slugs = Array.from(new Set(result.perTable.flatMap((t) => t.slugs)))
      for (const slug of slugs) revalidateBusinessSurfaces({ slug })
    }

    const summary = {
      dryRun,
      limitPerTable,
      translated,
      perTable: result.perTable.map(({ slugs, ...t }) => ({ ...t, businesses: slugs.length || undefined })),
      sample: result.sample.slice(0, 6).map((s) => ({ ...s, en: s.en.slice(0, 120), es: s.es.slice(0, 120) })),
    }
    if (!dryRun) await logCronRun("translate-content", summary, result.perTable.every((t) => t.errors === 0))
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!dryRun) await logCronRun("translate-content", { error: message }, false)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
