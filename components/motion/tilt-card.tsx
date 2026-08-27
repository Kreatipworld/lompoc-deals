"use client"
import { useRef, type ReactNode } from "react"
import { ensureGsap, useGSAP, MOTION_OK } from "@/lib/gsap-motion"

/**
 * Hover response for cards: a ±4° pointer-following tilt, a 4px lift, a
 * soft drop shadow that fades in, and a gentle press on pointerdown.
 * Any descendant marked data-tilt="img" (the cover image container) scales
 * to 1.04 while hovered.
 *
 * Only runs for fine-pointer devices that can hover (mouse/trackpad) and
 * under prefers-reduced-motion: no-preference — touch devices and
 * reduced-motion users get the plain card. Everything is transform/opacity
 * driven through gsap.quickTo, so it stays cheap in a 60-card grid.
 *
 * It never captures the pointer or prevents default, so the card's links,
 * forms and buttons keep working exactly as before.
 */
const TILT_OK = `${MOTION_OK} and (hover: hover) and (pointer: fine)`
const MAX_TILT = 4

interface TiltCardProps {
  children: ReactNode
  className?: string
  as?: "div" | "li"
}

export function TiltCard({ children, className = "", as: Tag = "div" }: TiltCardProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    (_ctx, contextSafe) => {
      const gsap = ensureGsap()
      const el = ref.current
      if (!el || !contextSafe) return

      const mm = gsap.matchMedia()
      mm.add(TILT_OK, () => {
        const shadow = el.querySelector<HTMLElement>("[data-tilt-shadow]")
        const imgs = gsap.utils.toArray<HTMLElement>('[data-tilt="img"]', el)
        const ease = "power3.out"

        // The quickTo setters are created on the first hover, not at mount:
        // entrance animations (Reveal with stagger) may still be tweening this
        // wrapper and clear its transform when they finish, which would wipe a
        // mount-time perspective and desync GSAP's transform cache.
        type Setters = { rotX: gsap.QuickToFunc; rotY: gsap.QuickToFunc; lift: gsap.QuickToFunc; shade: gsap.QuickToFunc | null }
        let setters: Setters | null = null
        const init = (): Setters | null => {
          if (setters) return setters
          if (gsap.isTweening(el)) return null
          gsap.set(el, { transformPerspective: 900 })
          setters = {
            rotX: gsap.quickTo(el, "rotateX", { duration: 0.5, ease }),
            rotY: gsap.quickTo(el, "rotateY", { duration: 0.5, ease }),
            lift: gsap.quickTo(el, "y", { duration: 0.5, ease }),
            shade: shadow ? gsap.quickTo(shadow, "opacity", { duration: 0.4, ease: "power2.out" }) : null,
          }
          return setters
        }

        // Cached on enter so pointermove never forces a layout read.
        let rect: DOMRect | null = null

        const onEnter = contextSafe((e: PointerEvent) => {
          if (e.pointerType !== "mouse") return
          const s = init()
          if (!s) return
          rect = el.getBoundingClientRect()
          s.lift(-4)
          s.shade?.(1)
          if (imgs.length) gsap.to(imgs, { scale: 1.04, duration: 0.5, ease, overwrite: "auto" })
        })

        const onMove = contextSafe((e: PointerEvent) => {
          if (e.pointerType !== "mouse" || !rect || !setters) return
          const px = (e.clientX - rect.left) / rect.width - 0.5
          const py = (e.clientY - rect.top) / rect.height - 0.5
          setters.rotY(px * 2 * MAX_TILT)
          setters.rotX(-py * 2 * MAX_TILT)
        })

        const onLeave = contextSafe(() => {
          rect = null
          if (!setters) return
          setters.rotX(0)
          setters.rotY(0)
          setters.lift(0)
          setters.shade?.(0)
          gsap.to(el, { scale: 1, duration: 0.5, ease, overwrite: "auto" })
          if (imgs.length) gsap.to(imgs, { scale: 1, duration: 0.5, ease, overwrite: "auto" })
        })

        const onDown = contextSafe((e: PointerEvent) => {
          if (e.pointerType !== "mouse" || !setters) return
          gsap.to(el, { scale: 0.98, duration: 0.15, ease: "power2.out", overwrite: "auto" })
        })

        const onUp = contextSafe(() => {
          if (!setters) return
          gsap.to(el, { scale: 1, duration: 0.35, ease, overwrite: "auto" })
        })

        const opts: AddEventListenerOptions = { passive: true }
        el.addEventListener("pointerenter", onEnter, opts)
        el.addEventListener("pointermove", onMove, opts)
        el.addEventListener("pointerleave", onLeave, opts)
        el.addEventListener("pointerdown", onDown, opts)
        el.addEventListener("pointerup", onUp, opts)
        el.addEventListener("pointercancel", onUp, opts)

        return () => {
          el.removeEventListener("pointerenter", onEnter)
          el.removeEventListener("pointermove", onMove)
          el.removeEventListener("pointerleave", onLeave)
          el.removeEventListener("pointerdown", onDown)
          el.removeEventListener("pointerup", onUp)
          el.removeEventListener("pointercancel", onUp)
        }
      })

      return () => mm.revert()
    },
    { scope: ref }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any
  return (
    <Comp ref={ref} className={`relative isolate ${className}`}>
      {children}
      <span
        aria-hidden
        data-tilt-shadow
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 shadow-[0_22px_44px_-14px_rgba(0,0,0,0.3)]"
      />
    </Comp>
  )
}
