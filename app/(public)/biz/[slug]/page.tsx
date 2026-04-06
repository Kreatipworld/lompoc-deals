import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPin, Phone, Globe } from "lucide-react"
import { getBusinessBySlug } from "@/lib/queries"
import { getViewer } from "@/lib/viewer"
import { DealGrid } from "@/components/deal-card"
import { Badge } from "@/components/ui/badge"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getBusinessBySlug(params.slug)
  if (!data) return { title: "Business not found — Lompoc Deals" }
  return {
    title: `${data.business.name} — Lompoc Deals`,
    description: data.business.description ?? undefined,
  }
}

export default async function BusinessPage({
  params,
}: {
  params: { slug: string }
}) {
  const [data, viewer] = await Promise.all([
    getBusinessBySlug(params.slug),
    getViewer(),
  ])
  if (!data) notFound()
  const { business, deals } = data

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {business.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.coverUrl}
          alt=""
          className="h-48 w-full rounded-lg object-cover"
        />
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={`${business.name} logo`}
            className="h-20 w-20 rounded-md border object-cover"
          />
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
          {business.category && (
            <Link href={`/category/${business.category.slug}`}>
              <Badge variant="secondary">{business.category.name}</Badge>
            </Link>
          )}
          {business.description && (
            <p className="text-muted-foreground">{business.description}</p>
          )}
          <ul className="space-y-1 text-sm text-muted-foreground">
            {business.address && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {business.address}
              </li>
            )}
            {business.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {business.phone}
              </li>
            )}
            {business.website && (
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4" />{" "}
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
            )}
          </ul>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Active deals</h2>
        <DealGrid
          deals={deals}
          viewer={viewer}
          fromPath={`/biz/${params.slug}`}
        />
      </section>
    </div>
  )
}
