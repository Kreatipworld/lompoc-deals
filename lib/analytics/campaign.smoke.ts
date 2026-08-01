import assert from "node:assert/strict"
import {
  campaignFromParams,
  decodeCampaign,
  encodeCampaign,
  tagUrl,
} from "./campaign"

const at = new Date("2026-07-31T12:00:00Z")
const params = (qs: string) => new URLSearchParams(qs)

function main() {
  // Ordinary traffic writes nothing — no cookie on every organic pageview.
  assert.equal(campaignFromParams(params(""), at), null)
  assert.equal(campaignFromParams(params("q=tacos&page=2"), at), null)

  const c = campaignFromParams(
    params("utm_source=Instagram&utm_medium=social&utm_campaign=Highlight-Of-Week&utm_content=vargas"),
    at
  )
  assert.ok(c)
  // Lowercased so "Instagram" and "instagram" don't split a report in two.
  assert.equal(c.src, "instagram")
  assert.equal(c.cmp, "highlight-of-week")
  assert.equal(c.con, "vargas")
  assert.equal(c.at, "2026-07-31")

  // Ad platforms append their own click id; a click carrying one is paid even with utm tags lost.
  assert.equal(campaignFromParams(params("gclid=abc123"), at)?.src, "google")
  assert.equal(campaignFromParams(params("fbclid=xyz"), at)?.src, "facebook")

  // Values land in JSONB and a cookie — separators and quotes must not survive.
  const dirty = campaignFromParams(params('utm_source=" ; drop&utm_campaign=a"b'), at)
  assert.ok(dirty)
  assert.ok(!/[";\s]/.test(dirty.src ?? ""), `src not sanitised: ${dirty.src}`)

  // Round-trip, and a malformed cookie must never throw.
  assert.deepEqual(decodeCampaign(encodeCampaign(c)), c)
  assert.equal(decodeCampaign("not json"), null)
  assert.equal(decodeCampaign(undefined), null)
  assert.equal(decodeCampaign(encodeCampaign({} as never)), null)

  // Link tagging keeps existing query strings and the absolute/relative shape it was given.
  const tagged = tagUrl("https://www.lompoclocals.com/biz/vargas-jewelers-trophies-awards", {
    source: "instagram",
    campaign: "highlight-of-week",
    content: "vargas",
  })
  const u = new URL(tagged)
  assert.equal(u.searchParams.get("utm_source"), "instagram")
  assert.equal(u.searchParams.get("utm_medium"), "social")
  assert.equal(u.searchParams.get("utm_content"), "vargas")
  assert.equal(u.pathname, "/biz/vargas-jewelers-trophies-awards")

  const kept = tagUrl("https://www.lompoclocals.com/events?cat=music", {
    source: "tiktok",
    campaign: "launch",
  })
  assert.equal(new URL(kept).searchParams.get("cat"), "music")

  // Bare domains are what the cards print, so they must not gain a protocol.
  const bare = tagUrl("lompoclocals.com/events", { source: "instagram", campaign: "launch" })
  assert.ok(bare.startsWith("lompoclocals.com/events?"), `bare url changed shape: ${bare}`)

  console.log("✓ campaign attribution: all assertions passed")
}

main()
