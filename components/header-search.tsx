"use client"

import { Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { SearchBar } from "@/components/search-bar"

/**
 * Search icon in the site header. Opens the instant search:
 *  - phones (< sm): a full-screen sheet with the field pinned at the top, a
 *    visible Cancel, and results inline underneath — nothing floats, nothing
 *    hides behind the bottom bar;
 *  - larger screens: the centered panel over a dimmed page.
 * Closes on Esc, backdrop click, Cancel, or after navigating.
 */
export function HeaderSearch() {
  const t = useTranslations("nav")
  const tb = useTranslations("searchBar")
  const [open, setOpen] = useState(false)
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const apply = () => setIsPhone(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && isPhone && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={t("search")}>
          <div className="flex items-center gap-2 border-b px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div className="flex-1">
              <SearchBar size="lg" autoFocus mobileSheet onNavigate={() => setOpen(false)} />
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex-shrink-0 px-2 py-2 text-sm font-semibold text-primary">
              {tb("cancel")}
            </button>
          </div>
          {/* The SearchBar renders its results inline under the field in mobileSheet mode; this
              spacer just keeps the sheet scrollable and clear of the bottom bar. */}
          <div className="flex-1 overflow-y-auto px-3 pb-24" />
        </div>
      )}

      {open && !isPhone && (
        <div
          className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("search")}
        >
          <div className="mx-auto mt-20 w-full max-w-2xl px-4 sm:mt-28" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar size="lg" autoFocus onNavigate={() => setOpen(false)} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
