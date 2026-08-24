import assert from "node:assert/strict"
import { deriveTopic, topicBySlug, topicTag, NEWS_TOPICS } from "./news-topics"

assert.equal(deriveTopic(["vandenberg", "rocket launch", "spacex"]).slug, "vandenberg-space")
assert.equal(deriveTopic(["city of lompoc", "fire department"]).slug, "city-hall")
assert.equal(deriveTopic(["high school football", "sports"]).slug, "schools-sports")
assert.equal(deriveTopic([], "Spencer's Fresh Market Is Now Open on North H Street").slug, "business")
assert.equal(deriveTopic(["topic:food-events", "whatever"]).slug, "food-events") // explicit wins
assert.equal(deriveTopic([]).slug, "community") // honest default
assert.equal(topicTag("city-hall"), "topic:city-hall")
assert.ok(NEWS_TOPICS.length === 6 && topicBySlug("business"))
console.log("news-topics: all assertions passed")
