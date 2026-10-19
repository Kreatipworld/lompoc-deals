import { unstable_noStore as noStore } from "next/cache"
import { Link } from "@/i18n/navigation"
import {
  getConversionFunnel,
  getConversionsBySource,
  getPayingSnapshot,
  windowDays,
  type FunnelWindow,
  type SourceRow,
} from "@/lib/analytics/conversions"

export const dynamic = "force-dynamic"

const WINDOWS: { key: FunnelWindow; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
]

function pct(n: number, d: number): string {
  if (!d) return "—"
  return `${((n / d) * 100).toFixed(1)}%`
}

export default async function ConversionsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  noStore()
  const sp = await searchParams
  const win: FunnelWindow = sp.window === "7d" || sp.window === "all" ? sp.window : "30d"
  const days = windowDays(win)

  const [funnel, bySource, snap] = await Promise.all([
    getConversionFunnel(days).catch(() => ({ visitors: 0, offerViews: 0, signups: 0, paid: 0 })),
    getConversionsBySource(days).catch(() => [] as SourceRow[]),
    getPayingSnapshot().catch(() => ({ paying: 0, mrr: 0 })),
  ])

  const steps: { label: string; value: number; rateFrom: number | null; hint: string }[] = [
    { label: "Visitors (engaged)", value: funnel.visitors, rateFrom: null, hint: "sessions with 2+ events" },
    { label: "Saw a business offer", value: funnel.offerViews, rateFrom: funnel.visitors, hint: "/for-businesses or /partners" },
    { label: "Signed up / claimed", value: funnel.signups, rateFrom: funnel.offerViews, hint: "business signup + claim" },
    { label: "Became paid members", value: funnel.paid, rateFrom: funnel.signups, hint: "paid_upgrade events" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Conversions</h1>
          <p className="text-sm text-muted-foreground">
            How visitors move from the site to paying members — and which source drives them.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {WINDOWS.map((w) => (
            <Link
              key={w.key}
              href={`/admin/conversions?window=${w.key}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                w.key === win ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {w.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Funnel steps */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{s.value.toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {s.rateFrom != null ? (
                <span className="font-semibold text-foreground">{pct(s.value, s.rateFrom)}</span>
              ) : null}
              {s.rateFrom != null ? " of previous · " : ""}
              {s.hint}
            </div>
          </div>
        ))}
      </section>

      <div className="rounded-xl border bg-muted/30 p-4 text-sm">
        <span className="font-semibold">Visitor → paid: {pct(funnel.paid, funnel.visitors)}</span>
        <span className="text-muted-foreground">
          {" · "}
          {snap.paying} paying members live · ${snap.mrr.toFixed(2)} MRR
        </span>
      </div>

      {/* By source */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">By traffic source (first-touch)</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 text-right font-medium">Sessions</th>
                <th className="px-4 py-2 text-right font-medium">Signups</th>
                <th className="px-4 py-2 text-right font-medium">Paid</th>
                <th className="px-4 py-2 text-right font-medium">Signup rate</th>
                <th className="px-4 py-2 text-right font-medium">Paid rate</th>
              </tr>
            </thead>
            <tbody>
              {bySource.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No engaged sessions in this window yet.
                  </td>
                </tr>
              ) : (
                bySource.map((r) => {
                  const isAd = r.src === "meta" || r.src === "facebook"
                  return (
                    <tr key={r.src} className={`border-b last:border-0 ${isAd ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-2 font-medium">
                        {r.src}
                        {isAd ? (
                          <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            ad
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.sessions.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.signups}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.paid}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{pct(r.signups, r.sessions)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{pct(r.paid, r.sessions)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          First-touch attribution via UTM (90-day cookie). Meta ad traffic appears as <code>meta</code> once the campaign
          delivers. Engaged sessions only (2+ events).
        </p>
      </section>
    </div>
  )
}
