import assert from "node:assert/strict"
import { bizTitleParts, bizFaq, hoursSummary, isAlcoholDeal } from "./biz-seo"

const labels = {
  hours: "Hours", deals: "Deals", photos: "Photos", directions: "Directions",
  qHours: "What are {name}'s hours?", qWhere: "Where is {name}?", aWhere: "{name} is at {address}.",
  qPhone: "Phone of {name}?", aPhone: "Call {name} at {phone}.", qDeals: "Deals at {name}?", aDeals: "{count}: {deals}.",
  days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }, closed: "Closed",
}
const hours = { mon: null, tue: null, wed: { open: "16:00", close: "22:00" }, thu: { open: "16:00", close: "22:00" }, fri: { open: "16:00", close: "23:00" }, sat: null, sun: null }
const b = { name: "Test Grill", address: "1 H St, Lompoc", phone: "(805) 555-0100", hoursJson: hours, photoCount: 4, activeDealTitles: ["Taco Tuesday"] }

assert.deepEqual(bizTitleParts(b, labels), ["Hours", "Deals", "Photos"])
assert.deepEqual(bizTitleParts({ ...b, hoursJson: null, activeDealTitles: [], photoCount: 1 }, labels), ["Directions"]) // never promises what isn't there
assert.equal(hoursSummary(hours, labels.days, "Closed"), "Mon–Tue: Closed; Wed–Thu: 4:00 PM – 10:00 PM; Fri: 4:00 PM – 11:00 PM; Sat–Sun: Closed")
assert.equal(bizFaq(b, labels).length, 4)
assert.equal(bizFaq({ ...b, phone: null, activeDealTitles: [] }, labels).length, 2)
assert.ok(isAlcoholDeal("HAPPY HOUR") && isAlcoholDeal("$5 Margaritas") && isAlcoholDeal("Wine Wednesday"))
assert.ok(!isAlcoholDeal("Taco Tuesday") && !isAlcoholDeal("10% off oil change") && !isAlcoholDeal("Free brownie"))
console.log("biz-seo: all assertions passed")
