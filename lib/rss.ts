/** Tiny dependency-free RSS item parser for the news-leads harvest. */

export type FeedItem = {
  title: string
  link: string
  pubDate: Date | null
  description: string | null
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'").replace(/&#8220;|&#8221;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "").trim()
}

export function parseRssItems(xml: string): FeedItem[] {
  const items: FeedItem[] = []
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []
  for (const b of blocks) {
    const pick = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
      return m ? decode(m[1]) : null
    }
    const title = pick("title")
    const link = pick("link") ?? pick("guid")
    if (!title || !link || !/^https?:\/\//.test(link)) continue
    const pd = pick("pubDate")
    items.push({
      title: title.slice(0, 490),
      link: link.slice(0, 990),
      pubDate: pd ? new Date(pd) : null,
      description: (pick("description") ?? "").slice(0, 500) || null,
    })
  }
  return items
}
