import { db } from "@/db/client"
import { newsLeads } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { format } from "date-fns"
import { NEWS_TOPICS } from "@/lib/news-topics"

export const dynamic = "force-dynamic"

/**
 * The news desk inbox: headlines harvested daily from local feeds, grouped
 * for curation. Nothing here auto-publishes — an editor turns the good ones
 * into original /news stories with source-credit links.
 */
export default async function NewsDeskPage() {
  const leads = await db
    .select()
    .from(newsLeads)
    .where(eq(newsLeads.status, "new"))
    .orderBy(desc(newsLeads.publishedAt))
    .limit(100)

  const byTopic = new Map<string, typeof leads>()
  for (const l of leads) {
    const key = l.topicGuess ?? "community"
    if (!byTopic.has(key)) byTopic.set(key, [])
    byTopic.get(key)!.push(l)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">News desk</h1>
      <p className="text-muted-foreground mb-8">
        {leads.length} fresh leads from local feeds. Raw material only — stories on /news are always
        written in our own voice with sources credited by link.
      </p>

      {leads.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          Inbox zero. The harvest runs daily at 7:00 AM.
        </p>
      ) : (
        NEWS_TOPICS.filter((t) => byTopic.has(t.slug)).map((topic) => (
          <section key={topic.slug} className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
              {topic.emoji} {topic.en}
            </h2>
            <ul className="space-y-3">
              {byTopic.get(topic.slug)!.map((l) => (
                <li key={l.id} className="rounded-xl border border-gray-100 bg-white p-4">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-900 hover:text-primary"
                  >
                    {l.title}
                  </a>
                  <div className="text-xs text-muted-foreground mt-1">
                    {l.source}
                    {l.publishedAt ? ` · ${format(l.publishedAt, "MMM d, yyyy")}` : ""}
                  </div>
                  {l.summary && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{l.summary}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
