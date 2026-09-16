#!/usr/bin/env node
// backup.mjs — an off-site copy of everything Lompoc Locals owns, on this Mac.
//
//   node --env-file=.env.local scripts/backup.mjs            # db + blob + git check
//   node --env-file=.env.local scripts/backup.mjs --db-only
//   node --env-file=.env.local scripts/backup.mjs --blob-only
//
// What it keeps (default root ~/Backups/lompoc-locals, override with BACKUP_ROOT):
//   db/<YYYY-MM-DD>/<table>.ndjson.gz   every table, every row (pure Node, no pg_dump needed)
//   db/<YYYY-MM-DD>/schema.sql          column definitions, so a dump can be re-created
//   blob/<pathname>                     every Vercel Blob object, mirrored incrementally
//   backup.log                          one line per run; last-run.json for the health page
// Keeps the last 14 daily db folders. Neon's own daily snapshots (30-day retention, set
// Sep 15 2026) are the first line of defence; this is the copy that is not in the cloud.
import { neon } from "@neondatabase/serverless"
import { list } from "@vercel/blob"
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync, appendFileSync } from "node:fs"
import { createGzip } from "node:zlib"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"
import { join, dirname } from "node:path"
import { homedir } from "node:os"
import { execSync } from "node:child_process"

const args = new Set(process.argv.slice(2))
const ROOT = process.env.BACKUP_ROOT || join(homedir(), "Backups", "lompoc-locals")
const today = new Date().toISOString().slice(0, 10)
const started = Date.now()
const summary = { date: today, db: null, blob: null, git: null, errors: [] }
mkdirSync(ROOT, { recursive: true })
const log = (m) => { const line = `${new Date().toISOString()} ${m}`; console.log(line); appendFileSync(join(ROOT, "backup.log"), line + "\n") }

async function backupDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing (run with --env-file=.env.local)")
  const sql = neon(process.env.DATABASE_URL)
  const dir = join(ROOT, "db", today)
  mkdirSync(dir, { recursive: true })
  const tables = (await sql.query("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1")).map((r) => r.table_name)
  const cols = await sql.query("select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' order by table_name, ordinal_position")
  const schema = tables.map((t) => `-- ${t}\n` + cols.filter((c) => c.table_name === t).map((c) => `  ${c.column_name} ${c.data_type}${c.is_nullable === "NO" ? " not null" : ""}${c.column_default ? ` default ${c.column_default}` : ""}`).join("\n")).join("\n\n")
  writeFileSync(join(dir, "schema.sql"), schema + "\n")
  let rows = 0
  for (const t of tables) {
    const data = await sql.query(`select * from "${t}"`)
    rows += data.length
    const src = Readable.from((function* () { for (const r of data) yield JSON.stringify(r) + "\n" })())
    await pipeline(src, createGzip(), createWriteStream(join(dir, `${t}.ndjson.gz`)))
  }
  // keep the last 14 daily folders
  const days = readdirSync(join(ROOT, "db")).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  for (const d of days.slice(0, Math.max(0, days.length - 14))) rmSync(join(ROOT, "db", d), { recursive: true, force: true })
  summary.db = { tables: tables.length, rows, dir }
  log(`db: ${tables.length} tables, ${rows} rows → ${dir}`)
}

async function backupBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing")
  const dir = join(ROOT, "blob")
  mkdirSync(dir, { recursive: true })
  let cursor, seen = 0, copied = 0, bytes = 0, failed = 0
  const manifest = []
  do {
    const page = await list({ cursor, limit: 1000 })
    for (const b of page.blobs) {
      seen++
      manifest.push({ pathname: b.pathname, size: b.size, url: b.url, uploadedAt: b.uploadedAt })
      const dest = join(dir, b.pathname)
      if (existsSync(dest) && statSync(dest).size === b.size) continue
      mkdirSync(dirname(dest), { recursive: true })
      try {
        const res = await fetch(b.url)
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
        await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
        copied++; bytes += b.size
      } catch (e) {
        failed++; summary.errors.push(`blob ${b.pathname}: ${e.message}`)
      }
    }
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  writeFileSync(join(ROOT, "blob-manifest.json"), JSON.stringify({ date: today, count: manifest.length, blobs: manifest }, null, 1))
  summary.blob = { seen, copied, failed, mb: Math.round(bytes / 1e6) }
  log(`blob: ${seen} objects, ${copied} new/changed copied (${Math.round(bytes / 1e6)} MB), ${failed} failed`)
}

function checkGit() {
  try {
    const status = execSync("git status --porcelain --branch", { encoding: "utf8" }).split("\n")[0]
    const ahead = /ahead (\d+)/.exec(status)?.[1] ?? "0"
    const head = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()
    summary.git = { head, unpushed: Number(ahead), line: status }
    log(`git: HEAD ${head}, ${ahead} unpushed commit(s) — code lives on GitHub (origin)`)
  } catch (e) { summary.errors.push(`git: ${e.message}`) }
}

try {
  if (!args.has("--blob-only")) await backupDb()
  if (!args.has("--db-only")) await backupBlob()
  checkGit()
} catch (e) {
  summary.errors.push(e.message)
  log(`ERROR ${e.message}`)
}
summary.seconds = Math.round((Date.now() - started) / 1000)
summary.ok = summary.errors.length === 0
writeFileSync(join(ROOT, "last-run.json"), JSON.stringify(summary, null, 1))
log(`done in ${summary.seconds}s ${summary.ok ? "OK" : `with ${summary.errors.length} error(s)`}`)
process.exit(summary.ok ? 0 : 1)
