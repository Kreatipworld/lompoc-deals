import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { stripe } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "business") {
    return NextResponse.json({ error: "Only business accounts can connect Stripe" }, { status: 403 })
  }

  const userId = Number(session.user.id)

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.ownerUserId, userId),
  })

  if (!business) {
    return NextResponse.json({ error: "No business profile found" }, { status: 404 })
  }

  // If already onboarded, return success
  if (business.stripeConnectOnboardingComplete) {
    return NextResponse.json({ alreadyConnected: true })
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  // Reuse existing Connect account or create new one
  let connectAccountId = business.stripeConnectAccountId

  if (!connectAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: session.user.email ?? undefined,
      metadata: { businessId: String(business.id), userId: String(userId) },
    })
    connectAccountId = account.id

    await db
      .update(businesses)
      .set({ stripeConnectAccountId: connectAccountId })
      .where(eq(businesses.id, business.id))
  }

  // Generate onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: connectAccountId,
    refresh_url: `${baseUrl}/dashboard/payouts?reauth=1`,
    return_url: `${baseUrl}/dashboard/payouts?connected=1`,
    type: "account_onboarding",
  })

  return NextResponse.json({ url: accountLink.url })
}
