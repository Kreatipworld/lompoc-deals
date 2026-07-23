"use server"

import { getLocale, getTranslations } from "next-intl/server"
import { extractZip, LOMPOC_ZIPS, lompocAddressError } from "@/lib/lompoc-zip"
import { geocodeAddressFull } from "@/lib/geocode"

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

/**
 * Smart Lompoc address check: a ZIP-less address (typical of Google
 * autocomplete picks like "100 East Ocean Avenue, Lompoc, CA, USA") is
 * geocoded server-side and accepted with the ZIP filled in, instead of
 * bouncing the user to go find their own ZIP code.
 *
 * Returns the address to store (normalized when we had to geocode) and a
 * localized error, mutually exclusive.
 */
export async function localizedResolveLompocAddress(
  address: string
): Promise<{ normalized: string; error: string | null }> {
  const raw = lompocAddressError(address)
  if (!raw) return { normalized: address, error: null }

  const t = await getTranslations("errors.feed")
  if (raw.includes("Address is required")) return { normalized: address, error: t("addressRequired") }

  if (raw.includes("must include a ZIP")) {
    const geo = await geocodeAddressFull(address)
    const zip = geo ? extractZip(geo.formattedAddress) : null
    if (zip && LOMPOC_ZIPS.has(zip)) {
      return { normalized: geo!.formattedAddress, error: null }
    }
    if (zip) return { normalized: address, error: t("addressNotLompoc") }
    return { normalized: address, error: t("addressNeedsZip") }
  }

  return { normalized: address, error: t("addressNotLompoc") }
}
