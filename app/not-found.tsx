import Link from "next/link"
import { MapPin } from "lucide-react"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <MapPin className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Not found</h1>
      <p className="mt-2 text-muted-foreground">
        That page doesn&apos;t exist (or maybe it was unpublished).
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Back to feed
      </Link>
    </div>
  )
}
