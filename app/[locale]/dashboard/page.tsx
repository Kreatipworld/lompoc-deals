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

export const metadata = { title: "Dashboard — Lompoc Deals" }

export default async function DashboardHomePage() {
  const session = await auth()
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
          {biz?.name ? `Welcome back, ${biz.name}` : "Welcome"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your business on Lompoc Deals.
        </p>
      </header>

      {/* Grace period warning */}
      {biz?.gracePeriodEndsAt && !isPast(biz.gracePeriodEndsAt) && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Payment failed. Your plan features remain active until{" "}
            <strong>{new Date(biz.gracePeriodEndsAt).toLocaleDateString()}</strong>. Update your
            payment method in{" "}
            <Link href="/dashboard/billing" className="font-semibold underline underline-offset-4">
              Billing
            </Link>{" "}
            to avoid interruption.
          </span>
        </div>
      )}

      {/* Business status banners */}
      {biz?.status === "pending" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your business is <strong>pending review</strong>. Our team will approve it shortly. You
            can set up your profile and deals in the meantime.
          </span>
        </div>
      )}

      {biz?.status === "approved" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your business is <strong>approved</strong> and live on Lompoc Deals.
          </span>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Tag className="h-5 w-5" />}
          label="Active deals"
          value={activeDealCount.toString()}
          sub={dealLimit === Infinity ? "Unlimited plan" : `of ${dealLimit} allowed`}
          highlight={isAtLimit ? "danger" : isNearLimit ? "warn" : undefined}
        />
        <MetricCard
          icon={<Eye className="h-5 w-5" />}
          label="Total views"
          value={totalViews.toLocaleString()}
          sub="All time"
        />
        <MetricCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Total clicks"
          value={totalClicks.toLocaleString()}
          sub="All time"
        />
      </div>

      {/* Plan status card */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current plan
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold">{tierConfig.name}</span>
              <span className="text-sm text-muted-foreground">
                {tierConfig.price === 0 ? "Free" : `$${tierConfig.price}/mo`}
              </span>
            </div>
            {sub?.currentPeriodEnd && (
              <p className="mt-1 text-xs text-muted-foreground">
                {sub.cancelAtPeriodEnd
                  ? `Cancels ${sub.currentPeriodEnd.toLocaleDateString()}`
                  : `Renews ${sub.currentPeriodEnd.toLocaleDateString()}`}
              </p>
            )}
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
          >
            {isActive && sub ? "Manage plan" : "View plans"}
          </Link>
        </div>

        {/* Deal usage bar */}
        {dealLimit !== Infinity && (
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Deal usage</span>
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
              <p className="text-sm font-medium">Unlock more with Standard</p>
              <p className="text-xs text-muted-foreground">
                Analytics, social links, and up to 15 active deals for $19.99/mo
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickAction
          href="/dashboard/deals/new"
          icon={<Plus className="h-5 w-5" />}
          title="Post a deal"
          desc="Create a coupon, special, or announcement"
          disabled={isAtLimit}
          disabledHint="Deal limit reached — upgrade your plan to post more"
        />
        <QuickAction
          href="/dashboard/deals"
          icon={<Tag className="h-5 w-5" />}
          title="Manage deals"
          desc="Edit, pause, or remove your active deals"
        />
        <QuickAction
          href={currentTier === "free" ? "/dashboard/billing" : "/dashboard/stats"}
          icon={<BarChart3 className="h-5 w-5" />}
          title="View analytics"
          desc={
            currentTier === "free"
              ? "Upgrade to Standard to unlock full analytics"
              : "See views, clicks, and funnel data"
          }
          badge={currentTier === "free" ? "Standard+" : undefined}
        />
        <QuickAction
          href="/dashboard/profile"
          icon={<Store className="h-5 w-5" />}
          title="Edit profile"
          desc="Update your business info, hours, and images"
        />
        {/* Properties — Premium feature */}
        <QuickAction
          href={tierConfig.canListRealEstate ? "/dashboard/properties" : "/dashboard/billing"}
          icon={<Building2 className="h-5 w-5" />}
          title="Manage properties"
          desc={
            tierConfig.canListRealEstate
              ? "Add and manage real estate listings"
              : "Upgrade to Premium to list properties for sale or rent"
          }
          badge={!tierConfig.canListRealEstate ? "Premium" : undefined}
        />
      </div>

      {/* Plan features */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Plan features</h2>
          {currentTier !== "premium" && (
            <Link
              href="/dashboard/billing"
              className="text-xs font-medium text-primary hover:underline"
            >
              Upgrade
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PlanFeatureCard
            icon={<BarChart3 className="h-4 w-4" />}
            title="Analytics"
            desc="Views, clicks &amp; funnel data"
            available={tierConfig.canViewAnalytics}
            upgradeLabel="Standard"
          />
          <PlanFeatureCard
            icon={<Share2 className="h-4 w-4" />}
            title="Social links"
            desc="Instagram, Facebook &amp; more"
            available={tierConfig.canShowSocialLinks}
            upgradeLabel="Standard"
          />
          <PlanFeatureCard
            icon={<Building2 className="h-4 w-4" />}
            title="Property listings"
            desc="Real estate for-sale &amp; for-rent"
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
