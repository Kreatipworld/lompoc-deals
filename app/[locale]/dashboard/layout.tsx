import { redirect } from "next/navigation"
import { LayoutDashboard, Store, Tag, BarChart3, CreditCard, Wallet } from "lucide-react"
import { auth } from "@/auth"
import { getMyDeals } from "@/lib/biz-actions"
import { DashboardNav } from "@/components/dashboard-nav"
import { isPast } from "date-fns"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "business") {
    redirect("/login")
  }

  // Fetch active deal count for the badge (best-effort — won't crash the layout)
  let activeDealCount = 0
  try {
    const deals = await getMyDeals()
    activeDealCount = deals.filter((d) => !isPast(d.expiresAt)).length
  } catch {
    // silently ignore — layout must not hard-fail
  }

  const links = [
    { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Overview" },
    { href: "/dashboard/profile", icon: <Store className="h-4 w-4" />, label: "Profile" },
    { href: "/dashboard/deals", icon: <Tag className="h-4 w-4" />, label: "Deals", badge: activeDealCount },
    { href: "/dashboard/stats", icon: <BarChart3 className="h-4 w-4" />, label: "Stats" },
    { href: "/dashboard/billing", icon: <CreditCard className="h-4 w-4" />, label: "Billing" },
    { href: "/dashboard/payouts", icon: <Wallet className="h-4 w-4" />, label: "Payouts" },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <aside className="lg:w-60">
        <div className="mb-4 px-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Business
          </h2>
        </div>
        <DashboardNav links={links} />
      </aside>
      <main className="flex-1 space-y-6">{children}</main>
    </div>
  )
}
