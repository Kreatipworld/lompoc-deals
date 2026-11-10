#!/usr/bin/env node
/**
 * Instagram Story WITH a link sticker, through Buffer's API (Nov 10 2026).
 *
 * Why: the Linux leader posts through Post Bridge, which can't add Story link stickers, so every
 * Story went up without one and Instagram sent ~5 visits a week (2% of traffic). Buffer can.
 * This is the same post shape the Buffer MCP used on the Mac (Sweet Baking story, Oct 23).
 *
 *   node scripts/social/buffer-story.mjs --video <public mp4 url> --link <url> [--sticker "If you dare 👀"] [--dry]
 *   node scripts/social/buffer-story.mjs --status <postId>
 *
 * The video must be a public URL with content-type video/mp4 (scripts/upload-blob.mjs) and under 100 MB
 * (IG Stories reject bigger files). The link gets utm_source=ig-story added if it has no utm_source.
 * Key: ~/.config/lompoc-locals/buffer.json {"apiKey": "..."} (chmod 600, never committed),
 * created by the owner at https://publish.buffer.com/settings/api.
 */
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const API = "https://api.buffer.com"
const IG_CHANNEL = "6a6b9c104b2d03035f6db7ea" // lompoclocals_

const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

function apiKey() {
  try {
    return JSON.parse(readFileSync(join(homedir(), ".config", "lompoc-locals", "buffer.json"), "utf8")).apiKey
  } catch {
    console.error("No Buffer key: create one at https://publish.buffer.com/settings/api and save it to ~/.config/lompoc-locals/buffer.json as {\"apiKey\": \"...\"} (chmod 600).")
    process.exit(1)
  }
}

async function gql(query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({ query, variables }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.errors) {
    console.error(`Buffer ${res.status}:`, JSON.stringify(body.errors ?? body))
    process.exit(1)
  }
  return body.data
}

const statusId = arg("status")
if (statusId) {
  const d = await gql(`query ($id: PostId!) { post(input: { id: $id }) { id status sentAt externalLink error { message } } }`, { id: statusId })
  console.log(JSON.stringify(d.post, null, 2))
  process.exit(0)
}

const video = arg("video")
let link = arg("link")
if (!video || !link) {
  console.error("Usage: --video <public mp4 url> --link <url> [--sticker text] [--dry]")
  process.exit(1)
}
const u = new URL(link)
if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "ig-story")
link = u.toString()

const head = await fetch(video, { method: "HEAD" })
const type = head.headers.get("content-type") ?? ""
const size = Number(head.headers.get("content-length") ?? 0)
if (!head.ok || !type.startsWith("video/")) {
  console.error(`Video URL answers ${head.status} ${type}: Buffer needs a public video/mp4 (re-upload with scripts/upload-blob.mjs).`)
  process.exit(1)
}
if (size > 100 * 1024 * 1024) {
  console.error(`Video is ${(size / 1048576).toFixed(0)} MB; IG Stories reject files over 100 MB. Re-encode a story cut first.`)
  process.exit(1)
}

const input = {
  channelId: IG_CHANNEL,
  text: "",
  schedulingType: "automatic",
  mode: "shareNow",
  assets: [{ video: { url: video } }],
  metadata: {
    instagram: {
      type: "story",
      shouldShareToFeed: false,
      link,
      stickerFields: { text: arg("sticker") ?? "See it on Lompoc Locals" },
    },
  },
}

if (args.includes("--dry")) {
  console.log(JSON.stringify(input, null, 2))
  process.exit(0)
}

const d = await gql(
  `mutation ($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status } }
      ... on MutationError { message }
    }
  }`,
  { input }
)
const r = d.createPost
if (r.message) {
  console.error("Buffer refused the story:", r.message)
  process.exit(1)
}
console.log(`Story sent to Buffer: post ${r.post.id} (${r.post.status}). Check in a few minutes: --status ${r.post.id}`)
