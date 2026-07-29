import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * On-demand cache busting for out-of-app changes (DB fixes, enrichment sweeps,
 * admin scripts). Pushes a page live immediately instead of waiting for the
 * 5-minute ISR window.
 *
 *   curl "https://www.lompoclocals.com/api/revalidate?secret=SECRET&path=/biz/alfie-s-fish-chips"
 *
 * The path is the locale-less route (e.g. /biz/<slug>) — Next revalidates it
 * across locales. Secret comes from REVALIDATE_SECRET.
 */
async function handle(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret") ?? request.headers.get("x-revalidate-secret")
  const expected = process.env.REVALIDATE_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const path = searchParams.get("path")
  if (!path || !path.startsWith("/")) {
    return NextResponse.json(
      { error: "Provide ?path=/... (e.g. /biz/alfie-s-fish-chips)" },
      { status: 400 }
    )
  }

  revalidatePath(path)
  return NextResponse.json({ revalidated: true, path })
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
