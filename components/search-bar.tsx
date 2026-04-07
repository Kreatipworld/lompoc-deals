"use client"

import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function SearchBar({
  defaultValue = "",
  size = "default",
}: {
  defaultValue?: string
  size?: "default" | "lg"
}) {
  const router = useRouter()
  const isLarge = size === "lg"
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = new FormData(e.currentTarget).get("q")?.toString().trim()
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
      }}
      className="relative w-full"
    >
      <Search
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${
          isLarge ? "h-5 w-5" : "h-4 w-4"
        }`}
      />
      <input
        name="q"
        type="search"
        placeholder="Search deals or businesses…"
        defaultValue={defaultValue}
        className={`w-full rounded-full border border-border bg-background pl-12 pr-4 shadow-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4 ${
          isLarge ? "h-14 text-base" : "h-11 text-sm"
        }`}
      />
    </form>
  )
}
