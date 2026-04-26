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
  Play,
} from "lucide-react"
import {
  getAdminStats,
  getAdminActivityFeed,
  getPendingBusinesses,
  getPendingClaims,
  approveBusinessAction,
  rejectBusinessAction,
  approveClaimAction,
  rejectClaimAction,
  type ActivityEntry,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"

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

export default async function AdminPage() {
  const t = await getTranslations("admin.home")

  const [statsResult, pendingResult, claimsResult, feedResult] =
    await Promise.allSettled([
      getAdminStats(),
      getPendingBusinesses(),
      getPendingClaims(),
      getAdminActivityFeed(),
    ])

  const stats =
    statsResult.status === "fulfilled" ? statsResult.value : DEFAULT_STATS
  const pending =
    pendingResult.status === "fulfilled" ? pendingResult.value : []
  const claims =
    claimsResult.status === "fulfilled" ? claimsResult.value : []
  const feed = feedResult.status === "fulfilled" ? feedResult.value : []

  const ACTIVITY_LABELS: Record<ActivityEntry["type"], string> = {
    user_signup: t("activityUserSignup"),
    business_created: t("activityBusinessCreated"),
    business_approved: t("activityBusinessApproved"),
    deal_created: t("activityDealCreated"),
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("heading")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subheading")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3 w-3" />
          {t("badge")}
        </span>
      </header>

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Store className="h-4 w-4" />}
          label={t("statBusinesses")}
          value={stats.totalBusinesses}
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label={t("statApproved")}
          value={stats.approvedBusinesses}
        />
        <StatCard
          icon={<Play className="h-4 w-4" />}
          label={t("statActiveDeals")}
          value={stats.activeDeals}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("statTotalUsers")}
          value={stats.totalUsers}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t("statDealEngagements")}
          value={stats.totalDealEvents}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t("statPendingBusinesses")}
          value={stats.pendingBusinesses}
        />
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label={t("statTotalDeals")}
          value={stats.totalDeals}
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={t("statTotalEvents")}
          value={stats.totalEvents}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t("statPendingEvents")}
          value={stats.pendingEvents}
        />
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
            <p className="mt-3 text-sm text-muted-foreground">
              {t("activityEmpty")}
            </p>
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
                  {formatDistanceToNow(new Date(entry.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* PENDING CLAIMS */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("claimsHeading")}
            {stats.pendingClaims > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                · {stats.pendingClaims}
              </span>
            )}
          </h2>
        </div>

        {claims.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("claimsEmpty")}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {claims.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/biz/${c.business.slug}`}
                      className="font-display text-base font-semibold hover:underline"
                    >
                      {c.business.name}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("claimRequestedBy")}{" "}
                    <span className="font-medium text-foreground">
                      {c.user.email}
                    </span>{" "}
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
      </section>

      {/* PENDING BUSINESSES */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("pendingHeading")}
            {stats.pendingBusinesses > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                · {stats.pendingBusinesses}
              </span>
            )}
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-10 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("pendingEmpty")}
            </p>
          </div>
        ) : (
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
                <h3 className="font-display text-lg font-semibold leading-snug">
                  {b.name}
                </h3>
                {b.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {b.description}
                  </p>
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
      </section>
    </div>
  )
}
