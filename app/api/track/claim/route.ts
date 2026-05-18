import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { track } from "@/lib/analytics/track"

export async function POST(request: NextRequest) {
  try {
    const { dealId } = await request.json()
    if (!dealId || typeof dealId !== "number") {
      return NextResponse.json({ error: "Invalid dealId" }, { status: 400 })
    }
    const session = await auth()
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null
    const sessionId = request.cookies.get("lompoc_sid")?.value ?? null

    await track("deal_claim", {
      userId,
      sessionId,
      targetType: "deal",
      targetId: dealId,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
