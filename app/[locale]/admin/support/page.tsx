import { listTickets } from "@/lib/support-actions"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
}

export default async function AdminSupportPage() {
  const tickets = await listTickets()

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Support tickets</h1>
        <p className="text-muted-foreground">
          Bug reports and questions from members. Newest first.
        </p>
      </header>

      {tickets.length === 0 ? (
        <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          No tickets yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((tk) => (
            <li key={tk.id} className="rounded-2xl border bg-card p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[tk.status] ?? "bg-muted"}`}>
                  {tk.status}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">{tk.category}</span>
                <span className="text-muted-foreground">{tk.businessName ?? "—"}</span>
                <span className="text-muted-foreground">
                  · {format(new Date(tk.createdAt), "MMM d, yyyy h:mma")}
                </span>
              </div>
              <div className="font-semibold">{tk.subject}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{tk.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
