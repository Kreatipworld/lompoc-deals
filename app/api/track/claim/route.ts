import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { dealEvents } from "@/db/schema"
import { track } from "@/lib/analytics/track"

export async function POST(request: NextRequest) {
  try {
    const { dealId, sessionId, businessId } = await request.json()
    if (!dealId || typeof dealId !== "number") {
      return NextResponse.json({ error: "Invalid dealId" }, { status: 400 })
    }
    const session = await auth()
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null

    await db.insert(dealEvents).values({
      dealId,
      userId,
      eventType: "claim",
      sessionId: sessionId ?? null,
    })

    // Emit analytics event for the claim submission
    await track("business_claim_submitted", {
      userId,
      sessionId: request.cookies.get("lompoc_sid")?.value ?? null,
      targetType: "business",
      targetId: typeof businessId === "number" ? businessId : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
