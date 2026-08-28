import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { Resend } from "resend"
import { db } from "@/db/client"
import { blogPosts, newsLeads, businesses } from "@/db/schema"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { logCronRun } from "@/lib/cron-log"
import { isLompocLead, extractArticleText, chooseCover, slugifyTitle, topicFromSlug } from "@/lib/news-desk"
import { NEWS_TOPICS, topicTag } from "@/lib/news-topics"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * The news desk, every two days: take the freshest Lompoc/Vandenberg leads,
 * read the source article itself, write an original story from its facts
 * (nothing that isn't in the source), give it a real cover, publish, and send
 * the founder a proof of what went up. Out-of-area leads are dismissed.
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

async function writeStory(anthropic: ReturnType<typeof createAnthropic>, lead: { title: string; source: string; url: string }, text: string) {
  const system = `You are the news desk of Lompoc Locals, the local hub for Lompoc, California. Write an original local-news story in a warm, plain, neighborly voice for people who live here.
lompoc_relevant is true ONLY when the story's subject is Lompoc, Vandenberg SFB, or a Lompoc Valley person, business, school, or institution — not when Lompoc is merely the venue for another town's team or event.\nHARD RULES: Use ONLY facts present in the SOURCE TEXT. Never add numbers, dates, names, quotes, or claims that are not in it. If the source is thin, write a shorter story. No sensational framing. Positive, useful tone — what it means for Lompoc.
Do not copy sentences from the source; write it fresh. Do not mention the outlet in the body. Where natural, point readers to a Lompoc Locals surface with a relative link: /events for happenings, /news for more local news, /businesses for the directory, /biz/<slug> only if you are certain of the slug (otherwise do not link a business).
Return HTML for content_html: <p> paragraphs and one <h2>, nothing else.`
  const prompt = `LEAD TITLE: ${lead.title}\nOUTLET: ${lead.source}\n\nSOURCE TEXT:\n${text.slice(0, 9000)}`
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
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = new URL(request.url)
  const dry = url.searchParams.get("dry") === "1"
  const limit = Math.min(Number(url.searchParams.get("limit") ?? MAX_STORIES), 5)

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const leads = await db
    .select({ id: newsLeads.id, title: newsLeads.title, summary: newsLeads.summary, url: newsLeads.url, source: newsLeads.source, publishedAt: newsLeads.publishedAt })
    .from(newsLeads)
    .where(and(eq(newsLeads.status, "new"), gt(newsLeads.createdAt, sql`now() - interval '6 days'`), gt(newsLeads.publishedAt, sql`now() - interval '5 days'`)))
    .orderBy(desc(newsLeads.publishedAt))
    .limit(40)

  const recentPosts = await db
    .select({ title: blogPosts.title, imageUrl: blogPosts.imageUrl })
    .from(blogPosts)
    .where(and(eq(blogPosts.category, "local-news"), gt(blogPosts.publishedAt, sql`now() - interval '14 days'`)))
  const recentTitles = recentPosts.map((p) => p.title.toLowerCase())
  const recentCovers = recentPosts.slice(0, 6).map((p) => p.imageUrl).filter((u): u is string => !!u)

  const published: { id: number; slug: string; title: string; cover: string; source: string }[] = []
  const skipped: { lead: number; reason: string }[] = []
  const dismissed: number[] = []

  for (const lead of leads) {
    if (published.length >= limit) break
    if (!isLompocLead(lead)) { dismissed.push(lead.id); continue }
    // same story already told?
    const words = lead.title.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
    if (recentTitles.some((t) => words.filter((w) => t.includes(w)).length >= 3)) {
      skipped.push({ lead: lead.id, reason: "already covered" }); continue
    }
    let text = ""
    try {
      const res = await fetch(lead.url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20_000), cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      text = extractArticleText(await res.text())
    } catch (err) {
      skipped.push({ lead: lead.id, reason: `fetch: ${err instanceof Error ? err.message : String(err)}` }); continue
    }
    if (text.length < 500) { skipped.push({ lead: lead.id, reason: `thin source (${text.length} chars)` }); continue }

    let story
    try { story = await writeStory(anthropic, lead, text) } catch (err) { skipped.push({ lead: lead.id, reason: `model: ${err instanceof Error ? err.message : String(err)}` }); continue }
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
    const cover = chooseCover({ topic, title: story.title, text, subjectCover, recentUrls: recentCovers, seed: lead.id })
    const sourceCredit = `<p><em>Facts via <a href="${lead.url}" rel="noopener">${lead.source}</a>.${cover.credit ? " " + cover.credit : ""}</em></p>`
    const content = story.content_html + sourceCredit
    story.title = story.title.slice(0, 110); story.excerpt = story.excerpt.slice(0, 220); story.meta_description = story.meta_description.slice(0, 160)
    const slug = slugifyTitle(story.title)
    const tags = [...story.tags.slice(0, 5), topicTag(topic.slug)]

    if (dry) { published.push({ id: 0, slug, title: story.title, cover: cover.url, source: lead.source }); recentCovers.push(cover.url); continue }
    const [row] = await db.insert(blogPosts).values({
      slug, title: story.title, excerpt: story.excerpt, content, imageUrl: cover.url, category: "local-news", tags,
      status: "published", publishedAt: new Date(), authorName: "Lompoc Locals Team", metaDescription: story.meta_description,
    }).onConflictDoNothing().returning({ id: blogPosts.id })
    if (!row) { skipped.push({ lead: lead.id, reason: "slug exists" }); continue }
    await db.update(newsLeads).set({ status: "used" }).where(eq(newsLeads.id, lead.id))
    published.push({ id: row.id, slug, title: story.title, cover: cover.url, source: lead.source })
    recentTitles.push(story.title.toLowerCase()); recentCovers.push(cover.url)
  }

  if (!dry && dismissed.length) {
    await db.update(newsLeads).set({ status: "dismissed" }).where(sql`${newsLeads.id} = any(${dismissed})`)
  }
  if (!dry && published.length) {
    for (const p of ["", "/en", "/es"]) { revalidatePath(`${p}/news`); revalidatePath(`${p}/`) }
    revalidatePath("/news-sitemap.xml"); revalidatePath("/sitemap.xml")
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const rows = published.map((p) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><img src="${p.cover}" width="96" height="54" style="object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;" /><a href="${SITE}/blog/${p.slug}" style="color:#650C75;font-weight:700;text-decoration:none;">${p.title}</a><div style="font-size:12px;color:#888;">via ${p.source}</div></td></tr>`).join("")
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
