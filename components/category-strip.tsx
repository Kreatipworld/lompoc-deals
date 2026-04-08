import { Link } from "@/i18n/navigation"
import {
  Utensils,
  ShoppingBag,
  Wrench,
  Heart,
  Car,
  Ticket,
  MoreHorizontal,
  Sparkles,
  Home,
  Wine,
  Leaf,
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
  home: Home,
  wine: Wine,
  leaf: Leaf,
  cannabis: Leaf,
}

export async function CategoryStrip({
  activeSlug,
}: {
  activeSlug?: string
}) {
  const cats = await getAllCategories()

  const items = [
    {
      slug: null,
      name: "All",
      Icon: Sparkles,
      href: "/",
    },
    ...cats.map((c) => ({
      slug: c.slug,
      name: c.name,
      Icon: ICONS[c.icon ?? ""] ?? MoreHorizontal,
      href: `/category/${c.slug}`,
    })),
  ]

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-6xl px-4">
        <div className="scrollbar-none flex items-stretch justify-center gap-1 overflow-x-auto py-3 sm:gap-2">
          {items.map(({ slug, name, Icon, href }) => {
            const active = slug === (activeSlug ?? null)
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex min-w-[78px] flex-shrink-0 flex-col items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition ${
                    active ? "text-primary" : "group-hover:text-foreground"
                  }`}
                  strokeWidth={1.75}
                />
                <span className="whitespace-nowrap text-[11px] font-medium tracking-wide">
                  {name}
                </span>
                <span
                  className={`absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full transition ${
                    active ? "bg-foreground" : "bg-transparent"
                  }`}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
