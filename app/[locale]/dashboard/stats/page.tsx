import { Eye, MousePointerClick, Tag, TrendingUp, Trophy, BarChart3 } from "lucide-react"
import { getMyBusiness, getMyDeals } from "@/lib/biz-actions"
import { Link } from "@/i18n/navigation"

export const metadata = { title: "Stats — Lompoc Deals" }

export default async function StatsPage() {
  const [biz, deals] = await Promise.all([getMyBusiness(), getMyDeals()])

  const totalViews = deals.reduce((s, d) => s + (d.viewCount ?? 0), 0)
  const totalClicks = deals.reduce((s, d) => s + (d.clickCount ?? 0), 0)
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0

  const bestDeal = deals.length > 0
    ? deals.reduce((best, d) =>
        (d.viewCount ?? 0) > (best.viewCount ?? 0) ? d : best
      )
    : null

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Stats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lifetime views and clicks across your deals.
        </p>
      </header>

      {!biz ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            Create a{" "}
            <Link href="/dashboard/profile" className="font-medium text-primary underline underline-offset-4">
              business profile
            </Link>{" "}
            to start tracking stats.
          </p>
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-xl font-semibold">No data yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Post your first deal to start seeing views and clicks here.
          </p>
          <Link
            href="/dashboard/deals/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Post a deal
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BigStat
              icon={<Eye className="h-5 w-5" />}
              label="Total views"
              value={totalViews}
              trend={totalViews > 0 ? "up" : "neutral"}
            />
            <BigStat
              icon={<MousePointerClick className="h-5 w-5" />}
              label="Total clicks"
              value={totalClicks}
              trend={totalClicks > 0 ? "up" : "neutral"}
            />
            <BigStat
              icon={<Tag className="h-5 w-5" />}
              label="Click-through rate"
              value={`${ctr}%`}
              trend={ctr >= 5 ? "up" : ctr > 0 ? "neutral" : "neutral"}
            />
          </div>

          {/* Best performing deal highlight */}
          {bestDeal && (bestDeal.viewCount ?? 0) > 0 && (
            <div className="flex items-start gap-4 rounded-3xl border bg-gradient-to-br from-amber-50 to-card p-5 shadow-sm dark:from-amber-950/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Best performing deal
                </p>
                <p className="mt-0.5 truncate font-display text-lg font-semibold">
                  {bestDeal.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bestDeal.viewCount?.toLocaleString()} views &middot;{" "}
                  {bestDeal.clickCount?.toLocaleString()} clicks
                </p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-display text-lg font-semibold">
                Per-deal performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Deal</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Views</th>
                    <th className="px-6 py-3 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deals.map((d) => (
                    <tr key={d.id} className="hover:bg-accent/40">
                      <td className="px-6 py-3 font-medium">{d.title}</td>
                      <td className="px-6 py-3 capitalize text-muted-foreground">
                        {d.type}
                      </td>
                      <td className="px-6 py-3 text-right">{d.viewCount ?? 0}</td>
                      <td className="px-6 py-3 text-right">{d.clickCount ?? 0}</td>
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
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  trend?: "up" | "down" | "neutral"
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
            Active
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

