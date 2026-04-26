"use server"

import { getLocale, getTranslations } from "next-intl/server"
import { lompocAddressError } from "@/lib/lompoc-zip"

/** Returns the current request's locale ("en" or "es"). */
export async function getCurrentLocale(): Promise<"en" | "es"> {
  const l = await getLocale()
  return l === "es" ? "es" : "en"
}

/**
 * Returns a translated Lompoc-address error string, or null if the address is valid.
 * Wraps `lompocAddressError` so server actions can return bilingual messages.
 */
export async function localizedLompocAddressError(
  address: string | null | undefined
): Promise<string | null> {
  const raw = lompocAddressError(address)
  if (!raw) return null
  const t = await getTranslations("errors.feed")
  if (raw.includes("Address is required")) return t("addressRequired")
  if (raw.includes("must include a ZIP")) return t("addressNeedsZip")
  if (raw.includes("we only serve")) return t("addressNotLompoc")
  return raw // fallback to English
}
