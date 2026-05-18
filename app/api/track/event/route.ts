import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { track } from "@/lib/analytics/track"
import type { EventName } from "@/lib/analytics/events"

// Module-level sliding-window rate limit: 60 requests/min per session_id.
// In-memory only; resets on cold start. Acceptable for v1.
const WINDOW_MS = 60_000
const LIMIT = 60
const hits = new Map<string, number[]>()

function withinLimit(sid: string): boolean {
  const now = Date.now()
  const arr = (hits.get(sid) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= LIMIT) {
    hits.set(sid, arr)
    return false
  }
  arr.push(now)
  hits.set(sid, arr)
  return true
}

const ALLOWED = new Set<EventName>(["search_run", "map_pin_clicked"])

interface Body {
  name?: string
  targetType?: string
  targetId?: number
  props?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("lompoc_sid")?.value ?? null
  if (!sid || !withinLimit(sid)) return new NextResponse(null, { status: 204 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new NextResponse(null, { status: 204 })
  }
  if (!body.name || !ALLOWED.has(body.name as EventName)) {
    return new NextResponse(null, { status: 204 })
  }

  const session = await auth()
  const userIdRaw = session?.user?.id
  const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : null

  await track(body.name as EventName, {
    userId: userId && !Number.isNaN(userId) ? userId : null,
    sessionId: sid,
    targetType: body.targetType ?? null,
    targetId: body.targetId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: (body.props ?? {}) as any,
  })

  return new NextResponse(null, { status: 204 })
}
