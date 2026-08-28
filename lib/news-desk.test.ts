import assert from "node:assert/strict"
import { isLompocLead, extractArticleText, chooseCover, COVER_POOLS, slugifyTitle } from "./news-desk"
import { topicBySlug } from "./news-topics"

// leads: ours vs elsewhere vs not-news
assert.equal(isLompocLead({ title: "Lompoc youth soccer coaches to receive AED training", summary: null }), true)
assert.equal(isLompocLead({ title: "Day of Hope Car Show showcases cars", summary: "held Saturday in Santa Maria" }), false) // no Lompoc anywhere
assert.equal(isLompocLead({ title: "Santa Maria council approves budget", summary: "Lompoc mentioned once" }), false) // elsewhere in title
assert.equal(isLompocLead({ title: "Chinese chicken salad: a light summer dinner", summary: "Lompoc recipe" }), false) // recipe
assert.equal(isLompocLead({ title: "Vandenberg breaks ground on Sentinel facility", summary: null }), true)
assert.equal(isLompocLead({ title: "Santa Barbara, Dos Pueblos girls golf open season at Lompoc course", summary: null }), false) // their teams, our course

// extractor: JSON-LD body, paywall boilerplate stripped
const html = `<script type="application/ld+json">{"@type":"NewsArticle","articleBody":"Please log in, or sign up for a new account and purchase a subscription to continue reading. The City of Lompoc opened a new park Tuesday. It has ${"x ".repeat(250)}"}</script><p>ignored</p>`
const text = extractArticleText(html)
assert.ok(text.startsWith("The City of Lompoc opened a new park"), "paywall stripped, body kept")

// covers: subject media wins; keyword match; rotation avoids recent
const city = topicBySlug("city-hall")!
assert.equal(chooseCover({ topic: city, title: "Kevin Shay named fire chief", text: "" }).url, COVER_POOLS["city-hall"][0].url)
assert.equal(chooseCover({ topic: city, title: "New utility portal", text: "", subjectCover: "https://x/own.jpg" }).url, "https://x/own.jpg")
const pines = COVER_POOLS["city-hall"][2].url
const pick = chooseCover({ topic: city, title: "Utility portal", text: "", recentUrls: [pines] })
assert.notEqual(pick.url, pines, "recent photo skipped")
const space = topicBySlug("vandenberg-space")!
assert.ok(/launches/.test(chooseCover({ topic: space, title: "Falcon 9 launch Tuesday", text: "" }).url), "launch story gets a launch photo")
assert.equal(slugifyTitle("Falcon 9 Lit Up Lompoc at 2:35 A.M. — 27 More!"), "falcon-9-lit-up-lompoc-at-2-35-a-m-27-more")
console.log("news-desk: all assertions passed")
