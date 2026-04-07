import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { stripe, TIERS, type TierKey } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "business") {
    return NextResponse.json({ error: "Only business accounts can subscribe" }, { status: 403 })
  }

  const { tier } = await request.json() as { tier: TierKey }
  if (!TIERS[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  const priceId = TIERS[tier].priceId
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured for this tier" }, { status: 503 })
  }

  const userId = Number(session.user.id)
  const userEmail = session.user.email!

  // Get or create Stripe customer
  let stripeCustomerId: string
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  if (existing?.stripeCustomerId) {
    stripeCustomerId = existing.stripeCustomerId
  } else {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId: String(userId) },
    })
    stripeCustomerId = customer.id
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?success=1`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
    metadata: { userId: String(userId), tier },
    subscription_data: {
      metadata: { userId: String(userId), tier },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
