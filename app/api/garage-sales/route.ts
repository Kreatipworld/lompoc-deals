import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { garageSales } from "@/db/schema"
import { and, gte, lte, eq, desc } from "drizzle-orm"

const ITEM_CATEGORIES = [
  "furniture",
  "clothes",
  "electronics",
  "toys",
  "books",
  "kitchen",
  "tools",
  "sports",
  "antiques",
  "other",
] as const

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("filter") ?? "upcoming"

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // Weekend = next Saturday and Sunday
  const dayOfWeek = now.getDay() // 0=Sun, 6=Sat
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
  const satStart = new Date(now)
  satStart.setDate(now.getDate() + (dayOfWeek === 0 ? -1 : daysUntilSat))
  satStart.setHours(0, 0, 0, 0)
  const sunEnd = new Date(satStart)
  sunEnd.setDate(satStart.getDate() + 1)
  sunEnd.setHours(23, 59, 59, 999)

  // This week = Mon-Sun of current week
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  type Condition = ReturnType<typeof eq>
  let conditions: Condition[] = [eq(garageSales.status, "active")]

  if (filter === "today") {
    conditions = [
      eq(garageSales.status, "active"),
      lte(garageSales.startDate, todayEnd),
      gte(garageSales.endDate, todayStart),
    ]
  } else if (filter === "weekend") {
    conditions = [
      eq(garageSales.status, "active"),
      lte(garageSales.startDate, sunEnd),
      gte(garageSales.endDate, satStart),
    ]
  } else if (filter === "week") {
    conditions = [
      eq(garageSales.status, "active"),
      lte(garageSales.startDate, weekEnd),
      gte(garageSales.endDate, weekStart),
    ]
  } else {
    // upcoming: end date in the future
    conditions = [eq(garageSales.status, "active"), gte(garageSales.endDate, now)]
  }

  const sales = await db
    .select()
    .from(garageSales)
    .where(and(...conditions))
    .orderBy(desc(garageSales.startDate))
    .limit(100)

  return NextResponse.json({ sales })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to post a garage sale" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { address, description, startDate, endDate, startTime, endTime, itemCategories } = body

  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }
  if (!description || typeof description !== "string" || description.trim().length < 10) {
    return NextResponse.json({ error: "Description is required (min 10 chars)" }, { status: 400 })
  }
  if (!startDate || isNaN(Date.parse(startDate))) {
    return NextResponse.json({ error: "Valid start date required" }, { status: 400 })
  }
  if (!endDate || isNaN(Date.parse(endDate))) {
    return NextResponse.json({ error: "Valid end date required" }, { status: 400 })
  }
  if (new Date(endDate) < new Date(startDate)) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
  }

  const cats = Array.isArray(itemCategories)
    ? itemCategories.filter((c: unknown) => typeof c === "string" && ITEM_CATEGORIES.includes(c as typeof ITEM_CATEGORIES[number]))
    : null

  const userId = parseInt(session.user.id, 10)

  const [sale] = await db
    .insert(garageSales)
    .values({
      postedByUserId: userId,
      address: address.trim().slice(0, 500),
      description: description.trim().slice(0, 2000),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime: startTime ? String(startTime).slice(0, 10) : null,
      endTime: endTime ? String(endTime).slice(0, 10) : null,
      itemCategories: cats && cats.length > 0 ? cats : null,
      status: "active",
    })
    .returning()

  return NextResponse.json({ ok: true, id: sale.id })
}
