import { cookies } from "next/headers"

export const SESSION_COOKIE = "lompoc_sid"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/** Read the session id from request cookies. Returns null if absent. Server components / actions only. */
export function getSessionId(): string | null {
  try {
    return cookies().get(SESSION_COOKIE)?.value ?? null
  } catch {
    return null
  }
}
