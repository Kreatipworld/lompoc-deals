"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Search, Building2, Tag, LayoutGrid, BookOpen, Clock, X } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { instantSearch, type SearchIndex, type InstantResults } from "@/lib/search/instant"

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

/** The words people actually type most (search_run data, 60 days). */
const POPULAR_QUERIES = ["pizza", "tacos", "coffee", "plumbing", "hair", "wine"]
const RECENT_KEY = "ll_recent_searches"
const INDEX_KEY = "ll_search_index_v1"

type DealHit = { id: number; title: string; discountText: string | null; bizId: number; bizName: string; bizSlug: string }
type Suggestion =
  | { type: "wordPage"; slug: string; label: string }
  | { type: "category"; slug: string; label: string; count: number }
  | { type: "biz"; slug: string; label: string; sub?: string; logoUrl: string | null; member: boolean }
  | { type: "deal"; slug: string; label: string; sub: string; discount: string | null }

// ─── Index: fetched once per page load, kept for the session ─────────────────
let indexPromise: Promise<SearchIndex | null> | null = null
function loadIndex(): Promise<SearchIndex | null> {
  if (indexPromise) return indexPromise
  indexPromise = (async () => {
    try {
      const cached = sessionStorage.getItem(INDEX_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as { at: number; index: SearchIndex }
        if (Date.now() - parsed.at < 10 * 60 * 1000 && parsed.index?.v === 1) return parsed.index
      }
    } catch { /* storage unavailable — fetch instead */ }
    try {
      const res = await fetch("/api/search/index")
      if (!res.ok) throw new Error(String(res.status))
      const index = (await res.json()) as SearchIndex
      try { sessionStorage.setItem(INDEX_KEY, JSON.stringify({ at: Date.now(), index })) } catch { /* ignore */ }
      return index
    } catch {
      indexPromise = null // let a later focus retry
      return null
    }
  })()
  return indexPromise
}

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string").slice(0, 5) : []
  } catch { return [] }
}
function pushRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}

/** Fire-and-forget: which suggestion a person picked for which query. */
function trackPick(query: string, kind: "business" | "category" | "wordPage" | "deal" | "query", target: string) {
  try {
    const body = JSON.stringify({ name: "search_pick", props: { query: query.slice(0, 120), kind, target: target.slice(0, 200) } })
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/event", new Blob([body], { type: "application/json" }))
    } else {
      void fetch("/api/track/event", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {})
    }
  } catch { /* analytics never breaks search */ }
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
        timerRef.current = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 55)
      } else {
        timerRef.current = setTimeout(() => setPhase("pausing"), 1800)
      }
    } else if (phase === "pausing") {
      timerRef.current = setTimeout(() => setPhase("erasing"), 400)
    } else {
      if (displayed.length > 0) {
        timerRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30)
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
  autoFocus = false,
  scrim = false,
  onNavigate,
  mobileSheet = false,
}: {
  defaultValue?: string
  size?: "default" | "lg"
  /** Focus the input on mount (used by the header search overlay). */
  autoFocus?: boolean
  /** Dim the page behind the suggestions so they read as a floating panel
   *  instead of colliding with content below (used on the inline hero). */
  scrim?: boolean
  /** Called after any navigation, so a wrapping overlay can close itself. */
  onNavigate?: () => void
  /** Full-screen phone mode: the panel renders inline under the input instead of floating. */
  mobileSheet?: boolean
}) {
  const locale = useLocale()
  const t = useTranslations("searchBar")
  const router = useRouter()
  const isLarge = size === "lg"
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const [value, setValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [local, setLocal] = useState<InstantResults | null>(null)
  const [deals, setDeals] = useState<DealHit[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const dealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dealSeq = useRef(0)

  const [anchor, setAnchor] = useState<{ left: number; top: number; bottom: number; width: number; height: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const showTypewriter = focused === false && value === ""
  const typedPlaceholder = useTypewriter(EXAMPLE_QUERIES, showTypewriter)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // The index arrives once; until then, typing still works (Enter searches the server).
  const ensureIndex = useCallback(() => {
    if (index) return
    void loadIndex().then((ix) => { if (ix) setIndex(ix) })
  }, [index])

  // Instant local matching on every keystroke — no debounce, no network.
  useEffect(() => {
    if (!index) return
    const q = value.trim()
    setLocal(q.length >= 2 ? instantSearch(index, q, 8) : null)
  }, [index, value])

  // Deals still come from the server (they change hourly); debounced, and never reorder local hits.
  const fetchDeals = useCallback(async (q: string) => {
    const seq = ++dealSeq.current
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}&locale=${locale}`)
      const data = (await res.json()) as { deals?: DealHit[] }
      if (seq === dealSeq.current) setDeals((data.deals ?? []).slice(0, 3))
    } catch {
      if (seq === dealSeq.current) setDeals([])
    }
  }, [locale])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    setActiveIdx(-1)
    ensureIndex()
    if (dealTimer.current) clearTimeout(dealTimer.current)
    if (q.trim().length < 2) { setDeals([]); return }
    dealTimer.current = setTimeout(() => fetchDeals(q.trim()), 200)
  }

  const close = () => {
    setLocal(null)
    setDeals([])
    setFocused(false)
    setActiveIdx(-1)
  }

  const go = (href: string) => {
    close()
    router.push(href)
    onNavigate?.()
  }
  const navigateToSearch = (q: string) => {
    const query = q.trim()
    if (!query) return
    pushRecent(query)
    trackPick(query, "query", `/search?q=${query}`)
    setValue(query)
    go(`/search?q=${encodeURIComponent(query)}`)
  }
  const pick = (s: Suggestion) => {
    const q = value.trim()
    if (q) pushRecent(q)
    if (s.type === "biz") { trackPick(q, "business", s.slug); setValue(""); go(`/biz/${s.slug}`) }
    else if (s.type === "category") { trackPick(q, "category", s.slug); setValue(""); go(`/category/${s.slug}`) }
    else if (s.type === "wordPage") { trackPick(q, "wordPage", s.slug); setValue(""); go(`/find/${s.slug}`) }
    else { trackPick(q, "deal", s.slug); setValue(""); go(`/biz/${s.slug}`) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIdx >= 0 && suggestions[activeIdx]) pick(suggestions[activeIdx])
    else navigateToSearch(value)
  }

  // Close on outside click (the panel is portalled, so both trees count as inside).
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      close()
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!local) return []
    const title = (w: { en: string; es: string }) => (locale === "es" ? w.es : w.en)
    return [
      ...local.wordPages.map((w) => ({ type: "wordPage" as const, slug: w.s, label: title(w) })),
      ...local.categories.map((c) => ({ type: "category" as const, slug: c.s, label: c.n, count: c.c })),
      ...local.businesses.map((b) => ({ type: "biz" as const, slug: b.s, label: b.n, sub: index?.c.find((c) => c.s === b.c)?.n, logoUrl: b.logoUrl, member: b.t > 0 })),
      ...deals.map((d) => ({ type: "deal" as const, slug: d.bizSlug, label: d.title, sub: d.bizName, discount: d.discountText })),
    ]
  }, [local, deals, locale, index])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { close(); inputRef.current?.blur(); return }
    if (!suggestions.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    }
  }

  const typed = value.trim().length >= 2
  const hasResults = suggestions.length > 0
  const showDropdown = focused && typed && (hasResults || !!index)
  const showIdle = focused && !typed
  const panelOpen = showDropdown || showIdle

  useEffect(() => {
    if (!panelOpen || mobileSheet) return
    const measure = () => {
      const r = formRef.current?.getBoundingClientRect()
      if (r) setAnchor({ left: r.left, top: r.top, bottom: r.bottom, width: r.width, height: r.height })
    }
    measure()
    window.addEventListener("scroll", measure, true)
    window.addEventListener("resize", measure)
    return () => {
      window.removeEventListener("scroll", measure, true)
      window.removeEventListener("resize", measure)
    }
  }, [panelOpen, mobileSheet])

  // Portal (desktop) or inline sheet (phones). See the earlier note: as an absolute child the panel
  // lost the z-order fight with positioned cards below the hero, so it lives on <body>.
  const portal = (node: React.ReactNode) => {
    if (mobileSheet) return <div ref={panelRef} className="mt-2">{node}</div>
    return mounted && anchor
      ? createPortal(
          <div ref={panelRef} style={{ position: "fixed", left: anchor.left, top: anchor.bottom, width: anchor.width, zIndex: 100 }}>
            {node}
          </div>,
          document.body
        )
      : null
  }

  const panelShell = mobileSheet
    ? "overflow-y-auto rounded-2xl border border-border bg-background shadow-sm"
    : "max-h-[min(70vh,32rem)] overflow-y-auto rounded-b-2xl border border-t-0 border-border bg-background shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-150"
  const row = `flex w-full items-center gap-3 px-4 text-left transition-colors hover:bg-accent ${mobileSheet ? "min-h-[48px] py-3" : "min-h-[44px] py-2.5"}`
  const heading = "px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
  const iconBox = "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"

  const popularChips = useMemo(() => {
    const pages = (index?.w ?? []).slice(0, 4).map((w) => ({ label: locale === "es" ? w.es.replace(/ en Lompoc$/i, "") : w.en.replace(/ in Lompoc$/i, ""), href: `/find/${w.s}`, kind: "wordPage" as const, slug: w.s }))
    const words = POPULAR_QUERIES.filter((q) => !pages.some((p) => p.slug === q)).slice(0, 4).map((q) => ({ label: q, href: `/search?q=${encodeURIComponent(q)}`, kind: "query" as const, slug: q }))
    return [...pages, ...words]
  }, [index, locale])

  return (
    <div ref={containerRef} className={`relative w-full ${panelOpen && !mobileSheet ? "z-[101]" : ""}`}>
      {scrim && panelOpen && !mobileSheet && mounted && anchor &&
        createPortal(
          <div
            aria-hidden
            className="fixed motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
            style={{ zIndex: 99, left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height, borderRadius: "9999px 9999px 0 0", boxShadow: "0 0 0 9999px rgba(0,0,0,0.34)", pointerEvents: "none" }}
          />,
          document.body
        )}
      <form ref={formRef} onSubmit={handleSubmit} className="relative w-full" role="search">
        <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${isLarge ? "h-5 w-5" : "h-4 w-4"}`} />
        {showTypewriter && typedPlaceholder && (
          <span aria-hidden className={`pointer-events-none absolute top-1/2 -translate-y-1/2 select-none text-muted-foreground/60 ${isLarge ? "left-12 text-base" : "left-11 text-sm"}`}>
            {typedPlaceholder}
            <span className="ml-px inline-block w-[2px] animate-pulse bg-muted-foreground/60 align-middle" style={{ height: "1em" }} />
          </span>
        )}
        <input
          ref={inputRef}
          name="q"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={handleChange}
          onFocus={() => { setFocused(true); ensureIndex(); setRecent(readRecent()) }}
          onKeyDown={handleKeyDown}
          placeholder={showTypewriter ? "" : t("placeholder")}
          className={`w-full rounded-full border border-border bg-background pl-12 pr-10 shadow-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4 ${isLarge ? "h-14 text-base" : "h-11 text-sm"} ${panelOpen && !mobileSheet ? "rounded-b-none rounded-t-full ring-4" : ""}`}
        />
        {value && (
          <button
            type="button"
            aria-label={t("cancel")}
            onMouseDown={(e) => { e.preventDefault(); setValue(""); setLocal(null); setDeals([]); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {showDropdown && portal(
        <div className={panelShell} role="listbox">
          {(() => {
            let i = -1
            const idx = () => ++i
            const wordPages = suggestions.filter((s) => s.type === "wordPage")
            const cats = suggestions.filter((s) => s.type === "category")
            const bizs = suggestions.filter((s) => s.type === "biz")
            const dealRows = suggestions.filter((s) => s.type === "deal")
            return (
              <>
                {wordPages.length > 0 && (
                  <div>
                    <div className={heading}>{t("pages")}</div>
                    {wordPages.map((s) => { const n = idx(); return (
                      <button key={`w-${s.slug}`} type="button" role="option" aria-selected={activeIdx === n} onMouseDown={() => pick(s)} className={`${row} ${activeIdx === n ? "bg-accent" : ""}`}>
                        <div className={iconBox}><BookOpen className="h-3.5 w-3.5" /></div>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">{s.label}</p>
                        <span className="text-xs text-muted-foreground">{t("wordPage")}</span>
                      </button>
                    ) })}
                  </div>
                )}
                {cats.length > 0 && (
                  <div>
                    <div className={heading}>{t("categories")}</div>
                    {cats.map((s) => { const n = idx(); return s.type === "category" && (
                      <button key={`c-${s.slug}`} type="button" role="option" aria-selected={activeIdx === n} onMouseDown={() => pick(s)} className={`${row} ${activeIdx === n ? "bg-accent" : ""}`}>
                        <div className={iconBox}><LayoutGrid className="h-3.5 w-3.5" /></div>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">{s.label}</p>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">{t("placesCount", { count: s.count })}</span>
                      </button>
                    ) })}
                  </div>
                )}
                {bizs.length > 0 && (
                  <div>
                    <div className={heading}>{t("businesses")}</div>
                    {bizs.map((s) => { const n = idx(); return s.type === "biz" && (
                      <button key={`b-${s.slug}`} type="button" role="option" aria-selected={activeIdx === n} onMouseDown={() => pick(s)} className={`${row} ${activeIdx === n ? "bg-accent" : ""}`}>
                        {s.logoUrl ? (
                          <SafeImage src={s.logoUrl} alt={s.label} className="h-8 w-8 flex-shrink-0 rounded-lg object-cover" fallback={<div className={iconBox}><Building2 className="h-3.5 w-3.5" /></div>} />
                        ) : (
                          <div className={iconBox}><Building2 className="h-3.5 w-3.5" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.label}</p>
                          {s.sub && <p className="truncate text-xs text-muted-foreground">{s.sub}</p>}
                        </div>
                        {s.member && <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{t("member")}</span>}
                      </button>
                    ) })}
                  </div>
                )}
                {dealRows.length > 0 && (
                  <div className={bizs.length > 0 ? "border-t" : ""}>
                    <div className={heading}>{t("deals")}</div>
                    {dealRows.map((s) => { const n = idx(); return s.type === "deal" && (
                      <button key={`d-${s.slug}-${s.label}`} type="button" role="option" aria-selected={activeIdx === n} onMouseDown={() => pick(s)} className={`${row} ${activeIdx === n ? "bg-accent" : ""}`}>
                        <div className={iconBox}><Tag className="h-3.5 w-3.5" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.label}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.sub}</p>
                        </div>
                        {s.discount && <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{s.discount}</span>}
                      </button>
                    ) })}
                  </div>
                )}
                {!hasResults && <div className="px-4 py-3 text-sm text-muted-foreground">{t("noMatch")}</div>}
                <div className="border-t px-4 py-2">
                  <button type="button" onMouseDown={() => navigateToSearch(value)} className="flex min-h-[40px] w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <Search className="h-3 w-3" />
                    {t("searchFor")} &ldquo;<span className="font-medium text-foreground">{value.trim()}</span>&rdquo;
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {showIdle && portal(
        <div className={`${panelShell} overflow-hidden`}>
          {recent.length > 0 && (
            <div>
              <div className={`${heading} flex items-center justify-between`}>
                <span>{t("recent")}</span>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); try { localStorage.removeItem(RECENT_KEY) } catch { /* ignore */ } setRecent([]) }} className="normal-case tracking-normal hover:text-foreground">{t("clearRecent")}</button>
              </div>
              {recent.map((q) => (
                <button key={q} type="button" onMouseDown={() => navigateToSearch(q)} className={row}>
                  <div className={iconBox}><Clock className="h-3.5 w-3.5" /></div>
                  <p className="min-w-0 flex-1 truncate text-sm">{q}</p>
                </button>
              ))}
            </div>
          )}
          <div className={heading}>{t("popular")}</div>
          <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
            {popularChips.map((c) => (
              <button
                key={c.href}
                type="button"
                onMouseDown={() => { trackPick("", c.kind, c.slug); if (c.kind === "query") navigateToSearch(c.slug); else go(c.href) }}
                className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-accent"
              >
                {c.kind === "wordPage" ? <BookOpen className="h-3.5 w-3.5 text-primary" /> : <Search className="h-3.5 w-3.5 text-primary" />}
                {c.label}
              </button>
            ))}
          </div>
          {index && (
            <>
              <div className={heading}>{t("discover")}</div>
              <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
                {index.c.filter((c) => c.c > 0 && c.s !== "other").sort((a, b) => b.c - a.c).slice(0, 6).map((c) => (
                  <button key={c.s} type="button" onMouseDown={() => { trackPick("", "category", c.s); go(`/category/${c.s}`) }} className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-accent">
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    {c.n}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
