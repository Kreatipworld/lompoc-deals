import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { TIERS } from "@/lib/stripe"
import { ChevronLeft } from "lucide-react"
import { PropertyForm } from "../property-form"

export const metadata = { title: "Add listing — Lompoc Deals" }

export default async function NewPropertyPage() {
  const session = await auth()
  const userId = Number(session?.user?.id)

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  const currentTier = sub?.tier ?? "free"

  if (!TIERS[currentTier].canListRealEstate) {
    redirect("/dashboard/properties")
  }

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
        <h1 className="font-display text-3xl font-semibold tracking-tight">Add listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new property to your business profile.
        </p>
      </header>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <PropertyForm />
      </div>
    </div>
  )
}
