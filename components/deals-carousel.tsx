import { Link } from "@/i18n/navigation"
import { ArrowRight, Tag, Sparkles, Megaphone } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import type { DealCardData } from "@/lib/queries"

// 6 deterministic gradient palettes — same set as DealCard for consistency
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

const TYPE_ICON = {
  coupon: Tag,
  special: Sparkles,
  announcement: Megaphone,
}

function DealsCarouselCard({ deal, index }: { deal: DealCardData; index: number }) {
  const TypeIcon = TYPE_ICON[deal.type]
  return (
    <Link
      href={`/biz/${deal.business.slug}`}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group snap-start flex-shrink-0 w-52 sm:w-60 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm animate-fade-up card-lift hover:-translate-y-1 hover:shadow-lg transition-[transform,box-shadow] duration-200"
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-accent flex-shrink-0">
        <SafeImage
          src={deal.imageUrl ?? deal.business.coverUrl ?? undefined}
          alt={deal.imageUrl ? deal.title : deal.business.name}
          className="h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
          fallback={
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(deal.id)}`}
            >
              <TypeIcon className="h-10 w-10 text-foreground/20" strokeWidth={1.25} />
            </div>
          }
        />
        {/* Discount badge */}
        {deal.discountText && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-amber-foreground shadow">
            {deal.discountText}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary truncate">
          {deal.business.name}
        </p>
        <h3 className="font-display text-sm font-semibold leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
          {deal.title}
        </h3>
      </div>
    </Link>
  )
}

export function DealsCarousel({ deals }: { deals: DealCardData[] }) {
  if (deals.length === 0) return null

  return (
    <section className="border-t bg-accent/10 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Featured Deals
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Today&apos;s best offers from Lompoc businesses
            </p>
          </div>
          <Link
            href="/deals"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            See all deals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Scrollable track */}
        <div
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {deals.map((deal, i) => (
            <DealsCarouselCard key={deal.id} deal={deal} index={i} />
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See all deals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
