import { NextResponse } from "next/server"
import { bumpClickCount } from "@/lib/tracking"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const dealId = parseInt(url.searchParams.get("dealId") ?? "0", 10)
  const to = url.searchParams.get("to") ?? "/"
  if (dealId) {
    await bumpClickCount(dealId)
  }
  // Only allow internal redirects to prevent open-redirect abuse
  const safeTo = to.startsWith("/") ? to : "/"
  return NextResponse.redirect(new URL(safeTo, url.origin))
}
