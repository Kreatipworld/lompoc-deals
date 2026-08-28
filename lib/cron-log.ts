import { neon } from "@neondatabase/serverless"
import { db } from "@/db/client"
import { cronRuns } from "@/db/schema"

/**
 * Record a scheduled-job execution so admins can follow up on stats.
 * Fire-and-forget — never throws into the cron handler.
 */
export async function logCronRun(
  name: string,
  result: unknown,
  ok = true
): Promise<void> {
  try {
    await db.insert(cronRuns).values({ name, ok, result: result as object })
  } catch (err) {
    console.error("[cron-log] failed to record run:", err)
  }
}

export type CronRunSummary = {
  name: string
  lastRunAt: Date | null
  lastOk: boolean | null
  lastResult: Record<string, unknown> | null
  runs30d: number
}

/** Last run + 30-day run count per cron name, for the admin automation page. */
export async function getCronRunSummary(): Promise<Record<string, CronRunSummary>> {
  const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: "no-store" } })
  const [last, counts] = await Promise.all([
    sql`SELECT DISTINCT ON (name) name, created_at, ok, result
        FROM cron_runs ORDER BY name, created_at DESC`,
    sql`SELECT name, COUNT(*)::int AS n FROM cron_runs
        WHERE created_at > now() - interval '30 days' GROUP BY name`,
  ])
  const countMap = new Map<string, number>(counts.map((r) => [r.name as string, r.n as number]))
  const out: Record<string, CronRunSummary> = {}
  for (const r of last) {
    const name = r.name as string
    out[name] = {
      name,
      lastRunAt: r.created_at ? new Date(r.created_at as string) : null,
      lastOk: r.ok as boolean,
      lastResult: (r.result as Record<string, unknown>) ?? null,
      runs30d: countMap.get(name) ?? 0,
    }
  }
  return out
}
