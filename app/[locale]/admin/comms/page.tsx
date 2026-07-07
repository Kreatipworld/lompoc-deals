import type { Metadata } from "next"
import { isNotNull, gt } from "drizzle-orm"
import { formatDistanceToNow } from "date-fns"
import {
  Mail,
  Megaphone,
  UserPlus,
  Download,
  Plug,
  CalendarClock,
  Users,
  Tag,
} from "lucide-react"
import { db } from "@/db/client"
import { subscribers, users, telegramSettings } from "@/db/schema"
import { sql } from "drizzle-orm"
import { getDigestDeals } from "@/lib/digest"
import { TestDigestButton } from "@/components/test-digest-button"
import { BroadcastComposer } from "@/components/broadcast-composer"

export const metadata: Metadata = { title: "Comms — Admin" }

// Admin tooling is English-only by design; the layout gates on role=admin.
export default async function AdminCommsPage() {
  const weekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const [subStats, digestDeals, recentUsers, telegram] = await Promise.all([
    db
      .select({
        confirmed: sql<number>`count(*) filter (where confirmed_at is not null)`,
        total: sql<number>`count(*)`,
      })
      .from(subscribers),
    getDigestDeals(),
    db
      .select({ name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
      .from(users)
      .where(gt(users.createdAt, weekAgo)),
    db.select({ key: telegramSettings.key }).from(telegramSettings).limit(1),
  ])
  const confirmed = Number(subStats[0].confirmed)
  const total = Number(subStats[0].total)

  const welcomeMailto = (email: string, role: string) => {
    const subject = encodeURIComponent("Welcome to Lompoc Locals!")
    const body = encodeURIComponent(
      role === "business"
        ? "Hi! I'm Andres from Lompoc Locals — saw your business join and wanted to say welcome personally. If you want a hand setting up your profile or your first deal, just reply to this email and I'll walk you through it.\n\n— Andres"
        : "Hi! I'm Andres from Lompoc Locals — just wanted to say welcome personally. The Saturday digest has the week's best local deals, and everything on the site is free for locals. If anything's confusing, just reply — I read every email.\n\n— Andres"
    )
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Communications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The digest, broadcasts, and welcoming new people — your community channels in one place.
        </p>
      </header>

      {/* ── DIGEST ── */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Saturday digest</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confirmed subscribers
            </p>
            <p className="mt-1 font-display text-3xl font-bold">{confirmed}</p>
            <p className="text-xs text-muted-foreground">{total} total signups</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Next send
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-display text-lg font-semibold">
              <CalendarClock className="h-4 w-4 text-primary" />
              Saturday, 9:00 AM
            </p>
            <p className="text-xs text-muted-foreground">Automatic (cron) · skipped if no fresh deals</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              This week&apos;s content
            </p>
            <p className="mt-1 font-display text-3xl font-bold">{digestDeals.length}</p>
            <p className="text-xs text-muted-foreground">deals from the past 7 days</p>
          </div>
        </div>

        {digestDeals.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {digestDeals.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-sm">
                <Tag className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="font-medium">{d.title}</span>
                <span className="text-muted-foreground">— {d.business.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 border-t pt-4">
          <TestDigestButton />
        </div>
      </section>

      {/* ── BROADCAST ── */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Community broadcast
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          A one-off email to every confirmed digest subscriber — festival weeks, big announcements,
          new-business welcomes. Subscribers get it in their own language.
        </p>
        <div className="mt-5">
          <BroadcastComposer confirmedCount={confirmed} />
        </div>
      </section>

      {/* ── WELCOME MONITOR ── */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">
            New people (14 days)
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          A personal welcome beats any automation at this stage — one click opens a pre-written email.
        </p>
        {recentUsers.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed bg-muted/30 px-6 py-8 text-center text-sm text-muted-foreground">
            No new signups in the last two weeks — the outreach kit in marketing/sales is the fix.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {recentUsers.map((u) => (
              <li key={u.email} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.role} · {u.email} · {formatDistanceToNow(u.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <a
                  href={welcomeMailto(u.email, u.role)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary/40"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Send welcome
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── CONNECTORS ── */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Connectors & exports</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background p-4">
            <p className="font-semibold">Telegram</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {telegram.length > 0
                ? "Connected — inbound messages land in the Telegram inbox."
                : "Not configured — POST /api/telegram/setup with a bot token to connect."}
            </p>
          </div>
          <a
            href="/api/admin/export?what=subscribers"
            className="flex items-center gap-3 rounded-2xl border bg-background p-4 transition-colors hover:bg-muted/40"
          >
            <Download className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Subscribers CSV</p>
              <p className="text-xs text-muted-foreground">Emails, language, confirmation status</p>
            </div>
          </a>
          <a
            href="/api/admin/export?what=businesses"
            className="flex items-center gap-3 rounded-2xl border bg-background p-4 transition-colors hover:bg-muted/40"
          >
            <Users className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Businesses CSV</p>
              <p className="text-xs text-muted-foreground">Contact list — feeds the outreach kit</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  )
}
