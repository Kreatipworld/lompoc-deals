import { auth } from "@/auth"
import { db } from "@/db/client"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { FirstDealForm } from "./first-deal-form"
import { Sparkles } from "lucide-react"

export const metadata = { title: "Add your first deal — Lompoc Deals" }

export default async function FirstDealPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = parseInt(session.user.id, 10)
  const biz = await db.query.businesses.findFirst({
    where: (b, { eq }) => eq(b.ownerUserId, userId),
    columns: { id: true, name: true },
  })

  if (!biz) redirect("/dashboard/profile")

  const categories = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
    columns: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step 5 of 5
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Add your first deal
        </h1>
        <p className="text-sm text-muted-foreground">
          Give customers a reason to visit <strong>{biz.name}</strong>. You can add more from your dashboard.
        </p>
      </div>

      <FirstDealForm />

      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <span>
          Almost there! After this step you&apos;ll land in your business dashboard.{" "}
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            Skip to dashboard →
          </Link>
        </span>
      </div>
    </div>
  )
}
