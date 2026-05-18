import assert from "node:assert/strict"
import { parseDayString, normalizeGoogleHours } from "../lib/hours-normalizer"

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

console.log("parseDayString — single range:")
check("10 AM to 9:30 PM", parseDayString("10 AM to 9:30 PM"), { open: "10:00", close: "21:30" })
check("9 to 11 AM",        parseDayString("9 to 11 AM"),        { open: "09:00", close: "11:00" })
check("11 AM to 10 PM",    parseDayString("11 AM to 10 PM"),    { open: "11:00", close: "22:00" })
check("5 PM to 2 AM",      parseDayString("5 PM to 2 AM"),      { open: "17:00", close: "02:00" })
check("Closed",            parseDayString("Closed"),            null)
check("closed",            parseDayString("closed"),            null)
check("empty string",      parseDayString(""),                  null)
check("nonsense",          parseDayString("ask staff"),         { raw: "ask staff" })
check("midnight close",    parseDayString("12 PM to 12 AM"),    { open: "12:00", close: "00:00" })

console.log("\nparseDayString — 24 hours (strict — only matches Google's canonical wording):")
check("Open 24 hours",     parseDayString("Open 24 hours"),     { open: "00:00", close: "23:59" })
check("Open 24/7",         parseDayString("Open 24/7"),         { open: "00:00", close: "23:59" })
check("24-hour emergency service falls through to raw",
                           parseDayString("24-hour emergency service"),
                           { raw: "24-hour emergency service" })
check("available 24 hours via phone falls through",
                           parseDayString("available 24 hours via phone"),
                           { raw: "available 24 hours via phone" })

console.log("\nparseDayString — multi-range (raw + ranges):")
check("8 AM to 1 PM, 1:30 to 9 PM",
  parseDayString("8 AM to 1 PM, 1:30 to 9 PM"),
  { raw: "8 AM to 1 PM, 1:30 to 9 PM", ranges: [
    { open: "08:00", close: "13:00" },
    { open: "13:30", close: "21:00" },
  ]}
)
check("9 to 10:30 AM, 5 to 8 PM",
  parseDayString("9 to 10:30 AM, 5 to 8 PM"),
  { raw: "9 to 10:30 AM, 5 to 8 PM", ranges: [
    { open: "09:00", close: "10:30" },
    { open: "17:00", close: "20:00" },
  ]}
)
check("11:30 AM to 3 PM, 4:30 to 9 PM",
  parseDayString("11:30 AM to 3 PM, 4:30 to 9 PM"),
  { raw: "11:30 AM to 3 PM, 4:30 to 9 PM", ranges: [
    { open: "11:30", close: "15:00" },
    { open: "16:30", close: "21:00" },
  ]}
)
check("multi-range with one unparseable chunk keeps the parseable ones",
  parseDayString("9 AM to 12 PM, ask staff"),
  { raw: "9 AM to 12 PM, ask staff", ranges: [
    { open: "09:00", close: "12:00" },
  ]}
)

console.log("\nnormalizeGoogleHours:")
const habit = normalizeGoogleHours({
  monday: "10 AM to 9:30 PM",
  friday: "10 AM to 10 PM",
})
check("Habit Burger Mon",  habit.mon, { open: "10:00", close: "21:30" })
check("Habit Burger Fri",  habit.fri, { open: "10:00", close: "22:00" })

const pnf = normalizeGoogleHours({
  monday: "9 to 10:30 AM, 5 to 8 PM",
  tuesday: "5:30 to 8 PM",
  friday: "Closed",
})
check("PNF Mon (multi-range)", pnf.mon, {
  raw: "9 to 10:30 AM, 5 to 8 PM",
  ranges: [
    { open: "09:00", close: "10:30" },
    { open: "17:00", close: "20:00" },
  ],
})
check("PNF Tue (single)",      pnf.tue, { open: "17:30", close: "20:00" })
check("PNF Fri (closed)",      pnf.fri, null)

const explanada = normalizeGoogleHours({ sunday: "Open 24 hours", monday: "Closed" })
check("Explanada Sun",     explanada.sun, { open: "00:00", close: "23:59" })

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
