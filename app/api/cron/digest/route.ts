import { NextResponse } from "next/server"
import { isNotNull } from "drizzle-orm"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sendDigestEmail } from "@/lib/email"
import { getDigestDeals } from "@/lib/digest"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const digestDeals = await getDigestDeals()

  if (digestDeals.length === 0) {
    return NextResponse.json({
      sent: 0,
      skipped: "no deals this week",
    })
  }

  // All confirmed subscribers
  const confirmedSubs = await db
    .select()
    .from(subscribers)
    .where(isNotNull(subscribers.confirmedAt))

  let sent = 0
  let failed = 0
  for (const sub of confirmedSubs) {
    const locale: "en" | "es" = sub.locale === "es" ? "es" : "en"
    const result = await sendDigestEmail(
      sub.email,
      sub.unsubscribeToken,
      digestDeals,
      locale
    )
    if (result.ok) sent++
    else failed++
  }

  return NextResponse.json({
    sent,
    failed,
    deals: digestDeals.length,
    subscribers: confirmedSubs.length,
  })
}
