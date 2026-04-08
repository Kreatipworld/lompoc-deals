import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { stripe } from "@/lib/stripe"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.user.id)

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.ownerUserId, userId),
  })

  if (!business) {
    return NextResponse.json({ connected: false, onboardingComplete: false })
  }

  if (!business.stripeConnectAccountId) {
    return NextResponse.json({ connected: false, onboardingComplete: false })
  }

  // If already marked complete in DB, trust it
  if (business.stripeConnectOnboardingComplete) {
    return NextResponse.json({
      connected: true,
      onboardingComplete: true,
      accountId: business.stripeConnectAccountId,
    })
  }

  // Otherwise check with Stripe directly
  const account = await stripe.accounts.retrieve(business.stripeConnectAccountId)
  const onboardingComplete = account.details_submitted && account.charges_enabled

  if (onboardingComplete && !business.stripeConnectOnboardingComplete) {
    await db
      .update(businesses)
      .set({ stripeConnectOnboardingComplete: true })
      .where(eq(businesses.id, business.id))
  }

  return NextResponse.json({
    connected: true,
    onboardingComplete: !!onboardingComplete,
    accountId: business.stripeConnectAccountId,
  })
}
