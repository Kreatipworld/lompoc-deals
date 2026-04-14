import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { LayoutDashboard, Users, Tag, CalendarDays } from "lucide-react"

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <DashboardNav
          links={[
            {
              href: "/admin",
              icon: <LayoutDashboard className="h-4 w-4" />,
              label: "Overview",
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
          ]}
        />
      </div>
      {children}
    </div>
  )
}
