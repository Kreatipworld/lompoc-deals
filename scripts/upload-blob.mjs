#!/usr/bin/env node
// Upload a local file to Vercel Blob (public) and print its URL.
// Content type comes from the extension unless given; Buffer rejects a video served as image/jpeg
// ("Video could not be read from its URL", Sep 23 2026).
//   node scripts/upload-blob.mjs <srcPath> <key> [contentType]
import { readFileSync } from "node:fs"
import { extname } from "node:path"
import { put } from "@vercel/blob"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const token = (env.match(/^BLOB_READ_WRITE_TOKEN\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!token) { console.error("no BLOB_READ_WRITE_TOKEN in .env.local"); process.exit(1) }

const src = process.argv[2]
const key = process.argv[3]
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".mp4": "video/mp4", ".mov": "video/quicktime", ".mp3": "audio/mpeg", ".pdf": "application/pdf" }
const contentType = process.argv[4] || TYPES[extname(src || "").toLowerCase()] || "application/octet-stream"
if (!src || !key) { console.error("usage: upload-blob.mjs <src> <key> [contentType]"); process.exit(1) }

const buf = readFileSync(src)
const res = await put(key, buf, { access: "public", token, addRandomSuffix: true, contentType })
console.log(res.url)
