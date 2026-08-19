import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { LayoutDashboard, Users, Tag, CalendarDays, Rss, Megaphone, LifeBuoy, Activity, Clock } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login")
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row">
      <aside className="lg:w-60">
        <div className="mb-4 px-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </h2>
        </div>
        <DashboardNav
          links={[
            {
              href: "/admin",
              icon: <LayoutDashboard className="h-4 w-4" />,
              label: "Overview",
            },
            {
              href: "/admin/health",
              icon: <Activity className="h-4 w-4" />,
              label: "Health",
            },
            {
              href: "/admin/comms",
              icon: <Megaphone className="h-4 w-4" />,
              label: "Comms",
            },
            {
              href: "/admin/users",
              icon: <Users className="h-4 w-4" />,
              label: "Users",
            },
            {
              href: "/admin/deals",
              icon: <Tag className="h-4 w-4" />,
              label: "Deals",
            },
            {
              href: "/admin/events",
              icon: <CalendarDays className="h-4 w-4" />,
              label: "Events",
            },
            {
              href: "/admin/feed",
              icon: <Rss className="h-4 w-4" />,
              label: "Feed moderation",
            },
            {
              href: "/admin/support",
              icon: <LifeBuoy className="h-4 w-4" />,
              label: "Support",
            },
            {
              href: "/admin/automation",
              icon: <Clock className="h-4 w-4" />,
              label: "Automation",
            },
          ]}
        />
      </aside>
      <main className="flex-1 space-y-6">{children}</main>
    </div>
  )
}
