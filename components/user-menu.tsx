import Link from "next/link"
import { auth } from "@/auth"
import { logoutAction } from "@/lib/auth-actions"

export async function UserMenu() {
  const session = await auth()

  if (!session?.user) {
    return (
      <Link href="/login" className="text-sm hover:underline">
        Sign in
      </Link>
    )
  }

  const { email, role } = session.user

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border px-3 py-1 text-sm hover:bg-accent">
        {email}
      </summary>
      <div className="absolute right-0 z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
        <div className="px-3 py-1.5 text-xs text-muted-foreground">
          Signed in as {role}
        </div>
        <div className="my-1 border-t" />
        {role === "business" && (
          <Link
            href="/dashboard/profile"
            className="block px-3 py-1.5 text-sm hover:bg-accent"
          >
            Business dashboard
          </Link>
        )}
        {role === "admin" && (
          <Link
            href="/admin"
            className="block px-3 py-1.5 text-sm hover:bg-accent"
          >
            Admin
          </Link>
        )}
        {role === "local" && (
          <Link
            href="/favorites"
            className="block px-3 py-1.5 text-sm hover:bg-accent"
          >
            My favorites
          </Link>
        )}
        <div className="my-1 border-t" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  )
}
