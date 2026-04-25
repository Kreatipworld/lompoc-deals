"use server"

import { getLocale } from "next-intl/server"

/** Returns the current request's locale ("en" or "es"). */
export async function getCurrentLocale(): Promise<"en" | "es"> {
  const l = await getLocale()
  return l === "es" ? "es" : "en"
}
