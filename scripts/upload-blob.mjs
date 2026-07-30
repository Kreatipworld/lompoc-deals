#!/usr/bin/env node
// Upload a local image to Vercel Blob (public) and print its URL.
//   node scripts/upload-blob.mjs <srcPath> <key> [contentType]
import { readFileSync } from "node:fs"
import { put } from "@vercel/blob"

const env = readFileSync("/Users/kreatip/Projects/lompoc-deals/.env.local", "utf8")
const token = (env.match(/^BLOB_READ_WRITE_TOKEN\s*=\s*"?([^"\n]+)"?/m) || [])[1]
if (!token) { console.error("no BLOB_READ_WRITE_TOKEN in .env.local"); process.exit(1) }

const src = process.argv[2]
const key = process.argv[3]
const contentType = process.argv[4] || "image/jpeg"
if (!src || !key) { console.error("usage: upload-blob.mjs <src> <key> [contentType]"); process.exit(1) }

const buf = readFileSync(src)
const res = await put(key, buf, { access: "public", token, addRandomSuffix: true, contentType })
console.log(res.url)
