import { Link } from "@/i18n/navigation"
import { Sparkles } from "lucide-react"
import { getFeedItems, type FeedDisplayItem } from "@/lib/feed-queries"
import { FeedMasonry } from "@/components/feed-masonry"

export const metadata = {
  title: "Lompoc Neighborhood — local listings, yard sales, info, and events",
  description:
    "Browse the Lompoc neighborhood feed: items for sale, yard sales, neighborhood info, and upcoming events from your neighbors.",
}

type FeedType = "for_sale" | "info" | "event"

function isFeedType(s: string | undefined): s is FeedType {
  return s === "for_sale" || s === "info" || s === "event"
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
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
          Neighborhood
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          What&apos;s happening in Lompoc
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Locals post things for sale, yard sales, neighborhood info, and events. Have something to share?{" "}
          <Link href="/feed/post" className="font-medium text-primary underline">
            Post to the neighborhood →
          </Link>
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filterLink("all", "All")}
        {filterLink("for_sale", "For sale")}
        {filterLink("info", "Info")}
        {filterLink("event", "Events")}
      </div>

      <FeedMasonry items={items} />
    </main>
  )
}
