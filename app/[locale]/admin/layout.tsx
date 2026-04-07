import { redirect } from "next/navigation"
import { auth } from "@/auth"

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
    <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
  )
}
