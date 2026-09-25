import { unstable_noStore } from "next/cache"
import { NextResponse } from "next/server"
import { and, eq, gt, isNull } from "drizzle-orm"
import { db } from "@/db/client"
import { emailVerificationTokens, users } from "@/db/schema"

/**
 * One-click email verification for Lompoc Sales. The link in the email lands
 * here; a valid, unused, unexpired token marks the account verified and sends
 * the person back to the post form. No session needed — owning the inbox is
 * the proof.
 */
export async function GET(request: Request) {
  unstable_noStore()
  const url = new URL(request.url)
  const token = url.searchParams.get("token") ?? ""
  const base = (process.env.AUTH_URL ?? url.origin).replace(/\/$/, "")
  if (!token) return NextResponse.redirect(`${base}/sales/post?verify=invalid`, 302)

  const record = await db.query.emailVerificationTokens.findFirst({
    where: and(eq(emailVerificationTokens.token, token), gt(emailVerificationTokens.expiresAt, new Date()), isNull(emailVerificationTokens.usedAt)),
  })
  if (!record) return NextResponse.redirect(`${base}/sales/post?verify=invalid`, 302)

  const now = new Date()
  await db.update(emailVerificationTokens).set({ usedAt: now }).where(eq(emailVerificationTokens.id, record.id))
  await db.update(users).set({ emailVerified: now }).where(and(eq(users.id, record.userId), isNull(users.emailVerified)))
  const user = await db.query.users.findFirst({ where: eq(users.id, record.userId), columns: { locale: true } })
  return NextResponse.redirect(`${base}${user?.locale === "es" ? "/es" : ""}/sales/post?verify=done`, 302)
}
