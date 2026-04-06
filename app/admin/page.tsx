import {
  getPendingBusinesses,
  approveBusinessAction,
  rejectBusinessAction,
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export const metadata = { title: "Admin — Lompoc Deals" }

export default async function AdminPage() {
  const pending = await getPendingBusinesses()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pending businesses</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} waiting for approval
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing to review right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pending.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{b.name}</h3>
                {b.address && (
                  <p className="text-xs text-muted-foreground">{b.address}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {b.description && <p>{b.description}</p>}
                {b.website && (
                  <p>
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {b.website.replace(/^https?:\/\//, "")}
                    </a>
                  </p>
                )}
                {b.phone && <p>{b.phone}</p>}
              </CardContent>
              <CardFooter className="flex gap-2">
                <form action={approveBusinessAction}>
                  <input type="hidden" name="businessId" value={b.id} />
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={rejectBusinessAction}>
                  <input type="hidden" name="businessId" value={b.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Reject
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
