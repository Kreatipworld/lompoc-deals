import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { businesses } from "@/db/schema"
import { getDealFunnel, type FunnelWindow } from "@/lib/funnel-queries"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = parseInt(session.user.id, 10)
  const biz = await db.query.businesses.findFirst({
    where: (b, { eq }) => eq(b.ownerUserId, userId),
  })
  if (!biz) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const url = new URL(request.url)
  const dealIdParam = url.searchParams.get("dealId")
  const windowParam = (url.searchParams.get("window") ?? "30d") as FunnelWindow

  const validWindows: FunnelWindow[] = ["7d", "30d", "all"]
  const window = validWindows.includes(windowParam) ? windowParam : "30d"

  const rows = await getDealFunnel(biz.id, window)

  // Filter by dealId if provided
  const result = dealIdParam
    ? rows.filter((r) => r.dealId === parseInt(dealIdParam, 10))
    : rows

  return NextResponse.json({ window, data: result })
}
