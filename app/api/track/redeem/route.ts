import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { dealEvents } from "@/db/schema"

export async function POST(request: Request) {
  try {
    const { dealId, sessionId } = await request.json()
    if (!dealId || typeof dealId !== "number") {
      return NextResponse.json({ error: "Invalid dealId" }, { status: 400 })
    }
    const session = await auth()
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null

    await db.insert(dealEvents).values({
      dealId,
      userId,
      eventType: "redeem",
      sessionId: sessionId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
