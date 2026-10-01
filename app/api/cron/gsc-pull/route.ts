import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { gscConfigured, pullGscDays } from "@/lib/gsc"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Daily 11:00 UTC (4 AM PT, after Google's nightly refresh): pull the last
 * 4 days of Search Console rows (date × query × page) into gsc_daily. GSC lags
 * ~2 days, so re-fetching a short window and upserting keeps every day final.
 * Without a credential this is a quiet 200 {skipped} — nothing is logged.
 * docs/superpowers/specs/2026-09-30-keyword-positions-design.md
 */
export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (the Neon
  // driver goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!gscConfigured()) {
    return NextResponse.json({ skipped: "no credential", need: ["GSC_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"] })
  }

  const started = Date.now()
  try {
    const result = await pullGscDays(4)
    const summary = { ...result, ms: Date.now() - started }
    await logCronRun("gsc-pull", summary, true)
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[gsc-pull] failed:", message)
    await logCronRun("gsc-pull", { error: message.slice(0, 500), ms: Date.now() - started }, false)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
