import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { bugReports } from "@/db/schema"
import { notifyPlatform } from "@/lib/email"

/**
 * POST /api/bug-report — "Report a bug" from the error page, the 404 page, or
 * the footer. No account needed: a neighbor who just hit "Something went wrong"
 * must be able to tell us in one step. The route, the error message and the
 * digest come along automatically so every report is reproducible. Saved to
 * bug_reports (admin → Bugs) and emailed to hello@ right away.
 */
export const runtime = "nodejs"

interface Body {
  description?: string
  email?: string
  route?: string
  errorMessage?: string
  digest?: string
  locale?: string
  source?: string
}

const SOURCES = new Set(["error", "not_found", "footer"])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Small in-memory limiter: a stuck page must not file 200 reports.
const recent = new Map<string, number[]>()
function withinLimit(key: string, max = 5, windowMs = 10 * 60_000): boolean {
  const now = Date.now()
  const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= max) return false
  hits.push(now)
  recent.set(key, hits)
  return true
}

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null
  const s = v.replace(/\s+/g, " ").trim()
  return s ? s.slice(0, max) : null
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : ""
  if (description.length < 5) {
    return NextResponse.json({ ok: false, error: "description_too_short" }, { status: 400 })
  }
  const email = clean(body.email, 320)
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "bad_email" }, { status: 400 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  if (!withinLimit(ip)) {
    return NextResponse.json({ ok: false, error: "too_many" }, { status: 429 })
  }

  const session = await auth().catch(() => null)
  const userIdRaw = session?.user?.id
  const userId = typeof userIdRaw === "string" && !Number.isNaN(parseInt(userIdRaw, 10)) ? parseInt(userIdRaw, 10) : null

  const source = SOURCES.has(String(body.source)) ? String(body.source) : "error"
  const route = clean(body.route, 500)
  const errorMessage = clean(body.errorMessage, 2000)
  const digest = clean(body.digest, 100)
  const locale = clean(body.locale, 5)
  const userAgent = clean(req.headers.get("user-agent"), 400)

  const [row] = await db
    .insert(bugReports)
    .values({ route, errorMessage, digest, description, email, userId, userAgent, locale, source })
    .returning({ id: bugReports.id })

  const site = process.env.AUTH_URL?.replace(/\/$/, "") ?? "https://www.lompoclocals.com"
  await notifyPlatform(`🐞 Bug report #${row.id} — ${route ?? "(no route)"}`, [
    `<strong>What they said:</strong> ${escapeHtml(description)}`,
    `<strong>Page:</strong> ${route ? `<a href="${site}${escapeHtml(route)}">${escapeHtml(route)}</a>` : "—"}`,
    `<strong>Source:</strong> ${source} · <strong>Locale:</strong> ${locale ?? "—"}`,
    errorMessage ? `<strong>Error:</strong> <code>${escapeHtml(errorMessage)}</code>${digest ? ` (digest ${escapeHtml(digest)})` : ""}` : "<strong>Error:</strong> none captured",
    `<strong>Reply to:</strong> ${email ? escapeHtml(email) : "not given"}${userId ? ` · user #${userId}` : ""}`,
    `<strong>Device:</strong> ${userAgent ? escapeHtml(userAgent) : "—"}`,
    `<a href="${site}/admin/bugs">Open in admin → Bugs</a>`,
  ])

  return NextResponse.json({ ok: true, id: row.id })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
