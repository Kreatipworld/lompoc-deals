import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { db } from "@/db/client"
import { businesses, subscriptions } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

/**
 * "Surprise me": send the reader to a random approved business. Members
 * (Growth/Plus, or an admin plan override) get triple weight so paying
 * partners are showcased first, but every listing can come up.
 */
export async function GET(req: Request) {
  unstable_noStore()
  const url = new URL(req.url)
  const locale = url.searchParams.get("locale") === "es" ? "es" : "en"
  try {
    const rows = await db
      .select({
        slug: businesses.slug,
        member: sql<boolean>`bool_or(
          ${businesses.planOverride} in ('standard','premium')
          or (${subscriptions.status} in ('active','trialing') and ${subscriptions.tier} in ('standard','premium'))
        )`,
      })
      .from(businesses)
      .leftJoin(subscriptions, eq(subscriptions.userId, businesses.ownerUserId))
      .where(eq(businesses.status, "approved"))
      .groupBy(businesses.id)
    const pool = rows.flatMap((r) => Array<string>(r.member ? 3 : 1).fill(r.slug))
    const slug = pool[Math.floor(Math.random() * pool.length)]
    if (!slug) return NextResponse.redirect(new URL(`/${locale}/businesses`, url.origin), 307)
    return NextResponse.redirect(new URL(`/${locale}/biz/${slug}?utm_source=site&utm_medium=surprise`, url.origin), 307)
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/businesses`, url.origin), 307)
  }
}
