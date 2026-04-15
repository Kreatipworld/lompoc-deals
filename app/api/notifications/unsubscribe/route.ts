import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/en", req.url))
  }

  try {
    const email = Buffer.from(token, "base64url").toString("utf-8")
    if (!email.includes("@")) throw new Error("Invalid token")

    await db
      .update(users)
      .set({ notificationEmails: false })
      .where(eq(users.email, email))

    // Redirect to account page with a success message
    return NextResponse.redirect(
      new URL("/en/account?notif=off", req.url)
    )
  } catch {
    return NextResponse.redirect(new URL("/en", req.url))
  }
}
