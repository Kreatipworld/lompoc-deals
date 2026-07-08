import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscribers, businesses, categories } from "@/db/schema"

export const runtime = "nodejs"

function csvField(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const what = req.nextUrl.searchParams.get("what")

  if (what === "subscribers") {
    const rows = await db
      .select({
        email: subscribers.email,
        locale: subscribers.locale,
        confirmedAt: subscribers.confirmedAt,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
    const csv = [
      "email,locale,confirmed_at,created_at",
      ...rows.map((r) =>
        [r.email, r.locale, r.confirmedAt?.toISOString() ?? "", r.createdAt.toISOString()]
          .map(csvField)
          .join(",")
      ),
    ].join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subscribers.csv"',
      },
    })
  }

  if (what === "businesses") {
    const rows = await db
      .select({
        name: businesses.name,
        category: categories.name,
        phone: businesses.phone,
        website: businesses.website,
        slug: businesses.slug,
        status: businesses.status,
      })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
    const csv = [
      "name,category,phone,website,profile_url,status",
      ...rows.map((r) =>
        [
          r.name,
          r.category ?? "",
          r.phone ?? "",
          r.website ?? "",
          `${process.env.AUTH_URL ?? "http://localhost:3000"}/biz/${r.slug}`,
          r.status,
        ]
          .map(csvField)
          .join(",")
      ),
    ].join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="businesses.csv"',
      },
    })
  }

  return NextResponse.json({ error: "Unknown export" }, { status: 400 })
}
