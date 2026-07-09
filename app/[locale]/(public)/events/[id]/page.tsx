import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, Calendar, MapPin } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { db } from "@/db/client"
import { events } from "@/db/schema"
import { pageAlternates } from "@/lib/seo"

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000"

async function getApprovedEvent(id: number) {
  if (Number.isNaN(id)) return null
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1)
  const ev = rows[0]
  if (!ev || ev.status !== "approved") return null
  return ev
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const ev = await getApprovedEvent(parseInt(params.id, 10))
  if (!ev) return {}
  const t = await getTranslations("eventDetail")
  return {
    title: t("metaTitle", { title: ev.title }),
    description: ev.description?.slice(0, 160) ?? undefined,
    alternates: pageAlternates(`/events/${ev.id}`),
  }
}

function formatEventDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const ev = await getApprovedEvent(parseInt(params.id, 10))
  if (!ev) notFound()
  const t = await getTranslations("eventDetail")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: ev.startsAt.toISOString(),
    ...(ev.endsAt ? { endDate: ev.endsAt.toISOString() } : {}),
    ...(ev.description ? { description: ev.description } : {}),
    ...(ev.imageUrl ? { image: [ev.imageUrl] } : {}),
    location: {
      "@type": "Place",
      name: ev.location ?? "Lompoc, CA",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lompoc",
        addressRegion: "CA",
        addressCountry: "US",
      },
    },
    url: `${siteUrl}/events/${ev.id}`,
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/feed?type=event"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToFeed")}
      </Link>

      {ev.imageUrl && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ev.imageUrl} alt={ev.title} className="w-full object-cover" />
        </div>
      )}

      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {ev.title}
      </h1>

      <div className="mt-4 space-y-2 text-sm">
        <p className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold">{t("when")}:</span>
          {formatEventDate(ev.startsAt, params.locale)}
        </p>
        {ev.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold">{t("where")}:</span>
            {ev.location}
          </p>
        )}
      </div>

      {ev.description && (
        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground">
          {ev.description}
        </p>
      )}
    </main>
  )
}
