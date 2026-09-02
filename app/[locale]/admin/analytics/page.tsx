import {
  localFunnel,
  businessFunnel,
  recentClaims,
  claimSummary,
  topZeroResultSearches,
  topBusinessesByInterest,
  dailyMetrics,
} from "./queries"
import { FunnelStep, Sparkline, BusinessLink } from "./components"
import { getTranslations } from "next-intl/server"
import { format } from "date-fns"

const CLAIM_STATUSES = new Set(["pending", "approved", "rejected"])

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const t = await getTranslations("adminAnalytics")
  const [local, biz, claims, claimSum, searches, topBusinesses, daily] = await Promise.all([
    localFunnel(),
    businessFunnel(),
    recentClaims(),
    claimSummary(),
    topZeroResultSearches(),
    topBusinessesByInterest(),
    dailyMetrics(),
  ])

  const localMax = Math.max(...local.map((s) => s.count), 1)
  const bizMax = Math.max(...biz.map((s) => s.count), 1)

  const claimStatus = (status: string) =>
    CLAIM_STATUSES.has(status) ? t(`status_${status}` as "status_pending") : status

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("engagedNote")}</p>
      </header>

      {/* 1. Top of funnel — Vercel link out */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-2 font-semibold">{t("topOfFunnel")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("vercelHint")}</p>
        <a
          href="https://vercel.com/kreatipworlds-projects/lompoc-deals/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          {t("openVercel")} →
        </a>
      </section>

      {/* 2. Funnels */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">{t("localFunnel")}</h2>
          {local.map((s) => (
            <FunnelStep key={s.key} label={t(`step_${s.key}` as "step_visitors")} count={s.count} maxCount={localMax} />
          ))}
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">{t("businessFunnel")}</h2>
          {biz.map((s) => (
            <FunnelStep key={s.key} label={t(`step_${s.key}` as "step_sessions")} count={s.count} maxCount={bizMax} />
          ))}
        </div>
      </section>

      {/* 3. Claims */}
      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("claims")}</h2>
          <span className="text-sm text-muted-foreground">
            {t("claimsSummary", { pending: claimSum.pending, approved: claimSum.approvedThisMonth })}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">{t("business")}</th>
                <th>{t("email")}</th>
                <th>{t("status")}</th>
                <th>{t("submitted")}</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2"><BusinessLink slug={c.businessSlug} name={c.businessName} /></td>
                  <td className="text-muted-foreground">{c.userEmail ?? "—"}</td>
                  <td>{claimStatus(c.status)}</td>
                  <td className="text-muted-foreground">{format(new Date(c.submittedAt), "MMM d, yyyy")}</td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">{t("noClaims")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Search gaps */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t("searchGaps")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("searchGapsHint")}</p>
        {searches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSearchGaps")}</p>
        ) : (
          <ul className="space-y-1">
            {searches.map((g) => (
              <li key={g.query} className="flex justify-between text-sm">
                <span>{g.query}</span>
                <span className="tabular-nums text-muted-foreground">{g.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. Top businesses */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t("topBusinesses")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">{t("business")}</th>
                <th className="text-right">{t("views30d")}</th>
                <th>{t("membership")}</th>
              </tr>
            </thead>
            <tbody>
              {topBusinesses.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="py-2"><BusinessLink slug={b.slug} name={b.name} /></td>
                  <td className="text-right tabular-nums">{b.viewCount.toLocaleString()}</td>
                  <td className="text-muted-foreground">{t(`membership_${b.membership}`)}</td>
                </tr>
              ))}
              {topBusinesses.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">{t("noTopBusinesses")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Daily metrics */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t("daily")}</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {daily.map((s) => (
            <Sparkline key={s.key} label={t(`series_${s.key}` as "series_sessions")} points={s.points} />
          ))}
        </div>
      </section>
    </div>
  )
}
