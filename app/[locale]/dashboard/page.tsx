import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions, deals } from "@/db/schema"
import { TIERS } from "@/lib/stripe"
import { eq, and, gt, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { SuccessCheck } from "@/components/motion/success-check"
import { TrendChart } from "@/components/trend-chart"
import {
  CreditCard,
  Tag,
  Eye,
  MousePointerClick,
  ArrowRight,
  Zap,
  Store,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Plus,
  Building2,
  Share2,
  Lock,
  ShoppingBag,
  Trophy,
  TrendingUp,
  Compass,
} from "lucide-react"
import { isPast } from "date-fns"
import { getTranslations } from "next-intl/server"
import { getEffectiveTierForUser } from "@/lib/entitlement"
import { getDealFunnel, type FunnelWindow, type DealFunnelRow } from "@/lib/funnel-queries"
import {
  getProfileViews,
  getDealViews,
  getTrafficSources,
  getOutboundActions,
  getDailySeries,
  type TrafficSourceRow,
  type OutboundRow,
  type DailyPoint,
} from "@/lib/analytics/business-stats"

export const metadata = { title: "Dashboard" }

type HomeT = Awaited<ReturnType<typeof getTranslations<"dashboardHome">>>
type StatsT = Awaited<ReturnType<typeof getTranslations<"dashboardStats">>>

const WINDOWS: FunnelWindow[] = ["7d", "30d", "all"]

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  const params = await searchParams
  const window: FunnelWindow =
    params.window === "7d" || params.window === "all" ? params.window : "30d"

  const [session, t, ts] = await Promise.all([
    auth(),
    getTranslations("dashboardHome"),
    getTranslations("dashboardStats"),
  ])
  if (!session?.user || session.user.role !== "business") {
    redirect("/login")
  }
  const userId = Number(session.user.id)

  const [sub, biz] = await Promise.all([
    db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) }),
    db.query.businesses.findFirst({
      where: (b, { eq: e }) => e(b.ownerUserId, userId),
      columns: { id: true, name: true, status: true, gracePeriodEndsAt: true },
    }),
  ])

  const currentTier = await getEffectiveTierForUser(userId)
  const tierConfig = TIERS[currentTier]
  const showAnalytics = tierConfig.canViewAnalytics

  // Active deal count
  let activeDealCount = 0
  if (biz) {
    const now = new Date()
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(and(eq(deals.businessId, biz.id), gt(deals.expiresAt, now)))
    activeDealCount = countRow?.count ?? 0
  }

  // Analytics (paid members only) — engaged sessions, same rule as admin.
  let funnelRows: DealFunnelRow[] = []
  let profileViews = 0
  let dealViews = 0
  let sources: TrafficSourceRow[] = []
  let actions: { total: number; rows: OutboundRow[] } = { total: 0, rows: [] }
  let series: DailyPoint[] = []
  if (biz && showAnalytics) {
    ;[funnelRows, profileViews, dealViews, sources, actions, series] = await Promise.all([
      getDealFunnel(biz.id, window),
      getProfileViews(biz.id, window),
      getDealViews(biz.id, window),
      getTrafficSources(biz.id, window),
      getOutboundActions(biz.id, window),
      getDailySeries(biz.id, window),
    ])
  }
  const totalClaims = funnelRows.reduce((s, r) => s + r.claims, 0)
  const totalRedeems = funnelRows.reduce((s, r) => s + r.redeems, 0)
  const hasAnyData =
    profileViews > 0 || dealViews > 0 || actions.total > 0 || funnelRows.some((r) => r.views > 0)
  const seriesHasData = series.some((p) => p.profileViews > 0 || p.dealViews > 0)
  const bestDeal =
    funnelRows.length > 0
      ? funnelRows.reduce((best, r) => (r.views > best.views ? r : best))
      : null
  const windowLabel =
    window === "7d" ? t("window7d") : window === "30d" ? t("window30d") : t("windowAll")

  const dealLimit = tierConfig.dealLimit
  const usagePct = dealLimit === Infinity ? 0 : Math.min((activeDealCount / dealLimit) * 100, 100)
  const isAtLimit = dealLimit !== Infinity && activeDealCount >= dealLimit
  const isNearLimit = !isAtLimit && dealLimit !== Infinity && usagePct >= 75

  const isPaid = currentTier !== "free"

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {biz?.name ? t("welcomeBack", { name: biz.name }) : t("welcome")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("overview")}
        </p>
      </header>

      {/* Grace period warning */}
      {biz?.gracePeriodEndsAt && !isPast(biz.gracePeriodEndsAt) && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t("gracePeriodWarning", { date: new Date(biz.gracePeriodEndsAt).toLocaleDateString() })}
          </span>
        </div>
      )}

      {/* Business status banners */}
      {biz?.status === "pending" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("pendingWarning")}</span>
        </div>
      )}

      {biz?.status === "approved" && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <SuccessCheck size={20} strokeWidth={3.5} className="text-green-700" />
          <span>{t("approvedBanner")}</span>
        </div>
      )}

      {/* ANALYTICS — the pro dashboard. Paid members only. */}
      {showAnalytics && !biz && (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            <Link href="/dashboard/profile" className="font-medium text-primary underline underline-offset-4">
              {t("editProfile")}
            </Link>{" "}
            · {t("noBusinessYet")}
          </p>
        </div>
      )}

      {showAnalytics && biz && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">{t("analyticsHeading")}</h2>
              <p className="mt-1 max-w-xl text-xs text-muted-foreground">{t("analyticsSub")}</p>
            </div>
            <WindowPills current={window} t={t} />
          </div>

          {!hasAnyData ? (
            <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-14 text-center">
              <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">{t("noDataYet")}</p>
              <Link
                href="/dashboard/deals/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {ts("postDeal")}
              </Link>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <MetricCard
                  icon={<Eye className="h-5 w-5" />}
                  label={t("kpiVisits")}
                  value={profileViews.toLocaleString()}
                  sub={windowLabel}
                />
                <MetricCard
                  icon={<Tag className="h-5 w-5" />}
                  label={t("kpiDealViews")}
                  value={dealViews.toLocaleString()}
                  sub={windowLabel}
                />
                <MetricCard
                  icon={<MousePointerClick className="h-5 w-5" />}
                  label={t("kpiActions")}
                  value={actions.total.toLocaleString()}
                  sub={t("kpiActionsSub")}
                />
                <MetricCard
                  icon={<ShoppingBag className="h-5 w-5" />}
                  label={t("kpiClaims")}
                  value={totalClaims.toLocaleString()}
                  sub={windowLabel}
                />
                <MetricCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label={t("kpiRedeems")}
                  value={totalRedeems.toLocaleString()}
                  sub={windowLabel}
                />
              </div>

              {/* Trend */}
              {seriesHasData && (
                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                  <div className="border-b px-6 py-4">
                    <h3 className="font-display text-lg font-semibold">{t("trendTitle")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("trendSub", { window: windowLabel })}</p>
                  </div>
                  <div className="px-6 py-5">
                    <TrendChart
                      points={series}
                      labels={{ profileViews: t("seriesVisits"), dealViews: t("seriesDealViews") }}
                    />
                  </div>
                </div>
              )}

              {/* Sources + Actions */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                  <div className="border-b px-6 py-4">
                    <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                      <Compass className="h-4 w-4 text-primary" />
                      {t("sourcesTitle")}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("sourcesSub", { window: windowLabel })}</p>
                  </div>
                  {sources.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-muted-foreground">{t("sourcesEmpty")}</p>
                  ) : (
                    <ul className="divide-y">
                      {sources.map((s) => (
                        <li key={s.source} className="px-6 py-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate font-medium">
                              {t(`source_${s.source}` as "source_direct")}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {s.count.toLocaleString()} · {s.pct}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, s.pct)}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                  <div className="border-b px-6 py-4">
                    <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                      <MousePointerClick className="h-4 w-4 text-primary" />
                      {t("actionsTitle")}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("actionsSub", { window: windowLabel })}</p>
                  </div>
                  {actions.rows.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-muted-foreground">{t("actionsEmpty")}</p>
                  ) : (
                    <ul className="divide-y">
                      {actions.rows.map((r) => (
                        <li key={r.action} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                          <span className="font-medium">{t(`action_${r.action}` as "action_website_click")}</span>
                          <span className="tabular-nums text-muted-foreground">{r.count.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Best deal */}
              {bestDeal && bestDeal.views > 0 && (
                <div className="flex items-start gap-4 rounded-3xl border bg-gradient-to-br from-gold/10 to-card p-5 shadow-sm dark:from-gold/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold dark:text-gold">
                      {ts("bestDeal")}
                    </p>
                    <p className="mt-0.5 truncate font-display text-lg font-semibold">{bestDeal.dealTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ts("bestDealStats", {
                        views: bestDeal.views.toLocaleString(),
                        clicks: bestDeal.clicks.toLocaleString(),
                        claims: bestDeal.claims.toLocaleString(),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Deal funnel */}
              {funnelRows.length > 0 && <FunnelTable rows={funnelRows} windowLabel={windowLabel} ts={ts} />}
            </>
          )}
        </section>
      )}

      {/* Active deals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Tag className="h-5 w-5" />}
          label={t("activeDeals")}
          value={activeDealCount.toString()}
          sub={dealLimit === Infinity ? t("unlimited") : t("ofAllowed", { limit: dealLimit })}
          highlight={isAtLimit ? "danger" : isNearLimit ? "warn" : undefined}
        />
      </div>

      {/* Plan status card */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("currentPlan")}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold">{tierConfig.name}</span>
              <span className="text-sm text-muted-foreground">
                {tierConfig.price === 0 ? "" : `$${tierConfig.price}/mo`}
              </span>
            </div>
            {sub?.currentPeriodEnd && (
              <p className="mt-1 text-xs text-muted-foreground">
                {sub.cancelAtPeriodEnd
                  ? t("cancels", { date: sub.currentPeriodEnd.toLocaleDateString() })
                  : t("renews", { date: sub.currentPeriodEnd.toLocaleDateString() })}
              </p>
            )}
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
          >
            {isPaid ? t("managePlan") : t("viewPlans")}
          </Link>
        </div>

        {/* Deal usage bar */}
        {dealLimit !== Infinity && (
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("dealUsage")}</span>
              <span className="font-medium">
                {activeDealCount} / {dealLimit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct >= 90
                    ? "bg-destructive"
                    : usagePct >= 75
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Upgrade CTA for free tier */}
        {currentTier === "free" && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/5 px-4 py-3">
            <Zap className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("upgradeCta")}</p>
              <p className="text-xs text-muted-foreground">
                {t("upgradeBody")}
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t("upgrade")}
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickAction
          href="/dashboard/deals/new"
          icon={<Plus className="h-5 w-5" />}
          title={t("postDeal")}
          desc={t("postDealDesc")}
          disabled={isAtLimit}
          disabledHint={t("dealLimitReached")}
        />
        <QuickAction
          href="/dashboard/deals"
          icon={<Tag className="h-5 w-5" />}
          title={t("manageDeals")}
          desc={t("manageDealsDesc")}
        />
        {currentTier === "free" && (
          <QuickAction
            href="/dashboard/billing"
            icon={<BarChart3 className="h-5 w-5" />}
            title={t("viewAnalytics")}
            desc={t("viewAnalyticsUpgrade")}
            badge="Growth+"
          />
        )}
        <QuickAction
          href="/dashboard/profile"
          icon={<Store className="h-5 w-5" />}
          title={t("editProfile")}
          desc={t("editProfileDesc")}
        />
        {/* Properties — Premium feature */}
        <QuickAction
          href={tierConfig.canListRealEstate ? "/dashboard/properties" : "/dashboard/billing"}
          icon={<Building2 className="h-5 w-5" />}
          title={t("manageProperties")}
          desc={
            tierConfig.canListRealEstate
              ? t("managePropertiesDesc")
              : t("managePropertiesUpgrade")
          }
          badge={!tierConfig.canListRealEstate ? "Plus" : undefined}
        />
      </div>

      {/* Plan features */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("planFeatures")}</h2>
          {currentTier !== "premium" && (
            <Link
              href="/dashboard/billing"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("upgrade")}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PlanFeatureCard
            icon={<BarChart3 className="h-4 w-4" />}
            title={t("analytics")}
            desc={t("analyticsDesc")}
            available={tierConfig.canViewAnalytics}
            upgradeLabel="Growth"
          />
          <PlanFeatureCard
            icon={<Share2 className="h-4 w-4" />}
            title={t("socialLinks")}
            desc={t("socialLinksDesc")}
            available={tierConfig.canShowSocialLinks}
            upgradeLabel="Growth"
          />
          <PlanFeatureCard
            icon={<Building2 className="h-4 w-4" />}
            title={t("propertyListings")}
            desc={t("propertyListingsDesc")}
            available={tierConfig.canListRealEstate}
            upgradeLabel="Plus"
          />
        </div>
      </div>
    </div>
  )
}

function WindowPills({ current, t }: { current: FunnelWindow; t: HomeT }) {
  const label = (w: FunnelWindow) =>
    w === "7d" ? t("window7d") : w === "30d" ? t("window30d") : t("windowAll")
  return (
    <div className="flex gap-2">
      {WINDOWS.map((w) => (
        <Link
          key={w}
          href={`/dashboard?window=${w}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            current === w
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {label(w)}
        </Link>
      ))}
    </div>
  )
}

function FunnelTable({ rows, windowLabel, ts }: { rows: DealFunnelRow[]; windowLabel: string; ts: StatsT }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="font-display text-lg font-semibold">{ts("funnelTitle")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{ts("funnelSubtitle", { window: windowLabel })}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3">{ts("colDeal")}</th>
              <th className="px-6 py-3 text-right">{ts("colViews")}</th>
              <th className="px-6 py-3 text-right">{ts("colClicks")}</th>
              <th className="px-6 py-3 text-right">{ts("colCtr")}</th>
              <th className="px-6 py-3 text-right">{ts("colClaims")}</th>
              <th className="px-6 py-3 text-right">{ts("colClaimRate")}</th>
              <th className="px-6 py-3 text-right">{ts("colRedeems")}</th>
              <th className="px-6 py-3 text-right">{ts("colRedeemRate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.dealId} className="hover:bg-accent/40">
                <td className="max-w-[200px] truncate px-6 py-3 font-medium">{row.dealTitle}</td>
                <td className="px-6 py-3 text-right">{row.views.toLocaleString()}</td>
                <td className="px-6 py-3 text-right">{row.clicks.toLocaleString()}</td>
                <td className="px-6 py-3 text-right text-muted-foreground">{row.ctr}%</td>
                <td className="px-6 py-3 text-right">{row.claims.toLocaleString()}</td>
                <td className="px-6 py-3 text-right text-muted-foreground">{row.claimRate}%</td>
                <td className="px-6 py-3 text-right">{row.redeems.toLocaleString()}</td>
                <td className="px-6 py-3 text-right text-muted-foreground">{row.redeemRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  highlight?: "danger" | "warn"
}) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm ${
        highlight === "danger"
          ? "border-destructive/30 bg-destructive/5"
          : highlight === "warn"
          ? "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/10"
          : "bg-card"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

function PlanFeatureCard({
  icon,
  title,
  desc,
  available,
  upgradeLabel,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  available: boolean
  upgradeLabel: string
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        available ? "bg-card" : "bg-muted/20 opacity-70"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {available ? icon : <Lock className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {!available && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {upgradeLabel}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      {available && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      )}
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  desc,
  badge,
  disabled,
  disabledHint,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  badge?: string
  disabled?: boolean
  disabledHint?: string
}) {
  if (disabled) {
    return (
      <div className="flex items-start gap-4 rounded-3xl border border-dashed bg-muted/20 p-5 opacity-60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{disabledHint ?? desc}</p>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-3xl border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:bg-accent/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}
