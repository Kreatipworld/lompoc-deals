import { redirect } from "next/navigation"
import { LayoutDashboard, Store, Tag, BarChart3, CreditCard, Building2 } from "lucide-react"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getMyDeals } from "@/lib/biz-actions"
import { TIERS } from "@/lib/stripe"
import { DashboardNav } from "@/components/dashboard-nav"
import { isPast } from "date-fns"
import { getTranslations } from "next-intl/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, t] = await Promise.all([auth(), getTranslations("dashboardNav")])
  if (!session?.user || session.user.role !== "business") {
    redirect("/login")
  }

  const userId = Number(session.user.id)

  // Fetch active deal count + subscription tier in parallel (best-effort)
  let activeDealCount = 0
  let canListRealEstate = false
  try {
    const [deals, sub] = await Promise.all([
      getMyDeals(),
      db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) }),
    ])
    activeDealCount = deals.filter((d) => !isPast(d.expiresAt)).length
    const tier = sub?.tier ?? "free"
    canListRealEstate = TIERS[tier].canListRealEstate
  } catch {
    // silently ignore — layout must not hard-fail
  }

  const links = [
    { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: t("overview") },
    { href: "/dashboard/profile", icon: <Store className="h-4 w-4" />, label: t("profile") },
    { href: "/dashboard/deals", icon: <Tag className="h-4 w-4" />, label: t("deals"), badge: activeDealCount },
    { href: "/dashboard/stats", icon: <BarChart3 className="h-4 w-4" />, label: t("stats") },
    ...(canListRealEstate
      ? [{ href: "/dashboard/properties", icon: <Building2 className="h-4 w-4" />, label: t("properties") }]
      : []),
    { href: "/dashboard/billing", icon: <CreditCard className="h-4 w-4" />, label: t("billing") },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <aside className="lg:w-60">
        <div className="mb-4 px-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("businessSection")}
          </h2>
        </div>
        <DashboardNav links={links} />
      </aside>
      <main className="flex-1 space-y-6">{children}</main>
    </div>
  )
}
