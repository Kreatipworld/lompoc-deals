import Link from "next/link"
import { auth } from "@/auth"
import { logoutAction } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Signed in as {role}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === "business" && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">Business dashboard</Link>
          </DropdownMenuItem>
        )}
        {role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin</Link>
          </DropdownMenuItem>
        )}
        {role === "local" && (
          <DropdownMenuItem asChild>
            <Link href="/favorites">My favorites</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logoutAction}>
            <button type="submit" className="w-full text-left">
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
