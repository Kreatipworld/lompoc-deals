import { NextResponse } from "next/server"
import { revalidatePath, unstable_noStore } from "next/cache"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { Resend } from "resend"
import { db } from "@/db/client"
import { blogPosts, newsLeads, businesses } from "@/db/schema"
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm"
import { logCronRun } from "@/lib/cron-log"
import { isLompocLead, extractArticleText, chooseCover, slugifyTitle, topicFromSlug, type StorySource } from "@/lib/news-desk"
import { FACT_SHEET } from "@/lib/primary-sources"
import { NEWS_TOPICS, topicTag } from "@/lib/news-topics"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * The news desk, daily: take the freshest Lompoc/Vandenberg leads — primary
 * sources (official announcements, public records) first, outlets after —
 * read the source itself, write an original story from its facts (nothing
 * that isn't in the source), give it a real cover, publish, and send the
 * founder a proof of what went up. Out-of-area leads are dismissed. When an
 * outlet reports the same thing a primary source announced, the primary wins
 * and the outlet is read only for extra facts and listed as a second source.
 */

const SITE = process.env.AUTH_URL ?? "https://www.lompoclocals.com"
const MAX_STORIES = 3
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 LompocLocalsNewsDesk/1.0"

const StorySchema = z.object({
  lompoc_relevant: z.boolean().describe("true only if the story is about Lompoc, Vandenberg SFB, or the Lompoc Valley specifically"),
  confidence: z.number().describe("0 to 1: how confident you are every fact in the story appears in the source text"),
  topic: z.enum(NEWS_TOPICS.map((t) => t.slug) as [string, ...string[]]),
  title: z.string().describe("under 100 characters"),
  excerpt: z.string().describe("one or two sentences, under 200 characters"),
  meta_description: z.string().describe("under 155 characters"),
  tags: z.array(z.string()).describe("3 to 6 short lowercase tags"),
  content_html: z.string().describe("3–5 short <p> paragraphs, one <h2> subhead, plain HTML only"),
  subject_business: z.string().nullable().describe("the exact business name the story is about, if it is about one Lompoc business; else null"),
})

type SourceText = { source: StorySource; text: string }

async function writeStory(anthropic: ReturnType<typeof createAnthropic>, lead: { title: string; source: string; kind: string }, sources: SourceText[]) {
  const system = `You are the news desk of Lompoc Locals, the local hub for Lompoc, California. Write an original local-news story in a warm, plain, neighborly voice for people who live here.
lompoc_relevant is true ONLY when the story's subject is Lompoc, Vandenberg SFB, or a Lompoc Valley person, business, school, or institution — not when Lompoc is merely the venue for another town's team or event.\nHARD RULES: Use ONLY facts present in the SOURCE TEXT. Never add numbers, dates, names, quotes, or claims that are not in it. If the source is thin, write a shorter story. No sensational framing. Positive, useful tone — what it means for Lompoc.
Do not copy sentences from the source; write it fresh. Do not mention the outlet in the body. Where natural, point readers to a Lompoc Locals surface with a relative link: /events for happenings, /news for more local news, /businesses for the directory, /biz/<slug> only if you are certain of the slug (otherwise do not link a business).
Return HTML for content_html: <p> paragraphs and one <h2>, nothing else.
No judgment words in headlines or copy (no dominant, stunning, huge, amazing, crushing): report what happened and the numbers; let readers judge.`
  const [main, ...extra] = sources
  const label = lead.kind === "primary" ? "PRIMARY SOURCE (official announcement / public record)" : "OUTLET"
  const prompt = `LEAD TITLE: ${lead.title}\n${label}: ${lead.source}\n\nSOURCE TEXT:\n${main.text.slice(0, 9000)}` +
    extra.map((e) => `\n\nADDITIONAL REPORT (${e.source.name}) — use only for facts the primary source lacks:\n${e.text.slice(0, 4000)}`).join("")
  const models = ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]
  let lastErr: unknown = null
  for (const m of models) {
    try {
      const { object } = await generateObject({ model: anthropic(m), schema: StorySchema, system, prompt, temperature: 0.4 })
      return object
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("model failed")
}

export async function GET(request: Request) {
  // Crons must read the live database, never Next's fetch cache (the Neon
  // driver goes through fetch, and GET handlers cache identical fetches).
  unstable_noStore()
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = new URL(request.url)
  const dry = url.searchParams.get("dry") === "1"
  if (url.searchParams.get("debug") === "1") {
    // Which database is this function actually talking to, and what does it see?
    const host = (() => { try { return new URL(process.env.DATABASE_URL ?? "").host } catch { return "unparseable" } })()
    const res = (await db.execute(sql`select now() as db_now, (select count(*)::int from news_leads) as leads_total,
      (select count(*)::int from news_leads where status = 'new' and created_at > now() - interval '6 days' and published_at > now() - interval '5 days') as leads_fresh,
      (select count(*)::int from subscribers where confirmed_at is not null) as subscribers,
      (select max(created_at) from news_leads) as newest_lead`)) as unknown as { rows?: Record<string, unknown>[] } | Record<string, unknown>[]
    const stats = Array.isArray(res) ? res[0] : res.rows?.[0]
    return NextResponse.json({ host, ...(stats ?? {}) })
  }
  const limit = Math.min(Number(url.searchParams.get("limit") ?? MAX_STORIES), 5)

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const leads = await db
    .select({ id: newsLeads.id, title: newsLeads.title, summary: newsLeads.summary, url: newsLeads.url, source: newsLeads.source, kind: newsLeads.kind, publishedAt: newsLeads.publishedAt })
    .from(newsLeads)
    .where(and(eq(newsLeads.status, "new"), gt(newsLeads.createdAt, sql`now() - interval '6 days'`), gt(newsLeads.publishedAt, sql`now() - interval '5 days'`)))
    .orderBy(sql`case when ${newsLeads.kind} = 'primary' then 0 else 1 end`, desc(newsLeads.publishedAt))
    .limit(40)

  if (url.searchParams.get("debug") === "2") {
    return NextResponse.json({ drizzleLeads: leads.length, ids: leads.map((l) => l.id), sample: leads.slice(0, 3).map((l) => ({ id: l.id, pub: l.publishedAt, title: l.title.slice(0, 60) })) })
  }

  const recentPosts = await db
    .select({ title: blogPosts.title, imageUrl: blogPosts.imageUrl })
    .from(blogPosts)
    .where(and(eq(blogPosts.category, "local-news"), gt(blogPosts.publishedAt, sql`now() - interval '14 days'`)))
  const recentTitles = recentPosts.map((p) => p.title.toLowerCase())
  const recentCovers = recentPosts.slice(0, 6).map((p) => p.imageUrl).filter((u): u is string => !!u)

  const published: { id: number; slug: string; title: string; cover: string; source: string; sources: StorySource[] }[] = []
  const skipped: { lead: number; reason: string }[] = []
  const dismissed: number[] = []

  // Three shared long words in two titles = the same story (also the "already covered" test).
  const sameStory = (a: string, b: string) => {
    const words = a.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
    return words.filter((w) => b.toLowerCase().includes(w)).length >= 3
  }
  const primaryLeads = leads.filter((l) => l.kind === "primary")
  const asSource = (l: { source: string; url: string; kind: string }): StorySource => ({ name: l.source, url: l.url, kind: l.kind === "primary" ? "primary" : "outlet" })
  const readSource = async (l: { url: string; summary: string | null; kind: string }): Promise<string> => {
    // A primary fact sheet (scores, records) is complete in itself; everything else is read from the page.
    if (l.kind === "primary" && l.summary?.startsWith(FACT_SHEET)) return l.summary
    const res = await fetch(l.url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20_000), cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return extractArticleText(await res.text())
  }

  for (const lead of leads) {
    if (published.length >= limit) break
    if (!isLompocLead(lead)) { dismissed.push(lead.id); continue }
    if (recentTitles.some((t) => sameStory(lead.title, t))) {
      skipped.push({ lead: lead.id, reason: "already covered" }); continue
    }
    if (lead.kind !== "primary") {
      const twin = primaryLeads.find((p) => sameStory(lead.title, p.title))
      if (twin) { skipped.push({ lead: lead.id, reason: `primary source covers it (lead ${twin.id})` }); continue }
    }
    const sources: SourceText[] = []
    try {
      const text = await readSource(lead)
      sources.push({ source: asSource(lead), text })
    } catch (err) {
      skipped.push({ lead: lead.id, reason: `fetch: ${err instanceof Error ? err.message : String(err)}` }); continue
    }
    const minChars = lead.summary?.startsWith(FACT_SHEET) ? 200 : 500
    if (sources[0].text.length < minChars) { skipped.push({ lead: lead.id, reason: `thin source (${sources[0].text.length} chars)` }); continue }
    if (lead.kind === "primary") {
      // An outlet's report on the same announcement may add facts; it becomes a second source, never the first.
      const report = leads.find((l) => l.kind !== "primary" && sameStory(l.title, lead.title))
      if (report) {
        try { sources.push({ source: asSource(report), text: await readSource(report) }) } catch { /* the primary source is enough */ }
      }
    }

    let story
    try { story = await writeStory(anthropic, lead, sources) } catch (err) { skipped.push({ lead: lead.id, reason: `model: ${err instanceof Error ? err.message : String(err)}` }); continue }
    if (!story.lompoc_relevant || story.confidence < 0.75) { dismissed.push(lead.id); skipped.push({ lead: lead.id, reason: `not ours / low confidence (${story.confidence})` }); continue }

    // cover: the subject's own media first, then the real-photo pools
    let subjectCover: string | null = null
    if (story.subject_business) {
      const needle = story.subject_business.replace(/[’‘]/g, "'").toLowerCase()
      const [biz] = await db.select({ coverUrl: businesses.coverUrl }).from(businesses)
        .where(and(eq(businesses.status, "approved"), sql`lower(replace(${businesses.name}, '’', '''')) like ${needle + "%"}`)).limit(1)
      subjectCover = biz?.coverUrl ?? null
    }
    const topic = topicFromSlug(story.topic)
    const cover = chooseCover({ topic, title: story.title, text: sources[0].text, subjectCover, recentUrls: recentCovers, seed: lead.id })
    // Compact footer: "Sources: City of Lompoc, Lompoc Unified" for primary stories, "Facts via <outlet>" otherwise.
    const storySources = sources.map((s) => s.source)
    const links = storySources.map((s) => `<a href="${s.url}" rel="noopener">${s.name}</a>`).join(", ")
    const sourceCredit = `<p class="sources">${lead.kind === "primary" ? "Sources: " : "Facts via "}${links}.${cover.credit ? " " + cover.credit : ""}</p>`
    const content = story.content_html + sourceCredit
    story.title = story.title.slice(0, 110); story.excerpt = story.excerpt.slice(0, 220); story.meta_description = story.meta_description.slice(0, 160)
    const slug = slugifyTitle(story.title)
    const tags = [...story.tags.slice(0, 5), topicTag(topic.slug)]

    if (dry) { published.push({ id: 0, slug, title: story.title, cover: cover.url, source: lead.source, sources: storySources }); recentCovers.push(cover.url); recentTitles.push(story.title.toLowerCase()); continue }
    const [row] = await db.insert(blogPosts).values({
      slug, title: story.title, excerpt: story.excerpt, content, imageUrl: cover.url, category: "local-news", tags, sources: storySources,
      status: "published", publishedAt: new Date(), authorName: "Lompoc Locals Team", metaDescription: story.meta_description,
    }).onConflictDoNothing().returning({ id: blogPosts.id })
    if (!row) { skipped.push({ lead: lead.id, reason: "slug exists" }); continue }
    await db.update(newsLeads).set({ status: "used" }).where(eq(newsLeads.id, lead.id))
    published.push({ id: row.id, slug, title: story.title, cover: cover.url, source: lead.source, sources: storySources })
    recentTitles.push(story.title.toLowerCase()); recentCovers.push(cover.url)
  }

  if (!dry && dismissed.length) {
    await db.update(newsLeads).set({ status: "dismissed" }).where(inArray(newsLeads.id, dismissed))
  }
  if (!dry && published.length) {
    for (const p of ["", "/en", "/es"]) { revalidatePath(`${p}/news`); revalidatePath(`${p}/`) }
    revalidatePath("/news-sitemap.xml"); revalidatePath("/sitemap.xml")
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const rows = published.map((p) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><img src="${p.cover}" width="96" height="54" style="object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;" /><a href="${SITE}/blog/${p.slug}" style="color:#650C75;font-weight:700;text-decoration:none;">${p.title}</a><div style="font-size:12px;color:#888;">${p.sources[0]?.kind === "primary" ? "sources" : "via"}: ${p.sources.map((s) => s.name).join(", ")}</div></td></tr>`).join("")
      await resend.emails.send({
        from: "Lompoc Locals <hello@lompoclocals.com>", to: process.env.NOTIFY_EMAIL ?? "hello@lompoclocals.com",
        subject: `📰 News desk published ${published.length} stor${published.length === 1 ? "y" : "ies"}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;"><h2 style="color:#650C75;">The news desk ran</h2><p style="color:#555;">${published.length} new local stor${published.length === 1 ? "y" : "ies"} on <a href="${SITE}/news" style="color:#650C75;">lompoclocals.com/news</a> — written from the source's facts, real covers, source credited. Reply if anything needs a fix.</p><table style="border-collapse:collapse;width:100%;">${rows}</table><p style="color:#999;font-size:12px;">${skipped.length} lead(s) skipped · ${dismissed.length} dismissed as out-of-area.</p></div>`,
      })
    } catch (err) { console.error("[news-desk] proof email failed:", err) }
  }

  const summary = { dry, published, skipped, dismissed: dismissed.length, leadsConsidered: leads.length }
  if (!dry) await logCronRun("news-desk", summary, true)
  return NextResponse.json(summary)
}
