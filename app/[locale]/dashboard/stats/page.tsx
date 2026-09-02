import { redirect } from "@/i18n/navigation"

// Stats now lives on the dashboard overview ("pro dashboard"). Keep the old URL
// working for bookmarks and emails by sending it there.
export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ window?: string }>
}) {
  const [{ locale }, { window }] = await Promise.all([params, searchParams])
  const href = window ? `/dashboard?window=${encodeURIComponent(window)}` : "/dashboard"
  redirect({ href, locale })
}
