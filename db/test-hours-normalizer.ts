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

console.log("parseDayString:")
check("10 AM to 9:30 PM", parseDayString("10 AM to 9:30 PM"), { open: "10:00", close: "21:30" })
check("9 to 11 AM",        parseDayString("9 to 11 AM"),        { open: "09:00", close: "11:00" })
check("11 AM to 10 PM",    parseDayString("11 AM to 10 PM"),    { open: "11:00", close: "22:00" })
check("5 PM to 2 AM",      parseDayString("5 PM to 2 AM"),      { open: "17:00", close: "02:00" })
check("Closed",            parseDayString("Closed"),            null)
check("closed",            parseDayString("closed"),            null)
check("Open 24 hours",     parseDayString("Open 24 hours"),     { open: "00:00", close: "23:59" })
check("multi-range comma", parseDayString("9 to 10:30 AM, 5 to 8 PM"), { raw: "9 to 10:30 AM, 5 to 8 PM" })
check("empty string",      parseDayString(""),                  null)
check("nonsense",          parseDayString("ask staff"),         { raw: "ask staff" })
check("midnight close",    parseDayString("12 PM to 12 AM"),    { open: "12:00", close: "00:00" })

console.log("\nnormalizeGoogleHours:")
const habit = normalizeGoogleHours({
  monday: "10 AM to 9:30 PM",
  tuesday: "10 AM to 9:30 PM",
  wednesday: "10 AM to 9:30 PM",
  thursday: "10 AM to 9:30 PM",
  friday: "10 AM to 10 PM",
  saturday: "10 AM to 10 PM",
  sunday: "10 AM to 9:30 PM",
})
check("Habit Burger Mon",  habit.mon, { open: "10:00", close: "21:30" })
check("Habit Burger Fri",  habit.fri, { open: "10:00", close: "22:00" })

const pnf = normalizeGoogleHours({
  monday: "9 to 10:30 AM, 5 to 8 PM",
  tuesday: "5:30 to 8 PM",
  friday: "Closed",
})
check("PNF Fitness Mon",   pnf.mon, { raw: "9 to 10:30 AM, 5 to 8 PM" })
check("PNF Fitness Tue",   pnf.tue, { open: "17:30", close: "20:00" })
check("PNF Fitness Fri",   pnf.fri, null)

const explanada = normalizeGoogleHours({ sunday: "Open 24 hours", monday: "Closed" })
check("Explanada Sun",     explanada.sun, { open: "00:00", close: "23:59" })

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
