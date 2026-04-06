import Link from "next/link"
import { MapPin } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MapPin className="h-5 w-5" />
          Lompoc Deals
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Feed
          </Link>
          <Link href="/map" className="hover:underline">
            Map
          </Link>
          <Link href="/subscribe" className="hover:underline">
            Subscribe
          </Link>
          <Link href="/login" className="hover:underline">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
