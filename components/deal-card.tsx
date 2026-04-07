import Link from "next/link"
import {
  Heart,
  ArrowRight,
  Clock,
  Tag,
  Megaphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { formatDistanceToNowStrict, isPast } from "date-fns"
import { Button } from "@/components/ui/button"
import { adminSoftDeleteDealAction } from "@/lib/admin-actions"
import { toggleFavoriteAction } from "@/lib/favorite-actions"
import type { DealCardData } from "@/lib/queries"
import type { Viewer } from "@/lib/viewer"

const TYPE_META: Record<
  DealCardData["type"],
  { label: string; icon: LucideIcon }
> = {
  coupon: { label: "Coupon", icon: Tag },
  special: { label: "Special", icon: Sparkles },
  announcement: { label: "News", icon: Megaphone },
}

// 6 deterministic gradient palettes — picked by deal id so each card looks
// distinct but stable across renders. Iris + Forest brand palette.
const GRADIENTS = [
  "from-violet-200 via-purple-100 to-fuchsia-100",
  "from-emerald-200 via-teal-100 to-violet-100",
  "from-purple-200 via-pink-100 to-violet-100",
  "from-green-200 via-emerald-100 to-teal-100",
  "from-fuchsia-200 via-violet-100 to-purple-100",
  "from-teal-100 via-violet-200 to-indigo-100",
]
function gradientFor(id: number) {
  return GRADIENTS[id % GRADIENTS.length]
}

export function DealCard({
  deal,
  viewer,
  fromPath,
}: {
  deal: DealCardData
  viewer: Viewer
  fromPath?: string
}) {
  const isFavorited = viewer.favoritedDealIds.has(deal.id)
  const expired = isPast(deal.expiresAt)
  const TypeIcon = TYPE_META[deal.type].icon

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* MEDIA */}
      <div className="relative h-48 overflow-hidden">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
              deal.id
            )}`}
          >
            <TypeIcon className="h-14 w-14 text-foreground/20" strokeWidth={1.25} />
          </div>
        )}

        {/* Discount badge (top-left, big and bold) */}
        {deal.discountText && (
          <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-md">
            {deal.discountText}
          </div>
        )}

        {/* Type badge (bottom-left, subtle) */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
          <TypeIcon className="h-3 w-3" />
          {TYPE_META[deal.type].label}
        </div>

        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <span className="rounded-full bg-foreground/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-background">
              Expired
            </span>
          </div>
        )}

        {/* Heart (top-right, circular white) */}
        {viewer.isLocal && !expired && (
          <form action={toggleFavoriteAction} className="absolute right-3 top-3">
            <input type="hidden" name="dealId" value={deal.id} />
            {fromPath && <input type="hidden" name="from" value={fromPath} />}
            <button
              type="submit"
              aria-label={isFavorited ? "Unsave deal" : "Save deal"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/95 shadow-md transition hover:scale-110 hover:bg-background"
            >
              <Heart
                className={
                  isFavorited
                    ? "h-4 w-4 fill-primary text-primary"
                    : "h-4 w-4 text-muted-foreground"
                }
              />
            </button>
          </form>
        )}
      </div>

      {/* BODY */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
            {deal.title}
          </h3>
          <Link
            href={`/biz/${deal.business.slug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {deal.business.name}
          </Link>
        </div>

        {deal.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {deal.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {expired
              ? "Expired"
              : `Expires in ${formatDistanceToNowStrict(deal.expiresAt)}`}
          </span>
          {deal.business.categorySlug && (
            <Link
              href={`/category/${deal.business.categorySlug}`}
              className="hover:text-foreground hover:underline"
            >
              {deal.business.categoryName}
            </Link>
          )}
        </div>

        {!expired && (
          <Link
            href={`/api/track/click?dealId=${deal.id}&to=/biz/${deal.business.slug}`}
            className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            View deal
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {viewer.isAdmin && (
        <div className="border-t bg-muted/40 px-4 py-2">
          <form action={adminSoftDeleteDealAction}>
            <input type="hidden" name="dealId" value={deal.id} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Admin: soft-delete
            </Button>
          </form>
        </div>
      )}
    </article>
  )
}

export function DealGrid({
  deals,
  viewer,
  fromPath,
}: {
  deals: DealCardData[]
  viewer: Viewer
  fromPath?: string
}) {
  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 font-display text-xl font-semibold">
          No deals yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back soon — new offers drop every day from local businesses.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((d) => (
        <DealCard key={d.id} deal={d} viewer={viewer} fromPath={fromPath} />
      ))}
    </div>
  )
}
