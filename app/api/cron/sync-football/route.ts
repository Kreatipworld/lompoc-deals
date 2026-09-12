import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { revalidatePath } from "next/cache"
import { syncFootball } from "@/lib/football-sync"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Lompoc Football sync — both varsity schedules and results from MaxPreps,
 * facts only. Runs every morning (7:30 AM PT) and again late Friday night
 * (Saturday 06:00 UTC) so Friday scores are on /football before breakfast.
 */
export async function GET(request: Request) {
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const reports = await syncFootball()
  const ok = reports.every((r) => !r.error && r.fetched > 0)
  await logCronRun("sync-football", reports, ok)
  for (const path of ["/football", "/", "/es/football", "/es"]) {
    try { revalidatePath(path) } catch {}
  }
  return NextResponse.json({ ok, reports })
}
