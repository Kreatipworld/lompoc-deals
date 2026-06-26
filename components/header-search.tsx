"use client"

import { Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { SearchBar } from "@/components/search-bar"

/**
 * Search icon in the site header. Clicking it opens a full-width overlay
 * containing the shared SearchBar (autocomplete + suggestions), so search is
 * reachable from any page. Closes on Esc, backdrop click, or after navigating.
 */
export function HeaderSearch() {
  const t = useTranslations("nav")
  const [open, setOpen] = useState(false)

  // Lock body scroll + wire Esc-to-close while the overlay is open.
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

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("search")}
        >
          <div
            className="mx-auto mt-20 w-full max-w-2xl px-4 sm:mt-28"
            onMouseDown={(e) => e.stopPropagation()}
          >
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
