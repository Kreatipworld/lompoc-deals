import { Star } from "lucide-react"

export function FeaturedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
      <Star className="h-3 w-3 fill-current" />
      {label}
    </span>
  )
}
