import { unstable_noStore } from "next/cache"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

/**
 * GET /api/me — who is signed in, for the header's user menu.
 *
 * The header used to call auth() on the server for every page, which reads
 * cookies and turns EVERY public page into a dynamic render (no CDN cache, one
 * function invocation per visit, crawler and health check). Moving the session
 * read here lets pages be ISR again; the menu fills in after hydration.
 */
export async function GET() {
  unstable_noStore()
  const session = await auth().catch(() => null)
  const user = session?.user
  if (!user) return NextResponse.json({ user: null }, { headers: { "cache-control": "private, no-store" } })
  return NextResponse.json(
    { user: { email: user.email ?? null, role: (user as { role?: string }).role ?? "local" } },
    { headers: { "cache-control": "private, no-store" } }
  )
}
