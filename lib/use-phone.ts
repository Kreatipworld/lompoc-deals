"use client"

import { useEffect, useState } from "react"

/** True below Tailwind's `sm` breakpoint. Maps use it to swap the floating pin popup for a bottom sheet. */
export function usePhone(): boolean {
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const apply = () => setIsPhone(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
  return isPhone
}
