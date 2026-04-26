import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions, deals } from "@/db/schema"
import { TIERS } from "@/lib/stripe"
import { eq, and, gt, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
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
} from "lucide-react"
import { isPast } from "date-fns"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Dashboard — Lompoc Deals" }

export default async function DashboardHomePage() {
  const [session, t] = await Promise.all([auth(), getTranslations("dashboardHome")])
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

  const currentTier = sub?.tier ?? "free"
  const tierConfig = TIERS[currentTier]

  // Active deal count + total views/clicks
  let activeDealCount = 0
  let totalViews = 0
  let totalClicks = 0

  if (biz) {
    const now = new Date()
    const [countRow, statRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(deals)
        .where(and(eq(deals.businessId, biz.id), gt(deals.expiresAt, now))),
      db
        .select({
          views: sql<number>`coalesce(sum(view_count), 0)::int`,
          clicks: sql<number>`coalesce(sum(click_count), 0)::int`,
        })
        .from(deals)
        .where(eq(deals.businessId, biz.id)),
    ])
    activeDealCount = countRow[0]?.count ?? 0
    totalViews = statRow[0]?.views ?? 0
    totalClicks = statRow[0]?.clicks ?? 0
  }

  const dealLimit = tierConfig.dealLimit
  const usagePct = dealLimit === Infinity ? 0 : Math.min((activeDealCount / dealLimit) * 100, 100)
  const isAtLimit = dealLimit !== Infinity && activeDealCount >= dealLimit
  const isNearLimit = !isAtLimit && dealLimit !== Infinity && usagePct >= 75

  const isActive = sub?.status === "active" || sub?.status === "trialing"

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
        <div className="flex items-start gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("approvedBanner")}</span>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Tag className="h-5 w-5" />}
          label={t("activeDeals")}
          value={activeDealCount.toString()}
          sub={dealLimit === Infinity ? t("unlimited") : t("ofAllowed", { limit: dealLimit })}
          highlight={isAtLimit ? "danger" : isNearLimit ? "warn" : undefined}
        />
        <MetricCard
          icon={<Eye className="h-5 w-5" />}
          label={t("totalViews")}
          value={totalViews.toLocaleString()}
          sub={t("allTime")}
        />
        <MetricCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label={t("totalClicks")}
          value={totalClicks.toLocaleString()}
          sub={t("allTime")}
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
            {isActive && sub ? t("managePlan") : t("viewPlans")}
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
        <QuickAction
          href={currentTier === "free" ? "/dashboard/billing" : "/dashboard/stats"}
          icon={<BarChart3 className="h-5 w-5" />}
          title={t("viewAnalytics")}
          desc={
            currentTier === "free"
              ? t("viewAnalyticsUpgrade")
              : t("viewAnalyticsDesc")
          }
          badge={currentTier === "free" ? "Standard+" : undefined}
        />
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
          badge={!tierConfig.canListRealEstate ? "Premium" : undefined}
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
            upgradeLabel="Standard"
          />
          <PlanFeatureCard
            icon={<Share2 className="h-4 w-4" />}
            title={t("socialLinks")}
            desc={t("socialLinksDesc")}
            available={tierConfig.canShowSocialLinks}
            upgradeLabel="Standard"
          />
          <PlanFeatureCard
            icon={<Building2 className="h-4 w-4" />}
            title={t("propertyListings")}
            desc={t("propertyListingsDesc")}
            available={tierConfig.canListRealEstate}
            upgradeLabel="Premium"
          />
        </div>
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
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
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
