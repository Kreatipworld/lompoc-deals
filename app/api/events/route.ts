import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { events } from "@/db/schema"

const VALID_CATEGORIES = [
  "community",
  "business-launch",
  "festival",
  "arts",
  "food",
  "sports",
  "market",
  "other",
] as const

export async function POST(request: Request) {
  const session = await auth()
  const userId = session?.user ? parseInt(session.user.id, 10) : null

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { title, description, location, category, startsAt, endsAt, businessId } = body

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return NextResponse.json({ error: "Title is required (min 3 chars)" }, { status: 400 })
  }

  if (!startsAt || isNaN(Date.parse(startsAt))) {
    return NextResponse.json({ error: "Valid startsAt date required" }, { status: 400 })
  }

  const cat = VALID_CATEGORIES.includes(category) ? category : "other"

  // Admins auto-approve; others are pending review
  const role = session?.user?.role
  const status = role === "admin" ? "approved" : "pending"

  await db.insert(events).values({
    title: title.trim().slice(0, 300),
    description: description ? String(description).trim().slice(0, 2000) : null,
    location: location ? String(location).trim().slice(0, 500) : null,
    category: cat,
    startsAt: new Date(startsAt),
    endsAt: endsAt && !isNaN(Date.parse(endsAt)) ? new Date(endsAt) : null,
    businessId: businessId ? Number(businessId) : null,
    submittedByUserId: userId,
    status,
  })

  return NextResponse.json({ ok: true, status })
}
