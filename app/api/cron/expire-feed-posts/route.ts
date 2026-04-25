import { NextResponse } from "next/server"
import { and, eq, lte } from "drizzle-orm"
import { db } from "@/db/client"
import { feedPosts } from "@/db/schema"

export async function GET(req: Request) {
  // Vercel Cron sends a Bearer token equal to CRON_SECRET
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const result = await db
    .update(feedPosts)
    .set({ status: "expired" })
    .where(and(eq(feedPosts.status, "approved"), lte(feedPosts.expiresAt, now)))
    .returning({ id: feedPosts.id })

  return NextResponse.json({ expired: result.length, at: now.toISOString() })
}
