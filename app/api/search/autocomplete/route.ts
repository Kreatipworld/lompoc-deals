import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/client"
import { businesses, deals, categories } from "@/db/schema"
import { and, eq, gt, ilike, or, sql } from "drizzle-orm"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ businesses: [], deals: [] })
  }

  const term = `%${q}%`

  const [bizRows, dealRows] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        logoUrl: businesses.logoUrl,
        categoryName: categories.name,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .where(and(eq(businesses.status, "approved"), ilike(businesses.name, term)))
      .limit(6),

    db
      .select({
        id: deals.id,
        title: deals.title,
        discountText: deals.discountText,
        bizId: businesses.id,
        bizName: businesses.name,
        bizSlug: businesses.slug,
      })
      .from(deals)
      .innerJoin(businesses, eq(deals.businessId, businesses.id))
      .where(
        and(
          eq(businesses.status, "approved"),
          gt(deals.expiresAt, sql`now()`),
          or(ilike(deals.title, term), ilike(businesses.name, term))
        )
      )
      .limit(5),
  ])

  return NextResponse.json({ businesses: bizRows, deals: dealRows })
}
