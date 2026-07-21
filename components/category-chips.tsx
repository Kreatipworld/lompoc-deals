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
  type LucideIcon,
} from "lucide-react"
import { getAllCategories } from "@/lib/queries"
import { CategoryChipRow } from "@/components/category-chip-row"

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  wrench: Wrench,
  heart: Heart,
  car: Car,
  ticket: Ticket,
  "more-horizontal": MoreHorizontal,
  home: Home,
}

type OpenNowChip = {
  /** Whether the `?open=1` filter is currently active. */
  active: boolean
  /** Href that toggles the filter — built by the caller so the
   *  `?open=1` param logic lives in exactly one place. */
  href: string
  label: string
}

const CHIP_CLASSES =
  "inline-flex min-h-11 flex-shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition"

export async function CategoryChips({
  activeSlug,
  openNow,
}: {
  activeSlug?: string
  /** Renders the "Open now" toggle as the first chip in the row. Omit to hide it (e.g. real estate). */
  openNow?: OpenNowChip
}) {
  const cats = await getAllCategories()
  return (
    <CategoryChipRow>
      {openNow && (
        <Link
          href={openNow.href}
          data-active={openNow.active ? "true" : undefined}
          className={`${CHIP_CLASSES} transition-colors ${
            openNow.active
              ? "border-success bg-success/10 text-success"
              : "bg-card text-muted-foreground hover:border-foreground/30"
          }`}
        >
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${
              openNow.active ? "bg-success" : "bg-muted-foreground/40"
            }`}
          />
          {openNow.label}
        </Link>
      )}
      <Link
        href="/"
        data-active={!activeSlug ? "true" : undefined}
        className={`${CHIP_CLASSES} ${
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
            data-active={active ? "true" : undefined}
            className={`${CHIP_CLASSES} ${
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
    </CategoryChipRow>
  )
}
