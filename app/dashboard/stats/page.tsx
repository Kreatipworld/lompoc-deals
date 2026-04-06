import { getMyBusiness, getMyDeals } from "@/lib/biz-actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata = { title: "Stats — Lompoc Deals" }

export default async function StatsPage() {
  const [biz, deals] = await Promise.all([getMyBusiness(), getMyDeals()])

  const totalViews = deals.reduce((s, d) => s + (d.viewCount ?? 0), 0)
  const totalClicks = deals.reduce((s, d) => s + (d.clickCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
        <p className="text-sm text-muted-foreground">
          Lifetime views and clicks per deal.
        </p>
      </div>

      {!biz ? (
        <p className="text-sm text-muted-foreground">
          Create a business profile to see stats.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="text-xs uppercase text-muted-foreground">
                  Total views
                </div>
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {totalViews}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-xs uppercase text-muted-foreground">
                  Total clicks
                </div>
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {totalClicks}
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Deal</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4 text-right">Views</th>
                  <th className="py-2 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr>
                    <td
                      className="py-4 text-muted-foreground"
                      colSpan={4}
                    >
                      No deals yet.
                    </td>
                  </tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d.id} className="border-b">
                      <td className="py-2 pr-4">{d.title}</td>
                      <td className="py-2 pr-4">{d.type}</td>
                      <td className="py-2 pr-4 text-right">{d.viewCount}</td>
                      <td className="py-2 text-right">{d.clickCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
