import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login?from=/admin")
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Approve businesses and remove spam.
        </p>
      </div>
      {children}
    </div>
  )
}
