#!/usr/bin/env node
// grant-membership.mjs
//
// Grant or revoke a FREE comp membership (Growth/Plus) to a business by setting
// businesses.plan_override. plan_override wins over Stripe/subscriptions in
// lib/tier.ts effectiveTier(), so this is the "comp / free-for-testing" lever.
// NO Stripe, NO card, NO subscription rows touched — only plan_override.
//
// Usage:
//   Preview grant : SLUG=<slug> TIER=standard node scripts/grant-membership.mjs
//   Apply  grant  : SLUG=<slug> TIER=standard CONFIRM=1 node scripts/grant-membership.mjs
//   Preview revoke: SLUG=<slug> REVOKE=1 node scripts/grant-membership.mjs
//   Apply  revoke : SLUG=<slug> REVOKE=1 CONFIRM=1 node scripts/grant-membership.mjs
//
// TIER: standard (Growth $39.99) | premium (Plus $99.99)
//
// Safety: preview/dry-run by default. Nothing is written unless CONFIRM=1.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { neon } from "@neondatabase/serverless"

const VALID_TIERS = ["standard", "premium"]
const TIER_LABEL = {
  standard: "Growth ($39.99)",
  premium: "Plus ($99.99)",
}

function fail(msg) {
  console.error(`\nERROR: ${msg}\n`)
  process.exit(1)
}

// --- Read DATABASE_URL from .env.local (do NOT hardcode) ---
function readDatabaseUrl() {
  const here = dirname(fileURLToPath(import.meta.url))
  const envPath = join(here, "..", ".env.local")
  let raw
  try {
    raw = readFileSync(envPath, "utf8")
  } catch {
    fail(`Could not read ${envPath}`)
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const m = trimmed.match(/^(?:export\s+)?DATABASE_URL\s*=\s*(.*)$/)
    if (m) {
      let val = m[1].trim()
      // strip surrounding single or double quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      return val
    }
  }
  fail(`DATABASE_URL not found in ${envPath}`)
}

async function main() {
  const SLUG = (process.env.SLUG || "").trim()
  const TIER = (process.env.TIER || "").trim().toLowerCase()
  const REVOKE = process.env.REVOKE === "1"
  const CONFIRM = process.env.CONFIRM === "1"

  if (!SLUG) fail("SLUG is required. e.g. SLUG=eddies-grill TIER=standard node scripts/grant-membership.mjs")

  let targetOverride // the value we intend to write
  if (REVOKE) {
    targetOverride = null
    if (TIER) {
      console.warn("Note: REVOKE=1 set — ignoring TIER; plan_override will be cleared to NULL.")
    }
  } else {
    if (!TIER) fail("TIER is required (or set REVOKE=1 to clear). TIER must be one of: " + VALID_TIERS.join(", "))
    if (!VALID_TIERS.includes(TIER)) {
      fail(`Invalid TIER "${TIER}". Must be one of: ${VALID_TIERS.join(", ")} (standard = Growth, premium = Plus).`)
    }
    targetOverride = TIER
  }

  const sql = neon(readDatabaseUrl())

  // Look up the business by slug (slug has a unique index).
  const rows = await sql`
    SELECT id, name, slug, plan_override
    FROM businesses
    WHERE slug = ${SLUG}
    LIMIT 1
  `
  if (rows.length === 0) {
    fail(`No business found with slug "${SLUG}". Nothing changed.`)
  }
  const biz = rows[0]

  const action = REVOKE ? "REVOKE (clear plan_override → NULL)" : `GRANT plan_override → ${targetOverride} [${TIER_LABEL[targetOverride]}]`

  console.log("\n=== grant-membership ===")
  console.log(`Business : ${biz.name}`)
  console.log(`Slug     : ${biz.slug}`)
  console.log(`ID       : ${biz.id}`)
  console.log(`Current plan_override : ${biz.plan_override === null ? "NULL (no comp)" : biz.plan_override}`)
  console.log(`Action   : ${action}`)

  if (!CONFIRM) {
    console.log("\nPREVIEW ONLY — no write performed. Re-run with CONFIRM=1 to apply.\n")
    return
  }

  // Apply: single UPDATE ... WHERE slug=... RETURNING. Only plan_override touched.
  const updated = await sql`
    UPDATE businesses
    SET plan_override = ${targetOverride}
    WHERE slug = ${SLUG}
    RETURNING id, name, slug, plan_override
  `
  const after = updated[0]
  console.log("\nAPPLIED. Row is now:")
  console.log(`  id            : ${after.id}`)
  console.log(`  name          : ${after.name}`)
  console.log(`  slug          : ${after.slug}`)
  console.log(`  plan_override : ${after.plan_override === null ? "NULL (no comp)" : after.plan_override}`)
  console.log("")
}

main().catch((err) => {
  console.error("\nUnexpected error:", err?.message || err, "\n")
  process.exit(1)
})
