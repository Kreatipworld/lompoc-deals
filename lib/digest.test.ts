import assert from "node:assert/strict"
import { selectLead, type MasterDigestContent } from "./digest"

const ev = (id: number, title: string): MasterDigestContent["events"][number] => ({
  id, title, location: null, startsAt: new Date("2026-07-25T18:00:00Z"), imageUrl: null,
})
const deal = (id: number, title: string): MasterDigestContent["deals"][number] => ({
  id, type: "deal", title, description: null, imageUrl: null, discountText: null,
  terms: null, expiresAt: new Date("2026-08-01T00:00:00Z"), featured: false,
  business: { id: 1, name: "Biz", slug: "biz", logoUrl: null, coverUrl: null,
    categoryName: null, categorySlug: null, address: null, phone: null },
})
const base: MasterDigestContent = { events: [], deals: [], things: [], partners: [] }

// event present -> event lead
let lead = selectLead({ ...base, events: [ev(1, "Launch"), ev(2, "Market")], deals: [deal(9, "20% off")] })
assert.equal(lead?.kind, "event")
assert.equal(lead!.kind === "event" && lead.event.id, 1)

// no events, deals present -> deal lead
lead = selectLead({ ...base, deals: [deal(9, "20% off")] })
assert.equal(lead?.kind, "deal")
assert.equal(lead!.kind === "deal" && lead.deal.id, 9)

// nothing -> null
assert.equal(selectLead(base), null)

console.log("selectLead: all assertions passed")
