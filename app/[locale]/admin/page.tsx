import { Link } from "@/i18n/navigation"
import { format } from "date-fns"
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
} from "lucide-react"
import {
  getAdminStats,
  getPendingBusinesses,
  getPendingClaims,
  approveBusinessAction,
  rejectBusinessAction,
  approveClaimAction,
  rejectClaimAction,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"

export const metadata = { title: "Admin — Lompoc Deals" }

export default async function AdminPage() {
  const [stats, pending, claims] = await Promise.all([
    getAdminStats(),
    getPendingBusinesses(),
    getPendingClaims(),
  ])

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage businesses, review pending listings, and approve owner
            claims.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </span>
      </header>

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Store className="h-4 w-4" />}
          label="Total businesses"
          value={stats.totalBusinesses}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending businesses"
          value={stats.pendingBusinesses}
        />
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Total deals"
          value={stats.totalDeals}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total users"
          value={stats.totalUsers}
        />
      </div>

      {/* PENDING CLAIMS */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Pending claims
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
              No claim requests right now.
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
                    Requested by{" "}
                    <span className="font-medium text-foreground">
                      {c.user.email}
                    </span>{" "}
                    on {format(new Date(c.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveClaimAction}>
                    <input type="hidden" name="claimId" value={c.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectClaimAction}>
                    <input type="hidden" name="claimId" value={c.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Reject
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
            Pending businesses
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
              All caught up — nothing to review.
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
                    Pending
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
                      Approve
                    </Button>
                  </form>
                  <form action={rejectBusinessAction}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Reject
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
