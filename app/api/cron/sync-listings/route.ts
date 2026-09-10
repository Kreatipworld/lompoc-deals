import { NextResponse } from "next/server"

// RETIRED (Sep 10 2026). The homes market is realtor-input now: agents add
// their own listings from the dashboard (Plus). The Zillow scrape and its
// daily cron are gone; scraped rows were archived.
export async function GET() {
  return NextResponse.json(
    { ok: false, retired: true, message: "Listing sync retired — homes are added by Lompoc agents at /dashboard/properties." },
    { status: 410 }
  )
}
