import Link from "next/link"
import { Heart } from "lucide-react"
import { formatDistanceToNowStrict } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { adminSoftDeleteDealAction } from "@/lib/admin-actions"
import { toggleFavoriteAction } from "@/lib/favorite-actions"
import type { DealCardData } from "@/lib/queries"
import type { Viewer } from "@/lib/viewer"

const typeLabel: Record<DealCardData["type"], string> = {
  coupon: "Coupon",
  special: "Special",
  announcement: "News",
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

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {deal.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={deal.imageUrl}
          alt={deal.title}
          className="h-40 w-full object-cover"
        />
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabel[deal.type]}</Badge>
            {deal.discountText && <Badge>{deal.discountText}</Badge>}
          </div>
          {viewer.isLocal && (
            <form action={toggleFavoriteAction}>
              <input type="hidden" name="dealId" value={deal.id} />
              {fromPath && (
                <input type="hidden" name="from" value={fromPath} />
              )}
              <button
                type="submit"
                aria-label={isFavorited ? "Unsave deal" : "Save deal"}
                className="rounded-full p-1 hover:bg-accent"
              >
                <Heart
                  className={
                    isFavorited
                      ? "h-5 w-5 fill-red-500 text-red-500"
                      : "h-5 w-5 text-muted-foreground"
                  }
                />
              </button>
            </form>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-tight">{deal.title}</h3>
        <Link
          href={`/biz/${deal.business.slug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {deal.business.name}
        </Link>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-muted-foreground">
        {deal.description}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Expires in{" "}
          {formatDistanceToNowStrict(deal.expiresAt, { addSuffix: false })}
        </span>
        {deal.business.categorySlug && (
          <Link
            href={`/category/${deal.business.categorySlug}`}
            className="hover:underline"
          >
            {deal.business.categoryName}
          </Link>
        )}
      </CardFooter>
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
    </Card>
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
      <p className="text-sm text-muted-foreground">
        No deals match yet. Check back soon.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((d) => (
        <DealCard key={d.id} deal={d} viewer={viewer} fromPath={fromPath} />
      ))}
    </div>
  )
}
