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
} from "lucide-react"
import {
  getAdminStats,
  getAdminActivityFeed,
  getPendingBusinesses,
  getPendingClaims,
  getPulseExtras,
  getNewPeople,
  getGrowthWeeks,
  approveBusinessAction,
  rejectBusinessAction,
  approveClaimAction,
  rejectClaimAction,
  type ActivityEntry,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.home")
  return { title: t("metaTitle") }
}

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
  views7d: 0,
  newUsers7d: 0,
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

export default async function AdminPage() {
  const t = await getTranslations("admin.home")

  const [statsResult, pendingResult, claimsResult, feedResult, pulseResult, peopleResult, growthResult] =
    await Promise.allSettled([
      getAdminStats(),
      getPendingBusinesses(),
      getPendingClaims(),
      getAdminActivityFeed(),
      getPulseExtras(),
      getNewPeople(7),
      getGrowthWeeks(4),
    ])

  const stats = statsResult.status === "fulfilled" ? statsResult.value : DEFAULT_STATS
  const pending = pendingResult.status === "fulfilled" ? pendingResult.value : []
  const claims = claimsResult.status === "fulfilled" ? claimsResult.value : []
  const feed = feedResult.status === "fulfilled" ? feedResult.value : []
  const pulse = pulseResult.status === "fulfilled" ? pulseResult.value : DEFAULT_PULSE
  const people = peopleResult.status === "fulfilled" ? peopleResult.value : []
  const growth = growthResult.status === "fulfilled" ? growthResult.value : []

  const ACTIVITY_LABELS: Record<ActivityEntry["type"], string> = {
    user_signup: t("activityUserSignup"),
    business_created: t("activityBusinessCreated"),
    business_approved: t("activityBusinessApproved"),
    deal_created: t("activityDealCreated"),
  }

  const queueTotal = stats.pendingBusinesses + stats.pendingClaims + stats.pendingEvents
  const maxGrowth = Math.max(1, ...growth.flatMap((w) => [w.signups, w.views, w.claims]))

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
          href="/admin/analytics"
          icon={<Eye className="h-3.5 w-3.5" />}
          label={t("pulseEngagement")}
          value={pulse.views7d}
          sub={t("pulseEngagementSub", { claims: pulse.claims7d, redeems: pulse.redeems7d })}
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
      </div>

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
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              {growth.map((w) => (
                <div key={w.weekStart.toISOString()} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-32 w-full items-end justify-center gap-1">
                    <div
                      className="w-1/4 rounded-t bg-primary"
                      style={{ height: `${Math.max(4, (w.views / maxGrowth) * 100)}%` }}
                      title={`${t("growthViews")}: ${w.views}`}
                    />
                    <div
                      className="w-1/4 rounded-t bg-gold"
                      style={{ height: `${Math.max(4, (w.claims / maxGrowth) * 100)}%` }}
                      title={`${t("growthClaims")}: ${w.claims}`}
                    />
                    <div
                      className="w-1/4 rounded-t bg-success"
                      style={{ height: `${Math.max(4, (w.signups / maxGrowth) * 100)}%` }}
                      title={`${t("growthSignups")}: ${w.signups}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {format(w.weekStart, "MMM d")}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> {t("growthViews")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold" /> {t("growthClaims")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" /> {t("growthSignups")}
              </span>
            </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
            href="/admin/analytics"
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{t("analyticsTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("analyticsSubtitle")}</p>
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
