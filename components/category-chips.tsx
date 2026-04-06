import Link from "next/link"
import { getAllCategories } from "@/lib/queries"

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
        className={`rounded-full border px-3 py-1 text-sm transition ${
          !activeSlug
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent"
        }`}
      >
        All
      </Link>
      {cats.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className={`rounded-full border px-3 py-1 text-sm transition ${
            activeSlug === c.slug
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}
