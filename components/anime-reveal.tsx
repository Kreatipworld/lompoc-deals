"use client"
/**
 * Compatibility shim: the site's reveals now run on GSAP (components/motion/reveal).
 * Same props as before — `delay` was ms here and is seconds in Reveal, so convert.
 */
import { Reveal } from "@/components/motion/reveal"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof Reveal>

export function AnimeReveal({ delay = 0, ...rest }: Props) {
  return <Reveal delay={delay > 5 ? delay / 1000 : delay} {...rest} />
}
