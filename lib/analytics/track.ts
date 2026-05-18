import { db } from "@/db/client"
import { analyticsEvents } from "@/db/schema"
import { and, eq, gt, isNull, sql } from "drizzle-orm"
import type { EventName, EventPropsFor } from "./events"

interface TrackArgs<N extends EventName> {
  userId?: number | null
  sessionId?: string | null
  targetType?: string | null
  targetId?: number | null
  props?: EventPropsFor<N>
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
      props: (args.props ?? {}) as never,
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
