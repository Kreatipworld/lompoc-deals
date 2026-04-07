import { Link } from "@/i18n/navigation"
import { differenceInDays, format, isPast } from "date-fns"
import { Plus, Eye, MousePointerClick, Tag, Pause, Play } from "lucide-react"
import { getMyBusiness, getMyDeals, deleteDealAction, toggleDealPausedAction } from "@/lib/biz-actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"

export const metadata = { title: "My deals — Lompoc Deals" }

function ExpiryLabel({ expiresAt }: { expiresAt: Date }) {
  const expired = isPast(expiresAt)
  if (expired) {
    return (
      <span className="font-medium text-muted-foreground">
        Expired {format(new Date(expiresAt), "MMM d, yyyy")}
      </span>
    )
  }
  const days = differenceInDays(new Date(expiresAt), new Date())
  const label =
    days === 0 ? "Expires today" : days === 1 ? "Expires tomorrow" : `Expires in ${days} days`
  const colorClass =
    days <= 2
      ? "text-destructive font-semibold"
      : days <= 7
      ? "text-amber-600 font-medium dark:text-amber-400"
      : "text-muted-foreground"
  return <span className={colorClass}>{label}</span>
}

export default async function MyDealsPage() {
  const [biz, deals] = await Promise.all([getMyBusiness(), getMyDeals()])

  if (!biz) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          My deals
        </h1>
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            You need to{" "}
            <Link href="/dashboard/profile" className="font-medium text-primary underline">
              create a business profile
            </Link>{" "}
            before you can post deals.
          </p>
        </div>
      </div>
    )
  }

  const active = deals.filter((d) => !isPast(d.expiresAt) && !d.paused)
  const totalViews = deals.reduce((s, d) => s + (d.viewCount ?? 0), 0)
  const totalClicks = deals.reduce((s, d) => s + (d.clickCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            My deals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage coupons, specials, and announcements for {biz.name}.
          </p>
        </div>
        <Link
          href="/dashboard/deals/new"
          className={buttonVariants({ className: "rounded-full" })}
        >
          <Plus className="h-4 w-4" />
          New deal
        </Link>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Active deals"
          value={active.length}
        />
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Lifetime views"
          value={totalViews}
        />
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Lifetime clicks"
          value={totalClicks}
        />
      </div>

      {/* Deals list */}
      {deals.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No deals yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click <span className="font-medium">New deal</span> to post your
            first one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          {deals.map((d) => {
            const expired = isPast(d.expiresAt)
            return (
              <article
                key={d.id}
                className={`flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md ${d.paused ? "opacity-60" : ""}`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize">
                    {d.type}
                  </span>
                  {d.discountText && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase text-primary-foreground">
                      {d.discountText}
                    </span>
                  )}
                  {d.paused && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      paused
                    </span>
                  )}
                  {expired && !d.paused && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      expired
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug">
                  {d.title}
                </h3>
                {d.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {d.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <ExpiryLabel expiresAt={new Date(d.expiresAt)} />
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {d.viewCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MousePointerClick className="h-3 w-3" />
                    {d.clickCount}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <Link
                    href={`/dashboard/deals/edit/${d.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Edit
                  </Link>
                  {/* Pause/activate toggle — only shown for non-expired deals */}
                  {!expired && (
                    <form action={toggleDealPausedAction}>
                      <input type="hidden" name="dealId" value={d.id} />
                      <input type="hidden" name="paused" value={String(d.paused)} />
                      <Button variant="outline" size="sm" type="submit">
                        {d.paused ? (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Activate
                          </>
                        ) : (
                          <>
                            <Pause className="mr-1 h-3 w-3" />
                            Pause
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                  <form action={deleteDealAction}>
                    <input type="hidden" name="dealId" value={d.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      {expired ? "Hide" : "Remove"}
                    </Button>
                  </form>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
