import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect, notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { TIERS } from "@/lib/stripe"
import { getMyPropertyById } from "@/lib/biz-actions"
import { ChevronLeft } from "lucide-react"
import { PropertyForm } from "../../property-form"

export const metadata = { title: "Edit listing — Lompoc Deals" }

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const userId = Number(session?.user?.id)

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  const currentTier = sub?.tier ?? "free"

  if (!TIERS[currentTier].canListRealEstate) {
    redirect("/dashboard/properties")
  }

  const listing = await getMyPropertyById(parseInt(id, 10))
  if (!listing) notFound()

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/properties"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Edit listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your property details.</p>
      </header>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <PropertyForm listing={listing} />
      </div>
    </div>
  )
}
