/**
 * lib/feed-expiration.ts
 *
 * Single source of truth for the per-type expiration rule. Used by:
 *   - admin approve action (computes expiresAt at the moment of approval)
 *   - poster "extend expiration" action (refreshes expiresAt)
 */

export type ExpirationInput = {
  type: "for_sale" | "info"
  saleEndsAt: Date | null
}

export function computeExpiration(input: ExpirationInput, now: Date = new Date()): Date {
  if (input.type === "info") {
    return addDays(now, 7)
  }
  // type === "for_sale"
  if (input.saleEndsAt) {
    return addHours(input.saleEndsAt, 24)
  }
  return addDays(now, 30)
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

export function addHours(d: Date, hours: number): Date {
  const out = new Date(d)
  out.setHours(out.getHours() + hours)
  return out
}
