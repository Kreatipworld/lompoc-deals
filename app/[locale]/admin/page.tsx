import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { format, formatDistanceToNow } from "date-fns"
import {
  Store,
  Clock,
  Tag,
  Users,
  CheckCircle,
  MapPin,
  Phone,
  Globe,
  ShieldCheck,
  Inbox,
  Activity,
  CalendarDays,
  UserPlus,
  BadgeCheck,
  TrendingUp,
  BarChart2,
  Mail,
  Megaphone,
  Eye,
  MousePointerClick,
  Compass,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react"
import {
  getAdminStats,
  getAdminActivityFeed,
  getPendingBusinesses,
  getPendingClaims,
  getPulseExtras,
  getNewPeople,
  getGrowthWeeks,
  getMemberHealth,
  approveBusinessAction,
  rejectBusinessAction,
  approveClaimAction,
  rejectClaimAction,
  type ActivityEntry,
} from "@/lib/admin-actions"
import {
  platformKpis,
  platformDaily,
  platformSources,
  platformActions,
  actionsByBusiness,
  topPages,
  windowDays,
  type PlatformKpis,
} from "@/lib/analytics/platform-stats"
import {
  localFunnel,
  businessFunnel,
  recentClaims,
  claimSummary,
  topZeroResultSearches,
  topBusinessesByInterest,
  dailyMetrics,
} from "@/lib/admin-analytics"
import type { FunnelWindow } from "@/lib/funnel-queries"
import { FunnelStep, Sparkline, BusinessLink } from "@/components/admin/analytics-bits"
import { TrendChart } from "@/components/trend-chart"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.home")
  return { title: t("metaTitle") }
}

type HomeT = Awaited<ReturnType<typeof getTranslations<"admin.home">>>
const WINDOWS: FunnelWindow[] = ["7d", "30d", "all"]
const CLAIM_STATUSES = new Set(["pending", "approved", "rejected"])

const ACTIVITY_ICONS: Record<ActivityEntry["type"], React.ReactNode> = {
  user_signup: <UserPlus className="h-3.5 w-3.5 text-blue-500" />,
  business_created: <Store className="h-3.5 w-3.5 text-amber-500" />,
  business_approved: <BadgeCheck className="h-3.5 w-3.5 text-green-500" />,
  deal_created: <Tag className="h-3.5 w-3.5 text-purple-500" />,
}

const DEFAULT_STATS = {
  totalBusinesses: 0,
  pendingBusinesses: 0,
  approvedBusinesses: 0,
  totalDeals: 0,
  activeDeals: 0,
  totalUsers: 0,
  pendingClaims: 0,
  totalEvents: 0,
  pendingEvents: 0,
  totalDealEvents: 0,
}

const DEFAULT_PULSE = {
  confirmedSubscribers: 0,
  totalSubscribers: 0,
  claims7d: 0,
  redeems7d: 0,
  engaged7d: 0,
  sessions7d: 0,
  newUsers7d: 0,
}

const DEFAULT_KPIS: PlatformKpis = {
  engagedVisits: 0,
  rawSessions: 0,
  siteViews: 0,
  dealViews: 0,
  actions: 0,
  claims: 0,
  redeems: 0,
  signups: 0,
}

function settled<T>(r: PromiseSettledResult<T>, fallback: T): T {
  return r.status === "fulfilled" ? r.value : fallback
}

function GrowthRow({
  label,
  color,
  values,
}: {
  label: string
  color: string
  values: number[]
}) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex items-end gap-3">
      <span className="w-24 shrink-0 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-1 items-end gap-3">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-semibold tabular-nums">{v}</span>
            <div className="flex h-10 w-full items-end">
              <div
                className={`w-full rounded-t ${color}`}
                style={{ height: `${Math.max(4, (v / max) * 100)}%`, opacity: v === 0 ? 0.25 : 1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PulseTile({
  href,
  icon,
  label,
  value,
  sub,
  attention,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  attention?: number
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col gap-1 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      {attention !== undefined && attention > 0 && (
        <span className="absolute right-3 top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
          {attention}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-display text-3xl font-bold tracking-tight">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Link>
  )
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4 shadow-sm">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-display text-3xl font-bold tracking-tight tabular-nums">{value.toLocaleString()}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
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
          href={`/admin?window=${w}`}
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

function MembershipBadge({ value, t }: { value: "paying" | "comped" | "pending" | "none"; t: HomeT }) {
  if (value === "none") return <span className="text-muted-foreground">{t("membership_none")}</span>
  const tone =
    value === "paying"
      ? "bg-success/10 text-success"
      : value === "comped"
        ? "bg-gold/15 text-gold-foreground"
        : "bg-amber-100 text-amber-700"
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {t(`membership_${value}`)}
    </span>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  const params = await searchParams
  const window: FunnelWindow =
    params.window === "7d" || params.window === "all" ? params.window : "30d"
  const days = windowDays(window)

  const [t, ta] = await Promise.all([getTranslations("admin.home"), getTranslations("adminAnalytics")])
  const windowLabel = window === "7d" ? t("window7d") : window === "30d" ? t("window30d") : t("windowAll")

  const [
    statsResult,
    pendingResult,
    claimsResult,
    feedResult,
    pulseResult,
    peopleResult,
    growthResult,
    memberResult,
    kpisResult,
    dailyResult,
    sourcesResult,
    actionsResult,
    byBizResult,
    topPagesResult,
    localResult,
    bizFunnelResult,
    recentClaimsResult,
    claimSumResult,
    searchesResult,
    topBizResult,
    dailyMetricsResult,
  ] = await Promise.allSettled([
    getAdminStats(),
    getPendingBusinesses(),
    getPendingClaims(),
    getAdminActivityFeed(),
    getPulseExtras(),
    getNewPeople(7),
    getGrowthWeeks(4),
    getMemberHealth(),
    platformKpis(window),
    platformDaily(window),
    platformSources(window),
    platformActions(window),
    actionsByBusiness(window),
    topPages(window),
    localFunnel(days),
    businessFunnel(days),
    recentClaims(),
    claimSummary(days),
    topZeroResultSearches(days),
    topBusinessesByInterest(days),
    dailyMetrics(days),
  ])

  const stats = settled(statsResult, DEFAULT_STATS)
  const members = settled(memberResult, { paying: 0, mrr: 0, atRisk: [] as { name: string; graceEndsAt: string | null }[], comped: 0 })
  const pending = settled(pendingResult, [])
  const claims = settled(claimsResult, [])
  const feed = settled(feedResult, [])
  const pulse = settled(pulseResult, DEFAULT_PULSE)
  const people = settled(peopleResult, [])
  const growth = settled(growthResult, [])
  const kpis = settled(kpisResult, DEFAULT_KPIS)
  const daily = settled(dailyResult, [])
  const sources = settled(sourcesResult, [])
  const actions = settled(actionsResult, { total: 0, rows: [] })
  const byBiz = settled(byBizResult, [])
  const pages = settled(topPagesResult, [])
  const local = settled(localResult, [])
  const bizFunnel = settled(bizFunnelResult, [])
  const claimRows = settled(recentClaimsResult, [])
  const claimSum = settled(claimSumResult, { pending: 0, approvedInWindow: 0 })
  const searches = settled(searchesResult, [])
  const topBusinesses = settled(topBizResult, [])
  const dailySeries = settled(dailyMetricsResult, [])

  const ACTIVITY_LABELS: Record<ActivityEntry["type"], string> = {
    user_signup: t("activityUserSignup"),
    business_created: t("activityBusinessCreated"),
    business_approved: t("activityBusinessApproved"),
    deal_created: t("activityDealCreated"),
  }

  const queueTotal = stats.pendingBusinesses + stats.pendingClaims + stats.pendingEvents
  const trendHasData = daily.some((p) => p.profileViews > 0 || p.dealViews > 0)
  const localMax = Math.max(...local.map((s) => s.count), 1)
  const bizMax = Math.max(...bizFunnel.map((s) => s.count), 1)
  const claimStatus = (status: string) =>
    CLAIM_STATUSES.has(status) ? ta(`status_${status}` as "status_pending") : status

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subheading")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3 w-3" />
          {t("badge")}
        </span>
      </header>

      {/* PULSE — the numbers that matter, every tile is a door */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <PulseTile
          href="/admin/businesses"
          icon={<Store className="h-3.5 w-3.5" />}
          label={t("pulseBusinesses")}
          value={stats.approvedBusinesses}
          sub={t("pulseBusinessesSub", { count: stats.pendingBusinesses })}
          attention={stats.pendingBusinesses}
        />
        <PulseTile
          href="/admin/deals"
          icon={<Tag className="h-3.5 w-3.5" />}
          label={t("pulseDeals")}
          value={stats.activeDeals}
          sub={t("pulseDealsSub", { count: stats.totalDeals })}
        />
        <PulseTile
          href="/admin?window=7d"
          icon={<Eye className="h-3.5 w-3.5" />}
          label={t("pulseEngagement")}
          value={pulse.engaged7d}
          sub={t("pulseEngagementSub", { sessions: pulse.sessions7d, claims: pulse.claims7d })}
        />
        <PulseTile
          href="/admin/comms"
          icon={<Mail className="h-3.5 w-3.5" />}
          label={t("pulseSubscribers")}
          value={pulse.confirmedSubscribers}
          sub={t("pulseSubscribersSub", { count: pulse.totalSubscribers })}
        />
        <PulseTile
          href="/admin/users"
          icon={<Users className="h-3.5 w-3.5" />}
          label={t("pulseUsers")}
          value={stats.totalUsers}
          sub={t("pulseUsersSub", { count: pulse.newUsers7d })}
        />
        <PulseTile
          href="/admin/businesses"
          icon={<BadgeCheck className="h-3.5 w-3.5" />}
          label={t("pulseMembers")}
          value={members.paying}
          sub={t("pulseMembersSub", { mrr: members.mrr.toFixed(2), comped: members.comped })}
          attention={members.atRisk.length}
        />
      </div>

      {/* MEMBER AT-RISK STRIP — a failing card is money walking out; it gets a
          banner, not a buried row. Renders nothing when everyone's healthy. */}
      {members.atRisk.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            {t("memberAtRisk", { count: members.atRisk.length })}
          </span>
          {members.atRisk.map((m) => (
            <span key={m.name} className="rounded-full border border-amber-500/40 bg-background px-3 py-1 text-xs font-medium">
              {m.name}
              {m.graceEndsAt ? ` — ${t("memberGraceEnds", { date: format(new Date(m.graceEndsAt), "MMM d") })}` : ""}
            </span>
          ))}
        </div>
      )}

      {/* ACTION QUEUE */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary/70" />
            {t("queueHeading")}
          </h2>
          {queueTotal > 0 ? (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-2 text-xs font-bold text-destructive-foreground">
              {queueTotal}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <CheckCircle className="h-3 w-3" />
              {t("queueZero")}
            </span>
          )}
        </div>

        {stats.pendingEvents > 0 && (
          <Link
            href="/admin/events"
            className="mb-4 flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-2 font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t("queueEvents", { count: stats.pendingEvents })}
            </span>
            <span className="text-sm text-primary">{t("queueReview")}</span>
          </Link>
        )}

        {/* Pending claims */}
        {claims.length > 0 && (
          <ul className="mb-4 space-y-3">
            {claims.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <Link
                    href={`/biz/${c.business.slug}`}
                    className="font-display text-base font-semibold hover:underline"
                  >
                    {c.business.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("claimRequestedBy")}{" "}
                    <span className="font-medium text-foreground">{c.user.email}</span>{" "}
                    {t("claimOn")} {format(new Date(c.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveClaimAction}>
                    <input type="hidden" name="claimId" value={c.id} />
                    <Button type="submit" size="sm">
                      {t("approve")}
                    </Button>
                  </form>
                  <form action={rejectClaimAction}>
                    <input type="hidden" name="claimId" value={c.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("reject")}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pending businesses */}
        {pending.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pending.map((b) => (
              <article
                key={b.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium uppercase text-amber-700">
                    {t("pendingBadge")}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug">{b.name}</h3>
                {b.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
                )}
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {b.address && (
                    <li className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      {b.address}
                    </li>
                  )}
                  {b.phone && (
                    <li className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-primary/60" />
                      {b.phone}
                    </li>
                  )}
                  {b.website && (
                    <li className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-primary/60" />
                      {b.website.replace(/^https?:\/\//, "")}
                    </li>
                  )}
                </ul>
                <div className="mt-auto flex items-center gap-2 border-t pt-3">
                  <form action={approveBusinessAction}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <Button type="submit" size="sm">
                      {t("approve")}
                    </Button>
                  </form>
                  <form action={rejectBusinessAction}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("reject")}
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}

        {queueTotal === 0 && (
          <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-success/60" />
            <p className="mt-3 text-sm text-muted-foreground">{t("queueEmpty")}</p>
          </div>
        )}
      </section>

      {/* PLATFORM ANALYTICS — engaged sessions only, one window switch for everything below */}
      <section id="analytics" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary/70" />
              {t("analyticsHeading")}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">{t("analyticsSub")}</p>
          </div>
          <WindowPills current={window} t={t} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile
            icon={<Eye className="h-3.5 w-3.5" />}
            label={t("kpiVisits")}
            value={kpis.engagedVisits}
            sub={`${t("kpiVisitsSub", { count: kpis.rawSessions.toLocaleString() })} · ${t("kpiSiteViews", { count: kpis.siteViews.toLocaleString() })}`}
          />
          <StatTile
            icon={<Tag className="h-3.5 w-3.5" />}
            label={t("kpiDealViews")}
            value={kpis.dealViews}
            sub={windowLabel}
          />
          <StatTile
            icon={<MousePointerClick className="h-3.5 w-3.5" />}
            label={t("kpiActions")}
            value={kpis.actions}
            sub={t("kpiActionsSub")}
          />
          <StatTile
            icon={<ShoppingBag className="h-3.5 w-3.5" />}
            label={t("kpiClaims")}
            value={kpis.claims}
            sub={windowLabel}
          />
          <StatTile
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label={t("kpiRedeems")}
            value={kpis.redeems}
            sub={windowLabel}
          />
          <StatTile
            icon={<UserPlus className="h-3.5 w-3.5" />}
            label={t("kpiSignups")}
            value={kpis.signups}
            sub={windowLabel}
          />
        </div>

        {/* Trend */}
        {trendHasData && (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-display text-lg font-semibold">{t("trendTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("trendSub", { window: windowLabel })}</p>
            </div>
            <div className="px-5 py-5">
              <TrendChart
                points={daily}
                labels={{ profileViews: t("seriesVisits"), dealViews: t("seriesDealViews") }}
              />
            </div>
          </div>
        )}

        {/* Sources + Actions by type */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Compass className="h-4 w-4 text-primary" />
                {t("sourcesTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("sourcesSub", { window: windowLabel })}</p>
            </div>
            {sources.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">{t("sourcesEmpty")}</p>
            ) : (
              <ul className="divide-y">
                {sources.map((s) => (
                  <li key={s.source} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{t(`source_${s.source}` as "source_direct")}</span>
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

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                <MousePointerClick className="h-4 w-4 text-primary" />
                {t("actionsTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("actionsSub", { window: windowLabel })}</p>
            </div>
            {actions.rows.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">{t("actionsEmpty")}</p>
            ) : (
              <ul className="divide-y">
                {actions.rows.map((r) => (
                  <li key={r.action} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="font-medium">{t(`action_${r.action}` as "action_website_click")}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {r.count.toLocaleString()} · {actions.total ? Math.round((r.count / actions.total) * 100) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Top pages — what people actually open, engaged sessions only */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h3 className="font-display text-lg font-semibold">{t("topPagesTitle")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("topPagesSub", { window: windowLabel })}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2">{t("colPath")}</th>
                  <th className="px-3 py-2 text-right">{t("colViews")}</th>
                  <th className="px-5 py-2 text-right">{t("colSessions")}</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.path} className="border-t">
                    <td className="max-w-[320px] truncate px-5 py-2 font-medium">
                      <Link href={p.path} className="hover:underline">{p.path}</Link>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{p.views.toLocaleString()}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">{p.sessions.toLocaleString()}</td>
                  </tr>
                ))}
                {pages.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">{t("topPagesEmpty")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions by business — sales proof */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h3 className="font-display text-lg font-semibold">{t("actionsByBizTitle")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("actionsByBizSub", { window: windowLabel })}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2">{t("colBusiness")}</th>
                  <th className="px-3 py-2 text-right">{t("colTotal")}</th>
                  <th className="px-3 py-2 text-right">{t("colWebsite")}</th>
                  <th className="px-3 py-2 text-right">{t("colCalls")}</th>
                  <th className="px-3 py-2 text-right">{t("colDirections")}</th>
                  <th className="px-3 py-2 text-right">{t("colOther")}</th>
                  <th className="px-5 py-2">{t("colMembership")}</th>
                </tr>
              </thead>
              <tbody>
                {byBiz.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-5 py-2"><BusinessLink slug={b.slug} name={b.name} /></td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{b.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.website}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.phone}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.directions}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{b.other}</td>
                    <td className="px-5 py-2"><MembershipBadge value={b.membership} t={t} /></td>
                  </tr>
                ))}
                {byBiz.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">{t("actionsByBizEmpty")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FUNNELS, CLAIMS & GAPS */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary/70" />
            {t("insightsHeading")}
          </h2>
          <a
            href="https://vercel.com/kreatipworlds-projects/lompoc-deals/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary hover:underline"
            title={ta("vercelHint")}
          >
            {ta("openVercel")} →
          </a>
        </div>

        {/* Funnels */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 font-semibold">{ta("localFunnel")}</h3>
            {local.map((s) => (
              <FunnelStep key={s.key} label={ta(`step_${s.key}` as "step_visitors")} count={s.count} maxCount={localMax} />
            ))}
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 font-semibold">{ta("businessFunnel")}</h3>
            {bizFunnel.map((s) => (
              <FunnelStep key={s.key} label={ta(`step_${s.key}` as "step_sessions")} count={s.count} maxCount={bizMax} />
            ))}
          </div>
        </div>

        {/* Claims */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{ta("claims")}</h3>
            <span className="text-sm text-muted-foreground">
              {ta("claimsSummary", { pending: claimSum.pending, approved: claimSum.approvedInWindow, window: windowLabel })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2">{ta("business")}</th>
                  <th>{ta("email")}</th>
                  <th>{ta("status")}</th>
                  <th>{ta("submitted")}</th>
                </tr>
              </thead>
              <tbody>
                {claimRows.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2"><BusinessLink slug={c.businessSlug} name={c.businessName} /></td>
                    <td className="text-muted-foreground">{c.userEmail ?? "—"}</td>
                    <td>{claimStatus(c.status)}</td>
                    <td className="text-muted-foreground">{format(new Date(c.submittedAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
                {claimRows.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">{ta("noClaims")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search gaps + Top businesses */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-1 font-semibold">{ta("searchGaps")}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{ta("searchGapsHint", { window: windowLabel })}</p>
            {searches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ta("noSearchGaps")}</p>
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
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 font-semibold">{ta("topBusinesses", { window: windowLabel })}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2">{ta("business")}</th>
                    <th className="text-right">{ta("views30d")}</th>
                    <th className="pl-3">{ta("membership")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topBusinesses.map((b) => (
                    <tr key={b.id} className="border-t">
                      <td className="py-2"><BusinessLink slug={b.slug} name={b.name} /></td>
                      <td className="text-right tabular-nums">{b.viewCount.toLocaleString()}</td>
                      <td className="pl-3 text-muted-foreground">{ta(`membership_${b.membership}`)}</td>
                    </tr>
                  ))}
                  {topBusinesses.length === 0 && (
                    <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">{ta("noTopBusinesses")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Daily sparklines */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 font-semibold">{ta("daily", { window: windowLabel })}</h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {dailySeries.map((s) => (
              <Sparkline key={s.key} label={ta(`series_${s.key}` as "series_sessions")} points={s.points} />
            ))}
          </div>
        </div>
      </section>

      {/* NEW PEOPLE + GROWTH — side by side */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold tracking-tight flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary/70" />
            {t("newPeopleHeading")}
          </h2>
          {people.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
              <UserPlus className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">{t("newPeopleEmpty")}</p>
            </div>
          ) : (
            <ul className="divide-y rounded-2xl border bg-card px-4 shadow-sm">
              {people.map((p, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      p.kind === "user" ? "bg-primary/10 text-primary" : "bg-gold/15 text-gold-foreground"
                    }`}
                  >
                    {p.kind === "user" ? <UserPlus className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary/70" />
            {t("growthHeading")}
          </h2>
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
            <GrowthRow label={t("growthVisits")} color="bg-primary" values={growth.map((w) => w.visits)} />
            <GrowthRow label={t("growthClaims")} color="bg-gold" values={growth.map((w) => w.claims)} />
            <GrowthRow label={t("growthSignups")} color="bg-success" values={growth.map((w) => w.signups)} />
            <div className="flex items-center gap-3 border-t pt-2">
              <span className="w-24 shrink-0" />
              <div className="flex flex-1 gap-3">
                {growth.map((w) => (
                  <span
                    key={w.weekStart.toISOString()}
                    className="flex-1 text-center text-[10px] font-medium text-muted-foreground"
                  >
                    {format(w.weekStart, "MMM d")}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("growthHint")}</p>
          </div>
        </section>
      </div>

      {/* ACTIVITY FEED */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary/70" />
          {t("activityHeading")}
        </h2>
        {feed.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">{t("activityEmpty")}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {feed.map((entry, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted/30 transition-colors"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  {ACTIVITY_ICONS[entry.type]}
                </span>
                <span className="text-muted-foreground text-[11px] w-28 shrink-0 font-medium">
                  {ACTIVITY_LABELS[entry.type]}
                </span>
                <span className="flex-1 truncate font-medium">{entry.label}</span>
                <span
                  className="shrink-0 text-xs text-muted-foreground"
                  title={format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                >
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* QUICK LINKS */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">
          {t("quickLinksHeading")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/admin/comms"
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{t("commsTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("commsSubtitle")}</p>
            </div>
          </Link>

          <Link
            href="/admin/businesses/missing-hours"
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{t("missingHoursTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("missingHoursSubtitle")}</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
