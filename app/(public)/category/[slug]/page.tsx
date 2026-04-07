import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Utensils,
  ShoppingBag,
  Wrench,
  Heart,
  Car,
  Ticket,
  MoreHorizontal,
  ArrowLeft,
  Sparkles,
  Home,
  type LucideIcon,
} from "lucide-react"
import { db } from "@/db/client"
import {
  getDealsByCategorySlug,
  getAllRealEstateListings,
} from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { PropertyListingGrid } from "@/components/property-listing-card"
import { CategoryChips } from "@/components/category-chips"
import { SearchBar } from "@/components/search-bar"

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  wrench: Wrench,
  heart: Heart,
  car: Car,
  ticket: Ticket,
  "more-horizontal": MoreHorizontal,
  home: Home,
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, params.slug),
  })
  return {
    title: cat ? `${cat.name} — Lompoc Deals` : "Category — Lompoc Deals",
    description: cat
      ? `Browse all ${cat.name.toLowerCase()} coupons and specials from Lompoc, California businesses.`
      : undefined,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, params.slug),
  })
  if (!cat) notFound()

  const isRealEstate = params.slug === "real-estate"
  const [deals, listings, viewer] = await Promise.all([
    isRealEstate ? Promise.resolve([]) : getDealsByCategorySlug(params.slug),
    isRealEstate ? getAllRealEstateListings() : Promise.resolve([]),
    getViewer(),
  ])
  const itemCount = isRealEstate ? listings.length : deals.length
  const itemLabel = isRealEstate ? "listing" : "deal"

  const Icon = ICONS[cat.icon ?? ""] ?? Sparkles

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-accent via-background to-background"
        />
        <div
          aria-hidden
          className="absolute -top-20 right-[-10%] -z-10 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            All categories
          </Link>

          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                {cat.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {itemCount} active {itemCount === 1 ? itemLabel : `${itemLabel}s`} in {cat.name.toLowerCase()}
                .
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* CHIPS */}
      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <CategoryChips activeSlug={params.slug} />
        </div>
      </section>

      {/* DEALS or LISTINGS */}
      <section className="mx-auto max-w-6xl px-4 py-10 pb-16">
        {isRealEstate ? (
          <PropertyListingGrid listings={listings} />
        ) : (
          <DealGrid
            deals={deals}
            viewer={viewer}
            fromPath={`/category/${params.slug}`}
          />
        )}
      </section>
    </>
  )
}
