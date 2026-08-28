import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { syncEventbriteEvents } from "@/lib/event-sync"
import { syncVandenbergLaunches } from "@/lib/launch-sync"
import { syncExploreLompocEvents } from "@/lib/city-events-sync"

export const maxDuration = 120

export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (the Neon
  // driver goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const reports = []
  const failures = []

  // Each source syncs independently — one failing must not block the others
  for (const sync of [
    syncVandenbergLaunches,
    syncExploreLompocEvents,
    syncEventbriteEvents,
  ]) {
    try {
      reports.push(await sync())
    } catch (e) {
      failures.push(e instanceof Error ? e.message : "sync failed")
    }
  }

  const { logCronRun } = await import("@/lib/cron-log")
  await logCronRun("sync-events", { reports, failures }, failures.length === 0)
  return NextResponse.json({ ok: failures.length === 0, reports, failures })
}
