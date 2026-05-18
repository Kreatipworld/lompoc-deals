import assert from "node:assert/strict"
import { track } from "./track"
import { db } from "../../db/client"
import { analyticsEvents } from "../../db/schema"
import { eq } from "drizzle-orm"

let passed = 0
let failed = 0

function check(label: string, actual: unknown, expected: unknown) {
  try {
    assert.deepEqual(actual, expected)
    console.log(`  ok  ${label}`)
    passed++
  } catch {
    console.log(`  FAIL ${label}`)
    console.log(`       expected: ${JSON.stringify(expected)}`)
    console.log(`       actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

async function main() {
  const sid = "00000000-0000-4000-8000-test" + Math.random().toString(36).slice(2, 8)

  await track("business_page_viewed", {
    sessionId: sid,
    targetType: "business",
    targetId: 1,
    props: { locale: "en" },
  })

  const rows = await db.select().from(analyticsEvents).where(eq(analyticsEvents.sessionId, sid))
  check("track inserted one row", rows.length, 1)
  check("event name", rows[0]?.eventName, "business_page_viewed")
  check("target type", rows[0]?.targetType, "business")
  check("target id", rows[0]?.targetId, 1)
  check("user id null", rows[0]?.userId, null)

  // Cleanup
  await db.delete(analyticsEvents).where(eq(analyticsEvents.sessionId, sid))

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
