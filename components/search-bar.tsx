"use client"

import { useRouter } from "@/i18n/navigation"
import { Search, Building2, Tag } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"

// Example queries that cycle through the typewriter animation
const EXAMPLE_QUERIES = [
  "pizza near downtown…",
  "wine tasting deals…",
  "hair salon specials…",
  "auto repair coupons…",
  "coffee shops…",
  "yoga classes…",
  "fresh flowers…",
  "local restaurants…",
]

type AutocompleteResult = {
  businesses: { id: number; name: string; slug: string; logoUrl: string | null; categoryName: string | null }[]
  deals: { id: number; title: string; discountText: string | null; bizId: number; bizName: string; bizSlug: string }[]
}

function useTypewriter(examples: string[], active: boolean) {
  const [displayed, setDisplayed] = useState("")
  const [exIdx, setExIdx] = useState(0)
  const [phase, setPhase] = useState<"typing" | "pausing" | "erasing">("typing")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) {
      setDisplayed("")
      return
    }

    const current = examples[exIdx]

    if (phase === "typing") {
      if (displayed.length < current.length) {
        timerRef.current = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1))
        }, 55)
      } else {
        timerRef.current = setTimeout(() => setPhase("pausing"), 1800)
      }
    } else if (phase === "pausing") {
      timerRef.current = setTimeout(() => setPhase("erasing"), 400)
    } else {
      if (displayed.length > 0) {
        timerRef.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1))
        }, 30)
      } else {
        setExIdx((i) => (i + 1) % examples.length)
        setPhase("typing")
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, displayed, exIdx, phase, examples])

  return displayed
}

export function SearchBar({
  defaultValue = "",
  size = "default",
}: {
  defaultValue?: string
  size?: "default" | "lg"
}) {
  const router = useRouter()
  const isLarge = size === "lg"
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [value, setValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<AutocompleteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTypewriter = focused === false && value === ""
  const typedPlaceholder = useTypewriter(EXAMPLE_QUERIES, showTypewriter)

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`)
      const data: AutocompleteResult = await res.json()
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    setActiveIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 250)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (q) {
      setResults(null)
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const navigateToBiz = (slug: string) => {
    setResults(null)
    setValue("")
    router.push(`/biz/${slug}`)
  }

  const navigateToSearch = (q: string) => {
    setResults(null)
    setValue(q)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Build flat suggestion list for keyboard nav
  const allSuggestions: Array<{ type: "biz" | "deal"; slug: string; label: string; sub?: string }> = [
    ...(results?.businesses ?? []).map((b) => ({
      type: "biz" as const,
      slug: b.slug,
      label: b.name,
      sub: b.categoryName ?? undefined,
    })),
    ...(results?.deals ?? []).map((d) => ({
      type: "deal" as const,
      slug: d.bizSlug,
      label: d.title,
      sub: d.bizName,
    })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!allSuggestions.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, allSuggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault()
      const s = allSuggestions[activeIdx]
      if (s.type === "biz") navigateToBiz(s.slug)
      else navigateToSearch(s.label)
    } else if (e.key === "Escape") {
      setResults(null)
      setActiveIdx(-1)
    }
  }

  const showDropdown = focused && results && (results.businesses.length > 0 || results.deals.length > 0)

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${
            isLarge ? "h-5 w-5" : "h-4 w-4"
          }`}
        />

        {/* Typewriter placeholder overlay — shown only when empty and unfocused */}
        {showTypewriter && typedPlaceholder && (
          <span
            aria-hidden
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/60 select-none ${
              isLarge ? "left-12 text-base" : "left-11 text-sm"
            }`}
          >
            {typedPlaceholder}
            <span className="ml-px inline-block w-[2px] animate-pulse bg-muted-foreground/60 align-middle" style={{ height: "1em" }} />
          </span>
        )}

        <input
          ref={inputRef}
          name="q"
          type="search"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={showTypewriter ? "" : "Search deals or businesses…"}
          className={`w-full rounded-full border border-border bg-background pl-12 pr-4 shadow-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4 ${
            isLarge ? "h-14 text-base" : "h-11 text-sm"
          } ${showDropdown ? "rounded-b-none rounded-t-full ring-4" : ""}`}
        />
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 rounded-b-2xl border border-t-0 border-border bg-background shadow-lg overflow-hidden">
          {results!.businesses.length > 0 && (
            <div>
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Businesses
              </div>
              {results!.businesses.map((biz, i) => (
                <button
                  key={biz.id}
                  type="button"
                  onMouseDown={() => navigateToBiz(biz.slug)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent ${
                    activeIdx === i ? "bg-accent" : ""
                  }`}
                >
                  {biz.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={biz.logoUrl} alt={biz.name} className="h-7 w-7 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{biz.name}</p>
                    {biz.categoryName && (
                      <p className="truncate text-xs text-muted-foreground">{biz.categoryName}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results!.deals.length > 0 && (
            <div className={results!.businesses.length > 0 ? "border-t" : ""}>
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Deals
              </div>
              {results!.deals.map((deal, i) => {
                const idx = results!.businesses.length + i
                return (
                  <button
                    key={deal.id}
                    type="button"
                    onMouseDown={() => navigateToSearch(deal.title)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent ${
                      activeIdx === idx ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Tag className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{deal.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{deal.bizName}</p>
                    </div>
                    {deal.discountText && (
                      <span className="ml-auto flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {deal.discountText}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {loading && (
            <div className="px-4 py-3 text-center text-xs text-muted-foreground">
              Searching…
            </div>
          )}

          <div className="border-t px-4 py-2">
            <button
              type="button"
              onMouseDown={() => navigateToSearch(value)}
              className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-3 w-3" />
              Search for &ldquo;<span className="font-medium text-foreground">{value}</span>&rdquo;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
