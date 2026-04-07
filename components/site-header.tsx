import Link from "next/link"
import { Flower2 } from "lucide-react"
import { UserMenu } from "@/components/user-menu"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="Lompoc Deals home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-105">
            <Flower2 className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Lompoc Deals
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Feed
          </Link>
          <Link
            href="/businesses"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Directory
          </Link>
          <Link
            href="/map"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Map
          </Link>
          <Link
            href="/subscribe"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Subscribe
          </Link>
          <Link
            href="/for-businesses"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            For businesses
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </div>

      <nav className="flex items-center justify-around border-t px-4 py-2 sm:hidden">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Feed
        </Link>
        <Link
          href="/businesses"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Directory
        </Link>
        <Link
          href="/map"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Map
        </Link>
        <Link
          href="/subscribe"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Subscribe
        </Link>
      </nav>
    </header>
  )
}
