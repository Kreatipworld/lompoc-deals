import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { db } from "@/db/client"
import { emailSuppressions } from "@/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * One-click unsubscribe for outbound campaigns.
 *
 * - POST is the RFC 8058 one-click target (mail clients POST here with
 *   `List-Unsubscribe=One-Click` and no user interaction) → suppress + 200.
 * - GET is the visible footer link a person clicks → suppress + friendly page.
 *
 * The address is signed with a short HMAC token (AUTH_SECRET) so the URL can't
 * be used to unsubscribe arbitrary addresses. Suppressed addresses are skipped
 * by every campaign send forever.
 */
function expectedToken(email: string): string {
  const secret = process.env.AUTH_SECRET || ""
  return crypto
    .createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 24)
}

function tokenOk(email: string, token: string | null): boolean {
  if (!token) return false
  const want = expectedToken(email)
  const a = Buffer.from(token)
  const b = Buffer.from(want)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function suppress(email: string, source: string): Promise<void> {
  const e = email.trim().toLowerCase()
  await db
    .insert(emailSuppressions)
    .values({ email: e, reason: "unsubscribe", source })
    .onConflictDoNothing({ target: emailSuppressions.email })
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
  <body style="margin:0;background:#f2f2f4;font-family:system-ui,-apple-system,sans-serif;">
    <div style="max-width:480px;margin:60px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.06);">
      <div style="background:#F7F3E9;text-align:center;padding:22px;">
        <img src="https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com/brand/lompoc-locals-logo-color-e7Xn4oY3ho5ZOGjfvQa2fQWxO4juzD.png" alt="Lompoc Locals" width="150" height="98">
      </div>
      <div style="height:6px;background:linear-gradient(90deg,#EFC618 0%,#0B992F 55%,#650C75 100%);"></div>
      <div style="padding:30px 26px;color:#333;line-height:1.6;">
        <h1 style="font-size:20px;margin:0 0 10px;color:#1a1a1a;">${title}</h1>
        <p style="margin:0;color:#555;">${body}</p>
        <p style="margin:22px 0 0;"><a href="https://www.lompoclocals.com" style="color:#650C75;font-weight:600;text-decoration:none;">Back to lompoclocals.com</a></p>
      </div>
    </div>
  </body></html>`
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("e") || ""
  const token = searchParams.get("t")
  if (!email || !tokenOk(email, token)) {
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 })
  }
  await suppress(email, "one_click")
  return NextResponse.json({ unsubscribed: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("e") || ""
  const token = searchParams.get("t")
  if (!email || !tokenOk(email, token)) {
    return page(
      "That link didn't work",
      "This unsubscribe link is invalid or incomplete. If you'd still like to opt out, just reply to any of our emails with &ldquo;unsubscribe&rdquo; and a real person here in Lompoc will take care of it.",
      400
    )
  }
  await suppress(email, "email_link")
  return page(
    "You're unsubscribed.",
    "Done &mdash; you won't get any more outreach emails from Lompoc Locals. No hard feelings; we're just neighbors trying to help local spots get found. Your business page stays live, and you can claim it any time."
  )
}
