import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { stripe, validStripeCustomerId } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "business") {
    return NextResponse.json({ error: "Only business accounts can manage billing" }, { status: 403 })
  }

  const userId = Number(session.user.id)
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  // Only a customer that exists in the current Stripe account can open the
  // portal — stale ids from before the account migration count as "no billing".
  const customerId = await validStripeCustomerId(sub?.stripeCustomerId)
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing history yet — upgrade to Growth first and your billing portal will appear here." },
      { status: 404 }
    )
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/billing`,
    })
    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    console.error("[stripe/portal] portal session create failed:", err)
    return NextResponse.json(
      { error: "We couldn't open the billing portal. Please try again in a minute." },
      { status: 502 }
    )
  }
}
