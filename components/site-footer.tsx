import Link from "next/link"
import { Flower2 } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Flower2 className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Lompoc Deals
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Local coupons, specials, and announcements from the Flower
              Capital of America.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              Browse
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Latest deals
                </Link>
              </li>
              <li>
                <Link href="/businesses" className="hover:text-foreground">
                  Business directory
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-foreground">
                  Map view
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/category/food-drink" className="hover:text-foreground">
                  Food &amp; Drink
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              For businesses
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/for-businesses" className="hover:text-foreground">
                  Why list with us
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground">
                  List your business
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/dashboard/profile" className="hover:text-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              Stay in touch
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/subscribe" className="hover:text-foreground">
                  Weekly digest
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Lompoc Deals · Lompoc, CA</p>
          <p>Made with care for the Flower Capital.</p>
        </div>
      </div>
    </footer>
  )
}
