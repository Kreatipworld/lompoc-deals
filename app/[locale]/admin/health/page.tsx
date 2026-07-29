import Link from "next/link"
import { format } from "date-fns"
import { getPlatformHealth, recentOpenTickets } from "@/lib/health"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="font-display text-3xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function Attention({
  label,
  count,
  href,
  tone = "amber",
}: {
  label: string
  count: number
  href: string
  tone?: "amber" | "green"
}) {
  const ok = count === 0
  const color = ok
    ? "border-green-200 bg-green-50 text-green-800"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-blue-200 bg-blue-50 text-blue-900"
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-2xl border p-4 transition hover:brightness-[0.98] ${color}`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="font-display text-2xl font-bold tabular-nums">{ok ? "✓" : count}</span>
    </Link>
  )
}

export default async function AdminHealthPage() {
  const [h, tickets] = await Promise.all([getPlatformHealth(), recentOpenTickets(5)])

  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Platform health</h1>
        <p className="text-muted-foreground">
          One place to see what needs attention and keep Lompoc Locals healthy.
        </p>
      </header>

      {/* Needs attention */}
      <section className="space-y-3">
        <h2 className="font-semibold">Needs attention</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Attention label="Open support tickets" count={h.openTickets} href="/admin/support" />
          <Attention label="Pending business claims" count={h.pendingClaims} href="/admin/businesses" />
          <Attention label="Pending approvals" count={h.bizPending} href="/admin/businesses" />
          <Attention label="Listings missing an about" count={h.missingAbout} href="/admin/businesses" tone="green" />
          <Attention label="Listings missing photos" count={h.missingPhotos} href="/admin/businesses" tone="green" />
          <Attention label="Listings missing hours" count={h.missingHours} href="/admin/businesses" tone="green" />
        </div>
      </section>

      {/* Vitals */}
      <section className="space-y-3">
        <h2 className="font-semibold">Platform vitals</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Paying / trial members" value={h.activeMembers} />
          <Stat label="Live deals" value={h.dealsLive} />
          <Stat label="Approved businesses" value={h.bizApproved} />
          <Stat label="Digest subscribers" value={h.digestSubs} />
          <Stat label="Total users" value={h.users} />
          <Stat label="Hidden (rejected)" value={h.bizRejected} />
        </div>
      </section>

      {/* Latest tickets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Latest open tickets</h2>
          <Link href="/admin/support" className="text-sm text-primary underline-offset-4 hover:underline">
            View all →
          </Link>
        </div>
        {tickets.length === 0 ? (
          <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No open tickets — all clear.
          </p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
                <span>
                  <span className="mr-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{t.category}</span>
                  {t.subject}
                  <span className="ml-2 text-muted-foreground">· {t.businessName ?? "—"}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(t.createdAt), "MMM d")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
