import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "node:crypto"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

const FORWARD_TO = process.env.INBOUND_FORWARD_TO ?? "andres@kreatipdesign.com"
const FROM = "Lompoc Locals <hello@lompoclocals.com>"

/** Svix-style signature check (Resend webhooks) — no extra dependency. */
function verifySignature(secret: string, id: string, timestamp: string, body: string, signatures: string) {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")
  return signatures.split(" ").some((part) => {
    const sig = part.split(",")[1]
    if (!sig) return false
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  })
}

/** Inbound mail for hello@lompoclocals.com → forwarded to the founder's inbox.
 *  The public identity stays hello@; replies land where they're actually read. */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const body = await req.text()

  if (secret) {
    const id = req.headers.get("svix-id") ?? ""
    const timestamp = req.headers.get("svix-timestamp") ?? ""
    const signatures = req.headers.get("svix-signature") ?? ""
    // reject stale timestamps (>5 min) and bad signatures
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !verifySignature(secret, id, timestamp, body, signatures)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 })
    }
  }

  let event: { type?: string; data?: { email_id?: string } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 })
  }
  if (event.type !== "email.received" || !event.data?.email_id) {
    return NextResponse.json({ ok: true, ignored: event.type ?? "unknown" })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: "not configured" }, { status: 500 })

  // webhook payloads are metadata-only; fetch the full message
  const res = await fetch(`https://api.resend.com/emails/receiving/${event.data.email_id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    console.error("[inbound-email] fetch failed:", res.status, await res.text())
    return NextResponse.json({ error: "fetch failed" }, { status: 502 })
  }
  const mail = (await res.json()) as {
    from?: string
    to?: string[]
    subject?: string
    html?: string | null
    text?: string | null
    attachments?: Array<{ filename?: string }>
  }

  const sender = mail.from ?? "unknown sender"
  const attachmentNote = mail.attachments?.length
    ? `\n\n[${mail.attachments.length} attachment(s) — view in Resend: https://resend.com/emails/receiving]`
    : ""

  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: FORWARD_TO,
    replyTo: sender,
    subject: `[hello@] ${mail.subject ?? "(no subject)"}`,
    html: mail.html ?? undefined,
    text: `From: ${sender}\nTo: ${(mail.to ?? []).join(", ")}\n\n${mail.text ?? "(no text body)"}${attachmentNote}`,
  })
  if (error) {
    console.error("[inbound-email] forward failed:", error)
    return NextResponse.json({ error: "forward failed" }, { status: 502 })
  }
  return NextResponse.json({ forwarded: true })
}
