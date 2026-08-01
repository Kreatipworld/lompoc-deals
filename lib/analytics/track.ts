import { cookies } from "next/headers"
import { db } from "@/db/client"
import { analyticsEvents } from "@/db/schema"
import { and, eq, gt, isNull, sql } from "drizzle-orm"
import type { EventName, EventPropsFor } from "./events"
import { CAMPAIGN_COOKIE, decodeCampaign } from "./campaign"

interface TrackArgs<N extends EventName> {
  userId?: number | null
  sessionId?: string | null
  targetType?: string | null
  targetId?: number | null
  props?: EventPropsFor<N>
}

/**
 * How the visitor first arrived, read from the cookie middleware wrote.
 *
 * Attached here rather than at each call site so all sixteen event types are attributable without
 * sixteen edits — and so a new event added later gets attribution for free instead of being
 * silently unattributed. Explicit props win, since a caller that already knows its campaign is
 * more specific than the cookie.
 */
function campaignProps(): Record<string, string> {
  try {
    const c = decodeCampaign(cookies().get(CAMPAIGN_COOKIE)?.value)
    if (!c) return {}
    return Object.fromEntries(
      Object.entries({ src: c.src, med: c.med, cmp: c.cmp, con: c.con, camp_at: c.at }).filter(
        (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0
      )
    )
  } catch {
    // cookies() throws outside a request scope (cron, scripts) — those events simply carry none.
    return {}
  }
}

/** Fire-and-forget insert into the analytics_events table. Never throws. */
export async function track<N extends EventName>(name: N, args: TrackArgs<N> = {}): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      eventName: name,
      userId: args.userId ?? null,
      sessionId: args.sessionId ?? null,
      targetType: args.targetType ?? null,
      targetId: args.targetId ?? null,
      props: { ...campaignProps(), ...(args.props ?? {}) } as never,
    })
  } catch {
    // best-effort
  }
}

/** Attach a freshly-created user_id to all anonymous events from the same session in the last 30 days. */
export async function stitchSession(sessionId: string, userId: number): Promise<void> {
  if (!sessionId || !userId) return
  try {
    await db
      .update(analyticsEvents)
      .set({ userId })
      .where(
        and(
          eq(analyticsEvents.sessionId, sessionId),
          isNull(analyticsEvents.userId),
          gt(analyticsEvents.createdAt, sql`now() - interval '30 days'`)
        )
      )
  } catch {
    // best-effort
  }
}
