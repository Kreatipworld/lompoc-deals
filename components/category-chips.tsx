import Link from "next/link"
import {
  Utensils,
  ShoppingBag,
  Wrench,
  Heart,
  Car,
  Ticket,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { getAllCategories } from "@/lib/queries"

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  wrench: Wrench,
  heart: Heart,
  car: Car,
  ticket: Ticket,
  "more-horizontal": MoreHorizontal,
}

export async function CategoryChips({
  activeSlug,
}: {
  activeSlug?: string
}) {
  const cats = await getAllCategories()
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
          !activeSlug
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background hover:border-primary/40 hover:bg-accent"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        All
      </Link>
      {cats.map((c) => {
        const Icon = ICONS[c.icon ?? ""] ?? MoreHorizontal
        const active = activeSlug === c.slug
        return (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background hover:border-primary/40 hover:bg-accent"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {c.name}
          </Link>
        )
      })}
    </div>
  )
}
