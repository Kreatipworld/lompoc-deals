import { NextResponse } from "next/server"
import { syncEventbriteEvents } from "@/lib/event-sync"

export const maxDuration = 60

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.EVENTBRITE_PRIVATE_TOKEN) {
    return NextResponse.json(
      { error: "EVENTBRITE_PRIVATE_TOKEN not configured" },
      { status: 503 }
    )
  }

  try {
    const report = await syncEventbriteEvents()
    return NextResponse.json({ ok: true, report })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Sync failed",
      },
      { status: 500 }
    )
  }
}
