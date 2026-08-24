import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getMasterDigestContent, hasMasterDigestContent } from "@/lib/digest"
import { renderMasterDigestHtml } from "@/lib/email"
import { logCronRun } from "@/lib/cron-log"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Saturday preview of Monday's digest, sent to the founder inbox only.
 * The standing rule: no edition reaches subscribers without the founder
 * having seen it two days earlier. Content can shift slightly by Monday
 * (new events/deals), but this is the honest dress rehearsal.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const content = await getMasterDigestContent()
  if (!hasMasterDigestContent(content)) {
    await logCronRun("digest-preview", { sent: 0, note: "no content — Monday will skip" })
    return NextResponse.json({ sent: 0, note: "no content — Monday will skip" })
  }

  const monday = new Date()
  monday.setDate(monday.getDate() + 2)
  const html = renderMasterDigestHtml(content, "en", {
    unsubUrl: "https://www.lompoclocals.com/subscribe",
    now: monday,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const dealCount = content.deals?.length ?? 0
  const banner =
    dealCount === 0
      ? `<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-family:system-ui,sans-serif;font-size:14px;"><strong>Heads up:</strong> zero deals in this edition — nothing was posted in the last 7 days. Nudge a partner or add one before Monday.</div>`
      : ""
  const { error } = await resend.emails.send({
    from: "Lompoc Locals <hello@lompoclocals.com>",
    to: process.env.NOTIFY_EMAIL ?? "hello@lompoclocals.com",
    subject: "[PREVIEW] Monday's digest — goes out in 2 days",
    html: banner + html,
  })

  const result = { sent: error ? 0 : 1, deals: dealCount, error: error?.message ?? null }
  await logCronRun("digest-preview", result, !error)
  return NextResponse.json(result)
}
