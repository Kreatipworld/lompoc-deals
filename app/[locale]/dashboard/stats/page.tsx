import { Eye, MousePointerClick, Tag } from "lucide-react"
import { getMyBusiness, getMyDeals } from "@/lib/biz-actions"

export const metadata = { title: "Stats — Lompoc Deals" }

export default async function StatsPage() {
  const [biz, deals] = await Promise.all([getMyBusiness(), getMyDeals()])

  const totalViews = deals.reduce((s, d) => s + (d.viewCount ?? 0), 0)
  const totalClicks = deals.reduce((s, d) => s + (d.clickCount ?? 0), 0)
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0

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
          <p className="text-sm text-muted-foreground">
            Create a business profile to see stats.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BigStat
              icon={<Eye className="h-5 w-5" />}
              label="Total views"
              value={totalViews}
            />
            <BigStat
              icon={<MousePointerClick className="h-5 w-5" />}
              label="Total clicks"
              value={totalClicks}
            />
            <BigStat
              icon={<Tag className="h-5 w-5" />}
              label="Click-through rate"
              value={`${ctr}%`}
            />
          </div>

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
                  {deals.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-6 text-center text-muted-foreground"
                        colSpan={4}
                      >
                        No deals yet.
                      </td>
                    </tr>
                  ) : (
                    deals.map((d) => (
                      <tr key={d.id} className="hover:bg-accent/40">
                        <td className="px-6 py-3 font-medium">{d.title}</td>
                        <td className="px-6 py-3 capitalize text-muted-foreground">
                          {d.type}
                        </td>
                        <td className="px-6 py-3 text-right">{d.viewCount}</td>
                        <td className="px-6 py-3 text-right">{d.clickCount}</td>
                      </tr>
                    ))
                  )}
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
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-3xl border bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
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
