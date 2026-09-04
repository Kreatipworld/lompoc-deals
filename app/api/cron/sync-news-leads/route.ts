import { NextResponse } from "next/server"
import { unstable_noStore } from "next/cache"
import { db } from "@/db/client"
import { newsLeads } from "@/db/schema"
import { deriveTopic } from "@/lib/news-topics"
import { logCronRun } from "@/lib/cron-log"
import { parseRssItems } from "@/lib/rss"

export const dynamic = "force-dynamic"
export const maxDuration = 180

/**
 * Daily harvest of local headlines for the news desk. One request per feed
 * per day — friendly to every rate limit on earth. Leads are raw material:
 * nothing here is ever published directly (we write originals from facts,
 * crediting sources by link), so this stays copyright-safe by design.
 */

const FEEDS: { source: string; url: string; needsKeyword: boolean }[] = [
  // Town paper: everything is local by definition.
  { source: "Lompoc Record", url: "https://lompocrecord.com/search/?f=rss&t=article&c=news/local&l=25", needsKeyword: false },
  // Regional outlets with Lompoc-specific sections/tags — already ours, no keyword needed.
  { source: "KSBY", url: "https://www.ksby.com/lompoc-valley.rss", needsKeyword: false },
  { source: "KEYT", url: "https://keyt.com/tag/lompoc/feed/", needsKeyword: false },
  { source: "KEYT", url: "https://keyt.com/category/vandenberg-space-base/feed/", needsKeyword: false },
  { source: "Santa Maria Times", url: "https://santamariatimes.com/search/?f=rss&t=article&q=lompoc&l=25", needsKeyword: true },
  { source: "Edhat", url: "https://www.edhat.com/tag/lompoc/feed/", needsKeyword: false },
  // General regional feeds: keep only Lompoc/Vandenberg items.
  { source: "Noozhawk", url: "https://www.noozhawk.com/feed/", needsKeyword: true },
  { source: "SB Independent", url: "https://www.independent.com/feed/", needsKeyword: true },
]

const KEYWORDS = /lompoc|vandenberg|la purisima|jalama|mission hills|vsfb/i


export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (the Neon
  // driver goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const reports: { source: string; parsed?: number; found: number; inserted: number; error?: string }[] = []
  for (const feed of FEEDS) {
    try {
      const get = () => fetch(feed.url, {
        headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 LompocLocalsNewsDesk/1.0" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      })
      let res = await get()
      // Publishers throttle bursts from datacenter IPs (Lee Enterprises 429s the
      // Record feed most mornings). Back off up to three times with growing waits.
      for (const waitMs of [6000, 15000, 30000]) {
        if (res.status !== 429 && res.status < 500) break
        await new Promise((r) => setTimeout(r, waitMs))
        res = await get()
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const items = parseRssItems(await res.text())
      const local = feed.needsKeyword
        ? items.filter((i) => KEYWORDS.test(`${i.title} ${i.description ?? ""}`))
        : items
      let inserted = 0
      for (const item of local.slice(0, 25)) {
        const topic = deriveTopic([], `${item.title} ${item.description ?? ""}`)
        const r = await db
          .insert(newsLeads)
          .values({
            title: item.title,
            url: item.link,
            source: feed.source,
            summary: item.description,
            topicGuess: topic.slug,
            publishedAt: item.pubDate && !isNaN(item.pubDate.getTime()) ? item.pubDate : null,
          })
          .onConflictDoNothing({ target: newsLeads.url })
          .returning({ id: newsLeads.id })
        if (r.length) inserted++
      }
      reports.push({ source: feed.source, parsed: items.length, found: local.length, inserted })
    } catch (err) {
      reports.push({ source: feed.source, found: 0, inserted: 0, error: err instanceof Error ? err.message : String(err) })
    }
  }

  const summary = { reports, inserted: reports.reduce((n, r) => n + r.inserted, 0) }
  await logCronRun("sync-news-leads", summary, reports.every((r) => !r.error))
  return NextResponse.json(summary)
}
