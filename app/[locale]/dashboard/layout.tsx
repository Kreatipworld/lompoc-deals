import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { Store, Tag, BarChart3, CreditCard } from "lucide-react"
import { auth } from "@/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "business") {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <aside className="lg:w-60">
        <div className="mb-4 px-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Business
          </h2>
        </div>
        <nav className="flex flex-row gap-1 lg:flex-col">
          <NavLink
            href="/dashboard/profile"
            icon={<Store className="h-4 w-4" />}
            label="Profile"
          />
          <NavLink
            href="/dashboard/deals"
            icon={<Tag className="h-4 w-4" />}
            label="Deals"
          />
          <NavLink
            href="/dashboard/stats"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Stats"
          />
          <NavLink
            href="/dashboard/billing"
            icon={<CreditCard className="h-4 w-4" />}
            label="Billing"
          />
        </nav>
      </aside>
      <main className="flex-1 space-y-6">{children}</main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground lg:flex-initial"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </Link>
  )
}
