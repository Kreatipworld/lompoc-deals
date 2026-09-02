import { db } from "@/db/client"
import { sql } from "drizzle-orm"

/**
 * "Engaged session" = a session that produced 2+ analytics events in the window.
 *
 * Raw session and page-view counts are dominated by search crawlers (spike days
 * of 1,800–2,300 one-page sessions vs. quiet days of 40–90). A crawler fetches a
 * page and leaves; a person clicks on. Every admin surface that talks about
 * traffic reads this number, never raw counts — see project_honest_numbers.
 */

function rows<T>(r: unknown): T[] {
  return Array.isArray(r) ? (r as T[]) : ((r as { rows: T[] }).rows ?? [])
}

export interface SessionCounts {
  total: number
  engaged: number
}

export async function sessionCounts(days: number): Promise<SessionCounts> {
  const r = rows<{ total: number; engaged: number }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE c > 1)::int AS engaged
      FROM (
        SELECT session_id, COUNT(*) AS c
        FROM analytics_events
        WHERE session_id IS NOT NULL
          AND created_at > now() - make_interval(days => ${days})
        GROUP BY 1
      ) s`)
  )
  return { total: Number(r[0]?.total ?? 0), engaged: Number(r[0]?.engaged ?? 0) }
}

/** Engaged sessions per ISO week (key = Monday as YYYY-MM-DD). */
export async function engagedSessionsByWeek(weeks: number): Promise<Map<string, number>> {
  const r = rows<{ week: string; c: number }>(
    await db.execute(sql`
      SELECT date_trunc('week', first_seen)::date::text AS week, COUNT(*)::int AS c
      FROM (
        SELECT session_id, MIN(created_at) AS first_seen, COUNT(*) AS c
        FROM analytics_events
        WHERE session_id IS NOT NULL
          AND created_at > now() - make_interval(weeks => ${weeks})
        GROUP BY 1 HAVING COUNT(*) > 1
      ) s
      GROUP BY 1`)
  )
  return new Map(r.map((x) => [x.week.slice(0, 10), Number(x.c)]))
}

/** Engaged sessions per day for the last N days, oldest first, missing days = 0. */
export async function engagedSessionsByDay(days: number): Promise<number[]> {
  const r = rows<{ day: string; c: number }>(
    await db.execute(sql`
      WITH series AS (
        SELECT generate_series(
          date_trunc('day', now() - make_interval(days => ${days - 1})),
          date_trunc('day', now()), '1 day')::date AS day
      ),
      sessions AS (
        SELECT session_id, MIN(created_at)::date AS day
        FROM analytics_events
        WHERE session_id IS NOT NULL
          AND created_at > now() - make_interval(days => ${days})
        GROUP BY 1 HAVING COUNT(*) > 1
      ),
      counts AS (SELECT day, COUNT(*)::int AS c FROM sessions GROUP BY 1)
      SELECT s.day::text AS day, COALESCE(c.c, 0)::int AS c
      FROM series s LEFT JOIN counts c ON c.day = s.day
      ORDER BY s.day`)
  )
  return r.map((x) => Number(x.c))
}

/**
 * SQL fragment: the set of engaged session ids in the last N days. Join against
 * it to restrict per-target view counts to people rather than crawlers.
 */
export function engagedSessionIds(days: number) {
  return sql`(
    SELECT session_id FROM analytics_events
    WHERE session_id IS NOT NULL
      AND created_at > now() - make_interval(days => ${days})
    GROUP BY 1 HAVING COUNT(*) > 1
  )`
}
