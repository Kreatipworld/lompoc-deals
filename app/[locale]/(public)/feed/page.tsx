import { Link } from "@/i18n/navigation"
import { Sparkles } from "lucide-react"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { FeedMasonry } from "@/components/feed-masonry"
import { getTranslations } from "next-intl/server"

type FeedType = "for_sale" | "info" | "event"

function isFeedType(s: string | undefined): s is FeedType {
  return s === "for_sale" || s === "info" || s === "event"
}

export async function generateMetadata() {
  const t = await getTranslations("feed")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const t = await getTranslations("feed")
  const typeFilter = isFeedType(searchParams?.type) ? searchParams!.type : undefined
  const items: FeedDisplayItem[] = await getFeedItems({ type: typeFilter })

  const filterLink = (val: FeedType | "all", label: string) => {
    const active = (val === "all" && !typeFilter) || val === typeFilter
    const href = val === "all" ? "/feed" : `/feed?type=${val}`
    return (
      <Link
        key={val}
        href={href}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent"
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          {t("badge")}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          {t("subheading")}{" "}
          <Link href="/feed/post" className="font-medium text-primary underline">
            {t("postLink")}
          </Link>
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filterLink("all", t("filterAll"))}
        {filterLink("for_sale", t("filterForSale"))}
        {filterLink("info", t("filterInfo"))}
        {filterLink("event", t("filterEvents"))}
      </div>

      <FeedMasonry items={items} />
    </main>
  )
}
