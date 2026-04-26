import {
  Eye,
  MousePointerClick,
  Tag,
  TrendingUp,
  Trophy,
  BarChart3,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getMyBusiness } from "@/lib/biz-actions"
import { getDealFunnel, type FunnelWindow } from "@/lib/funnel-queries"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Stats — Lompoc Deals" }

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  const params = await searchParams
  const window: FunnelWindow =
    params.window === "7d" || params.window === "all" ? params.window : "30d"

  const [t, session] = await Promise.all([getTranslations("dashboardStats"), auth()])
  const userId = Number(session?.user?.id)
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  const currentTier = sub?.tier ?? "free"
  if (currentTier === "free") {
    return <AnalyticsUpgradeGate t={t} />
  }

  const biz = await getMyBusiness()
  const funnelRows = biz ? await getDealFunnel(biz.id, window) : []

  const totalViews = funnelRows.reduce((s, r) => s + r.views, 0)
  const totalClicks = funnelRows.reduce((s, r) => s + r.clicks, 0)
  const totalClaims = funnelRows.reduce((s, r) => s + r.claims, 0)
  const totalRedeems = funnelRows.reduce((s, r) => s + r.redeems, 0)
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0

  const bestDeal =
    funnelRows.length > 0
      ? funnelRows.reduce((best, r) => (r.views > best.views ? r : best))
      : null

  const windowLabel =
    window === "7d" ? t("window7d") : window === "30d" ? t("window30d") : t("windowAll")

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {!biz ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              href="/dashboard/profile"
              className="font-medium text-primary underline underline-offset-4"
            >
              {t("createProfile")}
            </Link>{" "}
            {t("noBusinessHint")}
          </p>
        </div>
      ) : funnelRows.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-xl font-semibold">{t("noData")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noDataHint")}
          </p>
          <Link
            href="/dashboard/deals/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("postDeal")}
          </Link>
        </div>
      ) : (
        <>
          {/* Time window selector */}
          <div className="flex gap-2">
            {(["7d", "30d", "all"] as const).map((w) => (
              <Link
                key={w}
                href={`?window=${w}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  window === w
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {w === "7d" ? t("window7d") : w === "30d" ? t("window30d") : t("windowAll")}
              </Link>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <BigStat
              icon={<Eye className="h-5 w-5" />}
              label={t("views", { window: windowLabel })}
              value={totalViews}
              trend={totalViews > 0 ? "up" : "neutral"}
              trendLabel={t("trendActive")}
            />
            <BigStat
              icon={<MousePointerClick className="h-5 w-5" />}
              label={t("clicks", { window: windowLabel })}
              value={totalClicks}
              trend={totalClicks > 0 ? "up" : "neutral"}
              trendLabel={t("trendActive")}
            />
            <BigStat
              icon={<ShoppingBag className="h-5 w-5" />}
              label={t("claims", { window: windowLabel })}
              value={totalClaims}
              trend={totalClaims > 0 ? "up" : "neutral"}
              trendLabel={t("trendActive")}
            />
            <BigStat
              icon={<CheckCircle2 className="h-5 w-5" />}
              label={t("redeems", { window: windowLabel })}
              value={totalRedeems}
              trend={totalRedeems > 0 ? "up" : "neutral"}
              trendLabel={t("trendActive")}
            />
          </div>

          <BigStat
            icon={<Tag className="h-5 w-5" />}
            label={t("ctr")}
            value={`${ctr}%`}
            trend={ctr >= 5 ? "up" : "neutral"}
            trendLabel={t("trendActive")}
          />

          {/* Best performing deal */}
          {bestDeal && bestDeal.views > 0 && (
            <div className="flex items-start gap-4 rounded-3xl border bg-gradient-to-br from-amber-50 to-card p-5 shadow-sm dark:from-amber-950/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t("bestDeal")}
                </p>
                <p className="mt-0.5 truncate font-display text-lg font-semibold">
                  {bestDeal.dealTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("bestDealStats", {
                    views: bestDeal.views.toLocaleString(),
                    clicks: bestDeal.clicks.toLocaleString(),
                    claims: bestDeal.claims.toLocaleString(),
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Funnel analytics */}
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-display text-lg font-semibold">
                {t("funnelTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("funnelSubtitle", { window: windowLabel })}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">{t("colDeal")}</th>
                    <th className="px-6 py-3 text-right">{t("colViews")}</th>
                    <th className="px-6 py-3 text-right">{t("colClicks")}</th>
                    <th className="px-6 py-3 text-right">{t("colCtr")}</th>
                    <th className="px-6 py-3 text-right">{t("colClaims")}</th>
                    <th className="px-6 py-3 text-right">{t("colClaimRate")}</th>
                    <th className="px-6 py-3 text-right">{t("colRedeems")}</th>
                    <th className="px-6 py-3 text-right">{t("colRedeemRate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {funnelRows.map((row) => (
                    <tr key={row.dealId} className="hover:bg-accent/40">
                      <td className="max-w-[200px] truncate px-6 py-3 font-medium">
                        {row.dealTitle}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {row.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {row.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">
                        {row.ctr}%
                      </td>
                      <td className="px-6 py-3 text-right">
                        {row.claims.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">
                        {row.claimRate}%
                      </td>
                      <td className="px-6 py-3 text-right">
                        {row.redeems.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">
                        {row.redeemRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BigStat({
  icon,
  label,
  value,
  trend,
  trendLabel,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  trend?: "up" | "down" | "neutral"
  trendLabel: string
}) {
  return (
    <div className="rounded-3xl border bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        {trend === "up" && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
      </div>
      <div className="mt-4 font-display text-4xl font-semibold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function AnalyticsUpgradeGate({ t }: { t: Awaited<ReturnType<typeof getTranslations<"dashboardStats">>> }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">{t("upgradeTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("upgradeBody")}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="h-4 w-4" />
            {t("upgradeStandard")}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            {t("backToOverview")}
          </Link>
        </div>
      </div>
    </div>
  )
}
