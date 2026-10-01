import assert from "node:assert/strict"
import { createVerify, generateKeyPairSync } from "node:crypto"
import { buildServiceAccountJwt, GSC_SCOPE, GSC_TOKEN_URL, loadServiceAccount, pullWindow } from "./gsc"

// Run: DATABASE_URL=postgresql://u:p@localhost.test/db node_modules/.bin/tsx lib/gsc.test.ts
// Never calls Google — only the pure pieces: the JWT shape + signature, the key decoder, the window.

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString()
const sa = { client_email: "gsc@lompoc-locals.iam.gserviceaccount.com", private_key: pem }
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")

{
  const jwt = buildServiceAccountJwt(sa, 1_800_000_000)
  const [h, c, sig] = jwt.split(".")
  assert.equal(jwt.split(".").length, 3, "three dot-separated parts")
  assert.match(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "base64url only, no padding")
  assert.deepEqual(JSON.parse(fromB64url(h)), { alg: "RS256", typ: "JWT" })
  assert.deepEqual(JSON.parse(fromB64url(c)), {
    iss: sa.client_email,
    scope: GSC_SCOPE,
    aud: GSC_TOKEN_URL,
    iat: 1_800_000_000,
    exp: 1_800_003_600,
  })
  const verifier = createVerify("RSA-SHA256")
  verifier.update(`${h}.${c}`)
  assert.ok(verifier.verify(publicKey, Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64")), "signature verifies with the public key")
}

{
  const b64 = Buffer.from(JSON.stringify(sa)).toString("base64")
  assert.deepEqual(loadServiceAccount(b64), sa, "base64 JSON decodes")
  assert.deepEqual(loadServiceAccount(JSON.stringify(sa)), sa, "raw JSON tolerated")
  assert.throws(() => loadServiceAccount(undefined), /GSC_SERVICE_ACCOUNT_JSON not set/)
  assert.throws(() => loadServiceAccount(Buffer.from("{}").toString("base64")), /missing client_email/)
  assert.throws(() => loadServiceAccount("not-json"), /not valid base64 JSON/)
}

{
  assert.deepEqual(pullWindow(4, new Date("2026-09-30T15:00:00Z")), { startDate: "2026-09-27", endDate: "2026-09-30" })
  assert.deepEqual(pullWindow(1, new Date("2026-01-01T00:30:00Z")), { startDate: "2026-01-01", endDate: "2026-01-01" })
}

console.log("gsc: all assertions passed")
