import { format } from "date-fns"
import { Tag, Pause, Play, Trash2 } from "lucide-react"
import {
  getAllDealsForAdmin,
  adminSoftDeleteDealAction,
  adminPauseDealAction,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"

export const metadata = { title: "Admin — Deals" }

const TYPE_STYLES: Record<string, string> = {
  coupon: "bg-green-50 text-green-700 border-green-200",
  special: "bg-blue-50 text-blue-700 border-blue-200",
  announcement: "bg-purple-50 text-purple-700 border-purple-200",
}

export default async function AdminDealsPage() {
  const allDeals = await getAllDealsForAdmin()
  const now = new Date()
  const activeCount = allDeals.filter(
    (d) => new Date(d.expiresAt) > now && !d.paused
  ).length
  const pausedCount = allDeals.filter((d) => d.paused).length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Deals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allDeals.length} total deals
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Total deals"
          value={allDeals.length}
        />
        <StatCard
          icon={<Play className="h-4 w-4" />}
          label="Active"
          value={activeCount}
        />
        <StatCard
          icon={<Pause className="h-4 w-4" />}
          label="Paused"
          value={pausedCount}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left">Deal</th>
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allDeals.map((d) => {
              const expired = new Date(d.expiresAt) <= now
              return (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium leading-snug">{d.title}</div>
                    {d.discountText && (
                      <div className="text-xs text-muted-foreground">
                        {d.discountText}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.businessName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${TYPE_STYLES[d.type] ?? ""}`}
                    >
                      {d.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className={expired ? "text-destructive" : ""}>
                      {format(new Date(d.expiresAt), "MMM d, yyyy")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {d.paused ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                        <Pause className="h-2.5 w-2.5" /> Paused
                      </span>
                    ) : expired ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
                        <Play className="h-2.5 w-2.5" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!expired && (
                        <form action={adminPauseDealAction}>
                          <input type="hidden" name="dealId" value={d.id} />
                          <input
                            type="hidden"
                            name="paused"
                            value={d.paused ? "false" : "true"}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            title={d.paused ? "Resume deal" : "Pause deal"}
                          >
                            {d.paused ? (
                              <Play className="h-3 w-3" />
                            ) : (
                              <Pause className="h-3 w-3" />
                            )}
                          </Button>
                        </form>
                      )}
                      <form action={adminSoftDeleteDealAction}>
                        <input type="hidden" name="dealId" value={d.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          title="Remove deal"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
