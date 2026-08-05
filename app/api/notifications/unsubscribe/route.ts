import { type NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * One-click "stop deal notification emails" link.
 *
 * Token format: base64url(email) + "." + HMAC(AUTH_SECRET, email) — the
 * signature half is what keeps this from being forgeable (the previous bare
 * base64url form let anyone disable any user's notifications). Signature
 * generation lives in lib/email.ts (notificationUnsubToken) — keep in sync.
 */
function signatureOk(email: string, sig: string): boolean {
  const want = crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "")
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 24)
  const a = Buffer.from(sig)
  const b = Buffer.from(want)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token || !token.includes(".")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  try {
    const [encoded, sig] = token.split(".", 2)
    const email = Buffer.from(encoded, "base64url").toString("utf-8")
    if (!email.includes("@") || !signatureOk(email, sig)) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    const [row] = await db
      .update(users)
      .set({ notificationEmails: false })
      .where(eq(users.email, email))
      .returning({ locale: users.locale })

    const locale = row?.locale === "es" ? "es" : "en"
    return NextResponse.redirect(new URL(`/${locale}/account?notif=off`, req.url))
  } catch {
    return NextResponse.redirect(new URL("/", req.url))
  }
}
