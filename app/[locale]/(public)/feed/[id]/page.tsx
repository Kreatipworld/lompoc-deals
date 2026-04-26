import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, Calendar, MapPin, Tag } from "lucide-react"
import { getFeedPostById } from "@/lib/feed-queries"
import { getTranslations } from "next-intl/server"

function formatPrice(cents: number | null, freeLabel: string, freeOboLabel: string): string {
  if (cents === null) return freeOboLabel
  if (cents === 0) return freeLabel
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return {}
  const post = await getFeedPostById(id)
  if (!post || post.status !== "approved") return {}
  const t = await getTranslations("feed")
  return {
    title: t("detail.metaTitle", { title: post.title }),
  }
}

export default async function FeedPostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const t = await getTranslations("feed")
  const tCard = await getTranslations("feedCard")

  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) notFound()

  const post = await getFeedPostById(id)
  if (!post || post.status !== "approved") notFound()

  const photos = Array.isArray(post.photos) ? (post.photos as string[]) : []

  const priceStr = formatPrice(post.priceCents, tCard("free"), tCard("freeObo"))

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/feed"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("detail.backToFeed")}
      </Link>

      <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
        {post.type === "for_sale" ? <Tag className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
        {post.type === "for_sale" ? tCard("forSale") : tCard("info")}
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {post.title}
      </h1>

      {post.type === "for_sale" && (
        <p className="mt-2 text-2xl font-bold text-primary">{priceStr}</p>
      )}

      {photos.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {photos.map((url, i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={t("detail.photoAlt", { n: i + 1 })}
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {post.description && (
        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground">
          {post.description}
        </p>
      )}

      {post.address && (
        <p className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {post.address}
        </p>
      )}

      {post.saleStartsAt && post.saleEndsAt && (
        <p className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {post.saleStartsAt.toLocaleDateString()} – {post.saleEndsAt.toLocaleDateString()}
        </p>
      )}
    </main>
  )
}
