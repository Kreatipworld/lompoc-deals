import { randomInt } from "node:crypto"

/**
 * Unambiguous code alphabet: no O/0, I/1, L or U. A code gets read aloud across a
 * noisy counter and typed by a stranger — every character that can be confused for
 * another is a redemption that fails for no good reason.
 */
export const COUPON_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ"
export const COUPON_CODE_LENGTH = 6

/** Characters a human might type for a character we deliberately excluded. */
const FOLD: Record<string, string> = {
  O: "Q", "0": "Q",  // round shapes -> Q
  I: "J", "1": "J", L: "J", // vertical strokes -> J
  U: "V",
}

/** A fresh random code. Uniqueness is guaranteed by the DB index, not by this. */
export function generateCouponCode(): string {
  let out = ""
  for (let i = 0; i < COUPON_CODE_LENGTH; i++) {
    out += COUPON_ALPHABET[randomInt(COUPON_ALPHABET.length)]
  }
  return out
}

/** Normalise staff-typed input: upper-case, strip separators, fold lookalikes. */
export function normalizeCouponCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "")
  let out = ""
  for (const ch of cleaned) out += FOLD[ch] ?? ch
  return out
}
