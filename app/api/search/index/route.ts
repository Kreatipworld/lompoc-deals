import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { buildSearchIndex } from "@/lib/search/build-index"

export const dynamic = "force-dynamic"

/**
 * The whole directory as one small JSON document, so the browser can search it
 * instantly on every keystroke (lib/search/instant.ts). Cached at the CDN for
 * ten minutes; a business save that matters shows up on the next fetch.
 */
export async function GET() {
  unstable_noStore()
  const index = await buildSearchIndex()
  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  })
}
