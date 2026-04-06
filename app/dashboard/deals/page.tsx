import Link from "next/link"
import { format } from "date-fns"
import { getMyBusiness, getMyDeals, deleteDealAction } from "@/lib/biz-actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

export const metadata = { title: "My deals — Lompoc Deals" }

export default async function MyDealsPage() {
  const [biz, deals] = await Promise.all([getMyBusiness(), getMyDeals()])

  if (!biz) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">My deals</h1>
        <p className="text-sm text-muted-foreground">
          You need to{" "}
          <Link href="/dashboard/profile" className="underline">
            create a business profile
          </Link>{" "}
          before you can post deals.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My deals</h1>
          <p className="text-sm text-muted-foreground">
            {deals.length} total
          </p>
        </div>
        <Link href="/dashboard/deals/new" className={buttonVariants()}>
          + New deal
        </Link>
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No deals yet. Click &ldquo;New deal&rdquo; to post your first one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {deals.map((d) => {
            const expired = new Date(d.expiresAt) < new Date()
            return (
              <Card key={d.id}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{d.type}</Badge>
                    {expired && <Badge variant="destructive">expired</Badge>}
                    {d.discountText && <Badge>{d.discountText}</Badge>}
                  </div>
                  <h3 className="text-lg font-semibold leading-tight">
                    {d.title}
                  </h3>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {d.description}
                  <div className="mt-2 text-xs">
                    Expires {format(new Date(d.expiresAt), "PPP")}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Link
                    href={`/dashboard/deals/edit/${d.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                  <form action={deleteDealAction}>
                    <input type="hidden" name="dealId" value={d.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      {expired ? "Hide" : "Soft-delete"}
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
