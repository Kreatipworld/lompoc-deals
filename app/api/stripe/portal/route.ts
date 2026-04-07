import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { stripe } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.user.id)
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 })
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
