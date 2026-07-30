#!/usr/bin/env node
/**
 * Builds content/social/index.html — a contact sheet for everything in the content folder.
 *
 * Open it straight off disk; every path is relative, so it works with no server and no
 * network. It scans the folder rather than hardcoding a list, so anything dropped into
 * posts/, video/ or launch-kit/ shows up on the next run.
 *
 * Usage: node scripts/build-content-index.mjs
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = "content/social"
const OUT = path.join(ROOT, "index.html")

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const ls = (dir, re) => {
  const p = path.join(ROOT, dir)
  return fs.existsSync(p) ? fs.readdirSync(p).filter((f) => re.test(f)).sort() : []
}
const kb = (f) => Math.round(fs.statSync(path.join(ROOT, f)).size / 1024)
const mb = (f) => (fs.statSync(path.join(ROOT, f)).size / 1048576).toFixed(1)

function parseCsv(text) {
  const rows = []
  let row = [],
    field = "",
    quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') (field += '"'), i++
        else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ",") (row.push(field), (field = ""))
    else if (c === "\n") (row.push(field), rows.push(row), (row = []), (field = ""))
    else if (c !== "\r") field += c
  }
  if (field || row.length) (row.push(field), rows.push(row))
  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""))
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])))
}

const csvPath = path.join(ROOT, "calendar.csv")
const posts = fs.existsSync(csvPath) ? parseCsv(fs.readFileSync(csvPath, "utf8")) : []

const fmtDay = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

/** A scheduled post: its own image or video, the caption that ships with it, and where it goes. */
const postCard = (p) => {
  const rel = p.media.replace(/^content\/social\//, "")
  const isVideo = /\.mp4$/i.test(rel)
  const exists = p.media && fs.existsSync(p.media)
  const preview = !exists
    ? `<div class="miss">media missing</div>`
    : isVideo
      ? // #t=0.1 makes the browser paint the first frame instead of a black box.
        `<video src="${esc(rel)}#t=0.1" muted playsinline controls preload="metadata"></video>`
      : `<img src="${esc(rel)}" loading="lazy" alt="">`
  return `
  <article class="post">
    <a class="shot" href="${esc(rel)}" target="_blank">${preview}</a>
    <div class="body">
      <div class="when">${esc(fmtDay(p.date))} · ${esc(p.time)}</div>
      <div class="series">${esc(p.series)}</div>
      <div class="chans">${p.channels
        .split(",")
        .map((c) => `<span class="chip">${esc(c)}</span>`)
        .join("")}</div>
      <pre class="cap">${esc(p.text)}</pre>
      <div class="file">${esc(path.basename(rel))}${exists ? ` · ${isVideo ? mb(rel) + " MB" : kb(rel) + " KB"}` : ""}</div>
    </div>
  </article>`
}

const videos = ls("video", /\.mp4$/i)
const masters = ls("video/masters", /\.(mp4|mov)$/i)
const kit = ls("launch-kit", /\.png$/i)
const kitWeek2 = ls("launch-kit/week2", /\.png$/i)
const kitIdeas = ls("launch-kit/ideas", /\.png$/i)
const decks = ls("cards", /\.html$/i)
const notes = ls("notes", /\.md$/i)

const thumbGrid = (dir, files) =>
  files
    .map(
      (f) => `
    <a class="thumb" href="${esc(dir)}/${esc(f)}" target="_blank">
      <img src="${esc(dir)}/${esc(f)}" loading="lazy" alt="">
      <span>${esc(f)}</span>
    </a>`
    )
    .join("")

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lompoc Locals — content folder</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>
  :root { --purple:#650C75; --gold:#EFC618; --green:#0B992F; --cream:#FAF5EC; --ink:#241629; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; background:var(--cream); color:var(--ink); }
  a { color:inherit; }
  header { background:var(--purple); color:#fff; padding:56px 40px 48px; }
  .wrap { max-width:1280px; margin:0 auto; }
  header .eyebrow { font-family:Georgia,serif; font-style:italic; color:var(--gold); font-size:22px; }
  header h1 { font-size:52px; font-weight:800; line-height:1.05; margin-top:8px; letter-spacing:-.5px; }
  header p { color:#eddcf1; font-size:18px; margin-top:16px; max-width:60ch; line-height:1.55; }
  .stats { display:flex; flex-wrap:wrap; gap:14px; margin-top:28px; }
  .stat { background:rgba(255,255,255,.12); border-radius:12px; padding:12px 18px; }
  .stat b { display:block; font-size:26px; font-weight:800; color:var(--gold); }
  .stat span { font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#eddcf1; }
  section { padding:52px 40px; }
  section + section { border-top:2px solid rgba(36,22,41,.10); }
  h2 { font-size:30px; font-weight:800; letter-spacing:-.3px; }
  h2 small { display:block; font-size:15px; font-weight:500; color:rgba(36,22,41,.6); margin-top:6px; letter-spacing:0; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:26px; margin-top:30px; }
  .post { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(36,22,41,.09); display:flex; flex-direction:column; }
  .post .shot { display:block; background:#eee; aspect-ratio:4/5; }
  .post .shot img, .post .shot video { width:100%; height:100%; object-fit:cover; display:block; }
  .post .miss { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#b00; font-weight:700; font-size:14px; }
  .post .body { padding:18px 20px 20px; display:flex; flex-direction:column; gap:9px; flex:1; }
  .when { font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--purple); }
  .series { font-size:19px; font-weight:700; line-height:1.25; }
  .chans { display:flex; gap:6px; flex-wrap:wrap; }
  .chip { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; background:rgba(101,12,117,.10); color:var(--purple); border-radius:99px; padding:4px 10px; }
  .cap { font-family:inherit; font-size:13px; line-height:1.5; color:rgba(36,22,41,.78); white-space:pre-wrap; word-break:break-word;
    background:var(--cream); border-radius:10px; padding:12px; max-height:210px; overflow:auto; }
  .file { font-size:11px; color:rgba(36,22,41,.45); margin-top:auto; font-variant-numeric:tabular-nums; }
  .thumbs { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:18px; margin-top:26px; }
  .thumb { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(36,22,41,.08); display:block; }
  .thumb img { width:100%; aspect-ratio:4/5; object-fit:cover; display:block; background:#eee; }
  .thumb span { display:block; font-size:11px; padding:8px 10px; color:rgba(36,22,41,.6); word-break:break-all; }
  .vids { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:22px; margin-top:26px; }
  .vid { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(36,22,41,.08); }
  .vid video { width:100%; display:block; background:#000; }
  .vid div { padding:12px 16px; font-size:13px; }
  .vid b { display:block; font-size:14px; font-weight:700; word-break:break-all; }
  .vid span { color:rgba(36,22,41,.5); font-size:12px; }
  ul.files { list-style:none; margin-top:22px; display:grid; gap:9px; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); }
  ul.files a { background:#fff; border-radius:10px; padding:14px 16px; display:flex; justify-content:space-between; gap:12px;
    box-shadow:0 1px 8px rgba(36,22,41,.07); text-decoration:none; font-size:14px; font-weight:600; }
  ul.files span { color:rgba(36,22,41,.45); font-weight:500; font-size:12px; }
  pre.cmd { background:var(--ink); color:#e9dcec; border-radius:12px; padding:20px 22px; margin-top:22px; overflow-x:auto;
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; line-height:1.75; }
  footer { padding:40px; text-align:center; color:rgba(36,22,41,.5); font-size:13px; }
</style></head><body>

<header><div class="wrap">
  <div class="eyebrow">everything we've made, in one folder</div>
  <h1>Lompoc Locals — content</h1>
  <p>This folder is the deliverable. <b>posts/</b> holds one ready-to-post image per scheduled post,
  <b>calendar.csv</b> is the scheduler file that pairs each image with its caption, and everything
  is regenerated from live site data — so it never drifts out of sync with the pages it links to.</p>
  <div class="stats">
    <div class="stat"><b>${posts.length}</b><span>scheduled posts</span></div>
    <div class="stat"><b>${ls("posts", /\.png$/i).length}</b><span>post images</span></div>
    <div class="stat"><b>${videos.length}</b><span>videos</span></div>
    <div class="stat"><b>${kit.length + kitWeek2.length + kitIdeas.length}</b><span>launch-kit assets</span></div>
  </div>
</div></header>

<section><div class="wrap">
  <h2>The month ahead<small>Each card is the exact image and caption that ships together. Click any image for full size.</small></h2>
  <div class="grid">${posts.map(postCard).join("")}</div>
</div></section>

<section><div class="wrap">
  <h2>Video<small>Pre-rendered spots. The calendar rotates one into a Sunday slot each week.</small></h2>
  <div class="vids">${videos
    .map(
      (f) => `
    <div class="vid"><video src="video/${esc(f)}" controls muted preload="metadata"></video>
      <div><b>${esc(f)}</b><span>${mb("video/" + f)} MB</span></div></div>`
    )
    .join("")}</div>
  ${
    masters.length
      ? `<h2 style="margin-top:44px; font-size:22px;">Ad masters<small>Per-placement aspect ratios cut from the brand spot.</small></h2>
  <ul class="files">${masters
    .map((f) => `<li><a href="video/masters/${esc(f)}" target="_blank">${esc(f)}<span>${mb("video/masters/" + f)} MB</span></a></li>`)
    .join("")}</ul>`
      : ""
  }
</div></section>

<section><div class="wrap">
  <h2>Launch kit<small>The first round — profile art, the intro carousel, and the week-two card set.</small></h2>
  <div class="thumbs">${thumbGrid("launch-kit", kit)}</div>
  ${kitWeek2.length ? `<div class="thumbs">${thumbGrid("launch-kit/week2", kitWeek2)}</div>` : ""}
  ${kitIdeas.length ? `<div class="thumbs">${thumbGrid("launch-kit/ideas", kitIdeas)}</div>` : ""}
</div></section>

<section><div class="wrap">
  <h2>Sources &amp; notes<small>Card decks are the HTML the PNGs are rendered from — edit these, not the images.</small></h2>
  <ul class="files">
    <li><a href="calendar.csv" target="_blank">calendar.csv<span>scheduler file</span></a></li>
    ${notes.map((f) => `<li><a href="notes/${esc(f)}" target="_blank">notes/${esc(f)}<span>${kb("notes/" + f)} KB</span></a></li>`).join("")}
    ${decks.map((f) => `<li><a href="cards/${esc(f)}" target="_blank">cards/${esc(f)}<span>${kb("cards/" + f)} KB</span></a></li>`).join("")}
  </ul>
  <h2 style="margin-top:44px; font-size:22px;">Regenerate all of it<small>Run from the repo root. Each step overwrites in place.</small></h2>
  <pre class="cmd">node scripts/build-content-calendar.mjs 4          <span style="color:#9b8aa0"># captions + slots from live data</span>
node scripts/build-social-cards.mjs --write-csv     <span style="color:#9b8aa0"># one card per post, fills the media column</span>
node scripts/render-social-cards.mjs content/social/cards/cards-calendar.html content/social/posts
node scripts/build-content-index.mjs                <span style="color:#9b8aa0"># rebuilds this page</span></pre>
</div></section>

<footer>content/social · rebuild this page with <code>node scripts/build-content-index.mjs</code></footer>
</body></html>
`

fs.writeFileSync(OUT, html)
const broken = posts.filter((p) => !p.media || !fs.existsSync(p.media))
console.log(`${OUT} → ${posts.length} posts, ${videos.length} videos, ${kit.length + kitWeek2.length + kitIdeas.length} kit assets`)
if (broken.length) {
  console.log(`\n${broken.length} post(s) with no usable media:`)
  for (const b of broken) console.log(`  ! ${b.date} ${b.series} → ${b.media || "(empty)"}`)
}
