import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { garageSales } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const [sale] = await db
    .select()
    .from(garageSales)
    .where(and(eq(garageSales.id, id), eq(garageSales.status, "active")))
    .limit(1)

  if (!sale) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ sale })
}
