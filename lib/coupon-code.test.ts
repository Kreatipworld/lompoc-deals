import assert from "node:assert/strict"
import {
  COUPON_ALPHABET,
  COUPON_CODE_LENGTH,
  generateCouponCode,
  normalizeCouponCode,
} from "./coupon-code"

// alphabet excludes visually ambiguous characters
for (const bad of ["O", "0", "I", "1", "L", "U"]) {
  assert.ok(!COUPON_ALPHABET.includes(bad), `alphabet must not contain ambiguous "${bad}"`)
}
assert.equal(COUPON_ALPHABET.length, 30, "alphabet is 30 unambiguous characters")
assert.equal(COUPON_CODE_LENGTH, 6)

// generated codes are well-formed and drawn only from the alphabet
for (let i = 0; i < 200; i++) {
  const code = generateCouponCode()
  assert.equal(code.length, COUPON_CODE_LENGTH, "correct length")
  for (const ch of code) {
    assert.ok(COUPON_ALPHABET.includes(ch), `"${ch}" must come from the alphabet`)
  }
}

// codes vary (collision-resistant enough to be worth a unique index)
const many = new Set(Array.from({ length: 500 }, () => generateCouponCode()))
assert.ok(many.size > 490, `codes should rarely repeat (got ${many.size}/500 distinct)`)

// normalization: staff may type lowercase, with spaces or dashes
assert.equal(normalizeCouponCode(" 7k2f9p "), "7K2F9P")
assert.equal(normalizeCouponCode("7k2-f9p"), "7K2F9P")
assert.equal(normalizeCouponCode("7K2 F9P"), "7K2F9P")

// Excluded lookalikes fold to their alphabet twin, so a correct code is never
// rejected because of handwriting or eyesight. Mapping: O/0 -> Q, I/1/L -> J, U -> V.
assert.equal(normalizeCouponCode("O23456"), "Q23456")
assert.equal(normalizeCouponCode("023456"), "Q23456")
assert.equal(normalizeCouponCode("I23456"), "J23456")
assert.equal(normalizeCouponCode("123456"), "J23456")
assert.equal(normalizeCouponCode("L23456"), "J23456")
assert.equal(normalizeCouponCode("U23456"), "V23456")

// every folded result is itself composed only of alphabet characters
for (const ch of normalizeCouponCode("O0I1LU")) {
  assert.ok(COUPON_ALPHABET.includes(ch), `folded "${ch}" must be in the alphabet`)
}

// normalizing an already-clean code is a no-op (idempotent)
const fresh = generateCouponCode()
assert.equal(normalizeCouponCode(fresh), fresh, "clean codes pass through unchanged")

console.log("coupon-code: all assertions passed")
