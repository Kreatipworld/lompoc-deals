import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { eq } from "drizzle-orm"
import { getDealFunnel, type FunnelWindow } from "@/lib/funnel-queries"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = parseInt(session.user.id, 10)
  const biz = await db.query.businesses.findFirst({
    where: (b) => eq(b.ownerUserId, userId),
  })
  if (!biz) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const raw = searchParams.get("window") ?? "30d"
  const window: FunnelWindow =
    raw === "7d" || raw === "all" ? raw : "30d"

  const data = await getDealFunnel(biz.id, window)
  return NextResponse.json({ window, data })
}
