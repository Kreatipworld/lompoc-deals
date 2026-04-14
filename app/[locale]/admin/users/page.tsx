import { format } from "date-fns"
import { Users } from "lucide-react"
import {
  getAllUsersForAdmin,
  changeUserRoleAction,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"

export const metadata = { title: "Admin — Users" }

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  business: "bg-amber-50 text-amber-700 border-amber-200",
  local: "bg-muted text-muted-foreground border-border",
}

export default async function AdminUsersPage() {
  const allUsers = await getAllUsersForAdmin()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allUsers.length} total users
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total users"
          value={allUsers.length}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Admins"
          value={allUsers.filter((u) => u.role === "admin").length}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Business accounts"
          value={allUsers.filter((u) => u.role === "business").length}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Change role</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allUsers.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.email}</div>
                  {u.name && (
                    <div className="text-xs text-muted-foreground">{u.name}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${ROLE_STYLES[u.role] ?? ""}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(u.createdAt), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  <form action={changeUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="newRole"
                      defaultValue={u.role}
                      className="rounded-lg border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="local">local</option>
                      <option value="business">business</option>
                      <option value="admin">admin</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Save
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
