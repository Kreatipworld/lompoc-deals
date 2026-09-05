"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/**
 * Floating "Top" pill after most of a screen of scrolling. Sits above the mobile
 * bottom bar and the chat button, and above the chat button alone on larger
 * screens, so it never collides with either.
 */
export function BackToTop() {
  const t = useTranslations("hoursUi")
  const [show, setShow] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setShow(window.scrollY > window.innerHeight * 0.9)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("backToTop")}
      className={cn(
        "fixed right-3 z-40 inline-flex h-11 items-center gap-1.5 rounded-full border bg-background/90 px-4 text-sm font-semibold text-foreground shadow-lg backdrop-blur transition-all duration-300 hover:border-primary/40 hover:text-primary active:scale-95",
        "bottom-[8.25rem] sm:bottom-[5.25rem] sm:right-4",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="h-4 w-4" />
      {t("backToTop")}
    </button>
  )
}
