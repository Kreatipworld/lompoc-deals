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

  const userId = Number(session.user.id)

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.ownerUserId, userId),
  })

  if (!business?.stripeConnectAccountId) {
    return NextResponse.json({ error: "No connected Stripe account" }, { status: 404 })
  }

  const loginLink = await stripe.accounts.createLoginLink(business.stripeConnectAccountId)

  return NextResponse.json({ url: loginLink.url })
}
