import { Link } from "@/i18n/navigation"
import { MapPin, ArrowRight, Compass } from "lucide-react"
import { getActivities, getActivityCategories } from "@/lib/queries"

export const metadata = {
  title: "Things to Do in Lompoc, CA — Adventures & Activities | Lompoc Deals",
  description:
    "Discover the best things to do in Lompoc, CA — historic missions, flower fields, wine tasting, beaches, murals, and outdoor adventures. Updated by locals.",
  keywords: [
    "things to do in lompoc",
    "lompoc activities",
    "lompoc adventures",
    "lompoc attractions",
    "lompoc ca things to do",
  ],
  openGraph: {
    title: "Things to Do in Lompoc, CA",
    description:
      "Explore Lompoc — missions, flower fields, wine tasting, rocket launches, and more.",
    images: [{ url: "/lompoc-hero.jpg", width: 1200, height: 630, alt: "Lompoc, California" }],
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  outdoors: "Outdoors",
  history: "History & Culture",
  arts: "Arts & Murals",
  "food-wine": "Food & Wine",
  family: "Family",
  unique: "Only in Lompoc",
}

const CATEGORY_IMAGES: Record<string, string> = {
  outdoors:
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
  history:
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80",
  arts: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=80",
  "food-wine":
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
  family:
    "https://images.unsplash.com/photo-1563865436874-9aef32095fad?auto=format&fit=crop&w=800&q=80",
  unique:
    "https://images.unsplash.com/photo-1541185934-01b600ea069c?auto=format&fit=crop&w=800&q=80",
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const [allActivities, categories] = await Promise.all([
    getActivities(category),
    getActivityCategories(),
  ])

  return (
    <>
      {/* ─── PAGE HEADER ─── */}
      <section className="border-b bg-accent/30 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Compass className="h-3 w-3 text-primary" />
            Local adventures, curated by neighbors
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Things to Do in Lompoc
          </h1>
          <p className="mt-3 text-muted-foreground">
            From historic missions and world-famous flower fields to rocket launches and wine tasting —
            there&apos;s more to Lompoc than you think.
          </p>
        </div>
      </section>

      {/* ─── CATEGORY FILTER CHIPS ─── */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4">
          <div className="flex gap-2 py-3">
            <Link
              href="/activities"
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !category
                  ? "bg-primary text-primary-foreground"
                  : "border bg-background text-foreground hover:bg-accent"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/activities?category=${cat}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ACTIVITY GRID ─── */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {allActivities.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No activities found. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allActivities.map((activity, i) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.slug}`}
                style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-background shadow-sm animate-fade-up card-lift hover:shadow-lg hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-accent">
                  {activity.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="h-full w-full object-cover [transition:transform_300ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${CATEGORY_IMAGES[activity.category] ?? ""})`,
                      }}
                    />
                  )}
                  {/* Featured badge */}
                  {activity.featured && (
                    <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
                      Featured
                    </div>
                  )}
                  {/* Category chip */}
                  <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {CATEGORY_LABELS[activity.category] ?? activity.category}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-display font-semibold leading-snug group-hover:text-primary transition-colors">
                    {activity.title}
                  </h2>
                  {activity.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    {activity.address && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{activity.address.split(",")[0]}</span>
                      </span>
                    )}
                    {activity.seasonality && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {activity.seasonality}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Map CTA */}
        <div className="mt-12 rounded-2xl border bg-accent/30 p-6 text-center">
          <h3 className="font-display text-lg font-semibold">Explore the map</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            See activities and businesses pinned on the Lompoc map.
          </p>
          <Link
            href="/map"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <MapPin className="h-4 w-4" />
            Open map
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
