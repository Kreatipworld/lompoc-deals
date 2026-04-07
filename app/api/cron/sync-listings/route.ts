import { NextResponse } from "next/server"
import { syncZillowListings } from "@/lib/zillow-sync"

export const maxDuration = 300 // 5 minutes for the Apify call

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json(
      { error: "APIFY_API_TOKEN not configured" },
      { status: 503 }
    )
  }

  try {
    const report = await syncZillowListings()
    return NextResponse.json({
      ok: true,
      report,
    })
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
