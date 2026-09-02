import { redirect } from "@/i18n/navigation"

// Analytics now lives on the admin overview ("pro dashboard"). Keep the old URL
// working for bookmarks by sending it there, window preserved.
export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ window?: string }>
}) {
  const [{ locale }, { window }] = await Promise.all([params, searchParams])
  const href = window ? `/admin?window=${encodeURIComponent(window)}` : "/admin"
  redirect({ href, locale })
}
