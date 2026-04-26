import { Link } from "@/i18n/navigation"
import {
  Heart,
  ArrowRight,
  Clock,
  Tag,
  Megaphone,
  Sparkles,
  MapPin,
  Phone,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { formatDistanceToNowStrict, isPast, differenceInHours } from "date-fns"
import { Button } from "@/components/ui/button"
import { adminSoftDeleteDealAction } from "@/lib/admin-actions"
import { toggleFavoriteAction } from "@/lib/favorite-actions"
import { trackClaimAction, trackRedeemAction } from "@/lib/tracking-actions"
import type { DealCardData } from "@/lib/queries"
import type { Viewer } from "@/lib/viewer"
import { SafeImage } from "@/components/safe-image"
import { getTranslations } from "next-intl/server"

type TypeKey = DealCardData["type"]
const TYPE_ICON: Record<TypeKey, LucideIcon> = {
  coupon: Tag,
  special: Sparkles,
  announcement: Megaphone,
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

export async function DealCard({
  deal,
  viewer,
  fromPath,
  variant = "default",
  staggerIndex = 0,
}: {
  deal: DealCardData
  viewer: Viewer
  fromPath?: string
  variant?: "default" | "tripadvisor"
  staggerIndex?: number
}) {
  const t = await getTranslations("dealCard")
  const isFavorited = viewer.favoritedDealIds.has(deal.id)
  const expired = isPast(deal.expiresAt)
  const hoursLeft = differenceInHours(deal.expiresAt, new Date())
  const expiresSoon = !expired && hoursLeft < 72
  const TypeIcon = TYPE_ICON[deal.type]
  const typeLabel =
    deal.type === "coupon" ? t("typeCoupon")
    : deal.type === "special" ? t("typeSpecial")
    : t("typeAnnouncement")

  if (variant === "tripadvisor") {
    return (
      <article
        className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 card-enter"
        style={{ animationDelay: `${Math.min(staggerIndex, 5) * 60}ms` }}
      >
        {/* IMAGE */}
        <Link href={`/biz/${deal.business.slug}`} className="relative block h-44 overflow-hidden flex-shrink-0">
          <SafeImage
            src={deal.imageUrl ?? deal.business.coverUrl ?? undefined}
            alt={deal.imageUrl ? deal.title : deal.business.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            fallback={
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(deal.id)}`}
              >
                <TypeIcon className="h-12 w-12 text-foreground/20" strokeWidth={1.25} />
              </div>
            }
          />

          {/* Discount badge */}
          {deal.discountText && (
            <div className="absolute left-2.5 top-2.5 rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-amber-foreground shadow">
              {deal.discountText}
            </div>
          )}

          {/* Expired overlay */}
          {expired && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-sm">
              <span className="rounded-full bg-foreground/90 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-background">
                {t("expired")}
              </span>
            </div>
          )}

          {/* Expires-soon badge */}
          {expiresSoon && (
            <div className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
              <Clock className="h-2.5 w-2.5" />
              {t("endsSoon")}
            </div>
          )}

          {/* Heart */}
          {viewer.isLocal && !expired && (
            <form action={toggleFavoriteAction} className="absolute right-2.5 bottom-2.5">
              <input type="hidden" name="dealId" value={deal.id} />
              {fromPath && <input type="hidden" name="from" value={fromPath} />}
              <button
                type="submit"
                aria-label={isFavorited ? t("unsaveDeal") : t("saveDeal")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background/95 shadow [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] hover:scale-110"
              >
                <Heart
                  className={
                    isFavorited
                      ? "h-3.5 w-3.5 fill-primary text-primary"
                      : "h-3.5 w-3.5 text-muted-foreground"
                  }
                />
              </button>
            </form>
          )}
        </Link>

        {/* BODY */}
        <div className="flex flex-1 flex-col p-3.5">
          {/* Category chip */}
          {deal.business.categorySlug ? (
            <Link
              href={`/category/${deal.business.categorySlug}`}
              className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 [transition:background-color_150ms_ease]"
            >
              <TypeIcon className="h-2.5 w-2.5" />
              {deal.business.categoryName ?? typeLabel}
            </Link>
          ) : (
            <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <TypeIcon className="h-2.5 w-2.5" />
              {typeLabel}
            </span>
          )}

          {/* Title */}
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight line-clamp-2">
            {deal.title}
          </h3>

          {/* Business name */}
          <Link
            href={`/biz/${deal.business.slug}`}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline truncate"
          >
            {deal.business.name}
          </Link>

          {/* Description */}
          {deal.description && (
            <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
              {deal.description}
            </p>
          )}

          {/* Location & contact */}
          <div className="mt-2 space-y-0.5">
            {deal.business.address && (
              <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate w-full">
                <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate">{deal.business.address}</span>
              </p>
            )}
            {deal.business.phone && (
              <a
                href={`tel:${deal.business.phone}`}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                <Phone className="h-3 w-3 shrink-0 text-primary/60" />
                {deal.business.phone}
              </a>
            )}
          </div>

          {/* Expiry */}
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {expired ? t("expired") : t("expiresIn", { distance: formatDistanceToNowStrict(deal.expiresAt) })}
          </p>

          {/* Terms hint */}
          {deal.terms && (
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 italic">
              <FileText className="h-2.5 w-2.5 shrink-0" />
              <span className="line-clamp-1">{deal.terms}</span>
            </p>
          )}

          {/* CTA */}
          {!expired && (
            <div className="mt-auto pt-3">
              <form action={trackClaimAction}>
                <input type="hidden" name="dealId" value={deal.id} />
                <input
                  type="hidden"
                  name="redirectTo"
                  value={`/api/track/click?dealId=${deal.id}&to=/biz/${deal.business.slug}`}
                />
                <button
                  type="submit"
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.98]"
                >
                  {t("getDeal")}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </form>
            </div>
          )}
        </div>

        {viewer.isAdmin && (
          <div className="border-t bg-muted/40 px-3 py-2">
            <form action={adminSoftDeleteDealAction}>
              <input type="hidden" name="dealId" value={deal.id} />
              <Button type="submit" variant="destructive" size="sm" className="w-full">
                {t("adminDelete")}
              </Button>
            </form>
          </div>
        )}
      </article>
    )
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm card-lift card-enter hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(staggerIndex, 5) * 60}ms` }}
    >
      {/* MEDIA */}
      <div className="relative h-52 overflow-hidden">
        <SafeImage
          src={deal.imageUrl ?? deal.business.coverUrl ?? undefined}
          alt={deal.imageUrl ? deal.title : deal.business.name}
          className="h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
          fallback={
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
                deal.id
              )}`}
            >
              <TypeIcon className="h-14 w-14 text-foreground/20" strokeWidth={1.25} />
            </div>
          }
        />

        {/* Discount badge (top-left, amber California gold) */}
        {deal.discountText && (
          <div className="absolute left-3 top-3 rounded-full bg-amber px-3 py-1.5 text-sm font-bold text-amber-foreground shadow-md">
            {deal.discountText}
          </div>
        )}

        {/* Type badge (bottom-left, subtle) */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
          <TypeIcon className="h-3 w-3" />
          {typeLabel}
        </div>

        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <span className="rounded-full bg-foreground/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-background">
              {t("expired")}
            </span>
          </div>
        )}

        {/* Expires-soon amber ribbon (< 3 days) */}
        {expiresSoon && (
          <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Clock className="h-3 w-3" />
            {t("endsSoon")}
          </div>
        )}

        {/* Heart (top-right, circular white) */}
        {viewer.isLocal && !expired && (
          <form action={toggleFavoriteAction} className="absolute right-3 top-3">
            <input type="hidden" name="dealId" value={deal.id} />
            {fromPath && <input type="hidden" name="from" value={fromPath} />}
            <button
              type="submit"
              aria-label={isFavorited ? t("unsaveDeal") : t("saveDeal")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/95 shadow-md [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1),background-color_160ms_ease] hover:scale-110 hover:bg-background"
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
          <Link
            href={`/biz/${deal.business.slug}`}
            className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            {deal.business.name}
          </Link>
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
            {deal.title}
          </h3>
        </div>

        {deal.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {deal.description}
          </p>
        )}

        {/* Location & contact */}
        <div className="space-y-1">
          {deal.business.address && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground truncate w-full">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{deal.business.address}</span>
            </p>
          )}
          {deal.business.phone && (
            <a
              href={`tel:${deal.business.phone}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              {deal.business.phone}
            </a>
          )}
        </div>

        {/* Terms hint */}
        {deal.terms && (
          <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 italic">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{deal.terms}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {expired
              ? t("expired")
              : t("expiresIn", { distance: formatDistanceToNowStrict(deal.expiresAt) })}
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
          <div className="mt-1 flex flex-col gap-2">
            <form action={trackClaimAction}>
              <input type="hidden" name="dealId" value={deal.id} />
              <input
                type="hidden"
                name="redirectTo"
                value={`/api/track/click?dealId=${deal.id}&to=/biz/${deal.business.slug}`}
              />
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground [transition:background-color_160ms_ease,transform_100ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/90 active:scale-[0.98]"
              >
                {t("getDeal")}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
            <form action={trackRedeemAction}>
              <input type="hidden" name="dealId" value={deal.id} />
              <button
                type="submit"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-medium text-muted-foreground [transition:border-color_160ms_ease,color_160ms_ease] hover:border-foreground/30 hover:text-foreground"
              >
                {t("markRedeemed")}
              </button>
            </form>
          </div>
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
              {t("adminDelete")}
            </Button>
          </form>
        </div>
      )}
    </article>
  )
}

export async function DealGrid({
  deals,
  viewer,
  fromPath,
  variant = "default",
}: {
  deals: DealCardData[]
  viewer: Viewer
  fromPath?: string
  variant?: "default" | "tripadvisor"
}) {
  const t = await getTranslations("dealCard")
  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 font-display text-xl font-semibold">
          {t("noDeals")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("noDealsSubtitle")}
        </p>
      </div>
    )
  }

  const gridClass =
    variant === "tripadvisor"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={gridClass}>
      {deals.map((d, i) => (
        <DealCard key={d.id} deal={d} viewer={viewer} fromPath={fromPath} variant={variant} staggerIndex={i} />
      ))}
    </div>
  )
}
