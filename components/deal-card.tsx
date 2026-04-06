import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DealCardData } from "@/lib/queries"

const typeLabel: Record<DealCardData["type"], string> = {
  coupon: "Coupon",
  special: "Special",
  announcement: "News",
}

export function DealCard({ deal }: { deal: DealCardData }) {
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{typeLabel[deal.type]}</Badge>
          {deal.discountText && (
            <Badge>{deal.discountText}</Badge>
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
    </Card>
  )
}

export function DealGrid({ deals }: { deals: DealCardData[] }) {
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
        <DealCard key={d.id} deal={d} />
      ))}
    </div>
  )
}
