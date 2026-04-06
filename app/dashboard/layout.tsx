import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "business") {
    redirect("/login?from=/dashboard/profile")
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:flex-row">
      <aside className="sm:w-48">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Business
        </h2>
        <nav className="flex flex-row gap-1 sm:flex-col">
          <Link
            href="/dashboard/profile"
            className="rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/deals"
            className="rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Deals
          </Link>
          <Link
            href="/dashboard/stats"
            className="rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Stats
          </Link>
        </nav>
      </aside>
      <main className="flex-1 space-y-6">{children}</main>
    </div>
  )
}
