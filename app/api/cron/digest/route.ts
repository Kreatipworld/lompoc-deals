import { NextResponse } from "next/server"
import { isNotNull } from "drizzle-orm"
import { db } from "@/db/client"
import { subscribers } from "@/db/schema"
import { sendThemedDigestEmail } from "@/lib/email"
import {
  digestThemeForDate,
  getThemedDigestContent,
  themedDigestHasContent,
} from "@/lib/digest"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // This Monday's theme rotates by week of the month (events → deals →
  // things-to-do → featured partners). Fall back to events if the theme is thin.
  const theme = digestThemeForDate(new Date())
  let content = await getThemedDigestContent(theme)
  if (!themedDigestHasContent(content) && theme !== "events") {
    content = await getThemedDigestContent("events")
  }
  if (!themedDigestHasContent(content)) {
    return NextResponse.json({ sent: 0, theme, skipped: "no content this week" })
  }

  const confirmedSubs = await db
    .select()
    .from(subscribers)
    .where(isNotNull(subscribers.confirmedAt))

  let sent = 0
  let failed = 0
  for (const sub of confirmedSubs) {
    const locale: "en" | "es" = sub.locale === "es" ? "es" : "en"
    const result = await sendThemedDigestEmail(
      sub.email,
      sub.unsubscribeToken,
      content,
      locale
    )
    if (result.ok) sent++
    else failed++
  }

  return NextResponse.json({
    sent,
    failed,
    theme: content.theme,
    subscribers: confirmedSubs.length,
  })
}
