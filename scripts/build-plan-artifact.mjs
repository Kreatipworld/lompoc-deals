#!/usr/bin/env node
/**
 * Renders content/social/calendar.csv into a single self-contained HTML page.
 *
 * The page is for curating on the go — opened on a phone, away from the repo — so every image is
 * inlined as a data URI. Artifacts are served under a strict CSP that blocks every external host,
 * which rules out both the Blob URLs the cards live at and any webfont CDN.
 *
 * Usage: node scripts/build-plan-artifact.mjs [outFile]
 */
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const CSV = "content/social/calendar.csv"
const LEDGER = "content/social/reports/ledger.csv"
const OUT = process.argv[2] || "content/social/plan.html"
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "plan-thumbs-"))

function parseCsv(text) {
  const rows = []
  let row = [], field = "", quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') (field += '"'), i++; else quoted = false }
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ",") (row.push(field), (field = ""))
    else if (c === "\n") (row.push(field), rows.push(row), (row = []), (field = ""))
    else if (c !== "\r") field += c
  }
  if (field || row.length) (row.push(field), rows.push(row))
  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""))
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])))
}

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** A small JPEG, inlined. Videos have no card, so they fall back to a tinted brand tile. */
function thumb(file, id) {
  if (!file || !fs.existsSync(file) || /\.mp4$/i.test(file)) return null
  const out = path.join(TMP, `${id}.jpg`)
  try {
    execFileSync(ffmpegPath, ["-y", "-i", file, "-vf", "scale=260:-1", "-q:v", "6", out], {
      stdio: "ignore", timeout: 30_000,
    })
    return `data:image/jpeg;base64,${fs.readFileSync(out).toString("base64")}`
  } catch {
    return null
  }
}

const rows = parseCsv(fs.readFileSync(CSV, "utf8"))
const ledger = fs.existsSync(LEDGER) ? parseCsv(fs.readFileSync(LEDGER, "utf8")) : []
const queued = new Set(ledger.map((l) => `${l.due_at_local.slice(0, 10)}|${l.channel}`))

// Each series gets a fixed hue from the brand palette so a week reads as a pattern, not a list.
const SERIES = {
  "The week ahead": "cal",
  "Worth the stop": "place",
  "One street": "street",
  "The short list": "list",
  "On the record": "record",
  "Upcoming launch": "launch",
  "Weekend plans": "weekend",
  Video: "video",
}

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const items = rows.map((r, i) => {
  const [y, m, d] = r.date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const isQueued = queued.has(`${r.date}|instagram`) || queued.has(`${r.date}|tiktok`)
  return {
    ...r,
    day: DAY[dt.getDay()],
    dayNum: d,
    month: MONTH[m - 1],
    week: `${MONTH[m - 1]} ${d - dt.getDay() > 0 ? d - dt.getDay() : d}`,
    monday: new Date(y, m - 1, d - ((dt.getDay() + 6) % 7)).toISOString().slice(0, 10),
    queued: isQueued,
    kind: SERIES[r.series] || "record",
    img: thumb(r.media, `t${i}`),
    lines: r.text.split("\n").filter(Boolean),
  }
})

const weeks = [...new Set(items.map((i) => i.monday))].sort()
const counts = items.reduce((m, i) => ((m[i.series] = (m[i.series] || 0) + 1), m), {})
const qCount = items.filter((i) => i.queued).length

const card = (i) => `
  <article class="post ${i.queued ? "is-queued" : ""}">
    <div class="when">
      <span class="dow">${i.day}</span>
      <span class="dnum">${i.dayNum}</span>
      <span class="mon">${i.month}</span>
      <span class="time">${i.time}</span>
    </div>
    <div class="shot">${
      i.img
        ? `<img src="${i.img}" alt="Card for the ${esc(i.series)} post on ${esc(i.date)}" loading="lazy">`
        : `<div class="novid"><span>film</span></div>`
    }</div>
    <div class="body">
      <div class="meta">
        <span class="tag t-${i.kind}">${esc(i.series)}</span>
        <span class="state">${i.queued ? "Queued in Buffer" : "Not scheduled"}</span>
      </div>
      <p class="lead">${esc(i.lines[0] || "")}</p>
      <details>
        <summary>Full caption</summary>
        <pre>${esc(i.text)}</pre>
        ${i.link ? `<p class="link">${esc(i.link.replace(/^https?:\/\/www\./, ""))}</p>` : ""}
      </details>
    </div>
  </article>`

const html = `<title>Lompoc Locals — content plan</title>
<style>
  :root {
    --purple:#650C75; --green:#0B992F; --gold:#EFC618; --ink:#241629;
    --bg:#FBF7F1; --surface:#FFFFFF; --line:#E7DFD4;
    --text:#241629; --dim:#6C6070; --rule:#EFE7DC;
    --shadow:0 1px 2px rgba(36,22,41,.05), 0 8px 24px -16px rgba(36,22,41,.28);
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#15101A; --surface:#1E1725; --line:#332A3C; --text:#F3EAF5; --dim:#A093AA; --rule:#2A2233;
      --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8); }
  }
  :root[data-theme="dark"] { --bg:#15101A; --surface:#1E1725; --line:#332A3C; --text:#F3EAF5; --dim:#A093AA; --rule:#2A2233;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8); }
  :root[data-theme="light"] { --bg:#FBF7F1; --surface:#FFFFFF; --line:#E7DFD4; --text:#241629; --dim:#6C6070; --rule:#EFE7DC;
    --shadow:0 1px 2px rgba(36,22,41,.05), 0 8px 24px -16px rgba(36,22,41,.28); }

  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    line-height:1.5; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:1080px; margin:0 auto; padding:32px 20px 96px; }

  header { border-bottom:2px solid var(--ink); padding-bottom:18px; margin-bottom:8px; }
  @media (prefers-color-scheme: dark) { header { border-bottom-color:var(--gold); } }
  :root[data-theme="dark"] header { border-bottom-color:var(--gold); }
  .eyebrow { font-family:Georgia,"Times New Roman",serif; font-style:italic; color:var(--purple);
    font-size:1.05rem; letter-spacing:.01em; }
  @media (prefers-color-scheme: dark) { .eyebrow { color:var(--gold); } }
  :root[data-theme="dark"] .eyebrow { color:var(--gold); }
  h1 { font-size:clamp(1.9rem,5vw,2.9rem); line-height:1.05; margin:.15em 0 .3em; letter-spacing:-.02em;
    text-wrap:balance; font-weight:800; }
  .sub { color:var(--dim); max-width:62ch; margin:0; }

  .stats { display:flex; flex-wrap:wrap; gap:10px; margin:22px 0 34px; }
  .stat { background:var(--surface); border:1px solid var(--line); border-radius:2px; padding:10px 14px;
    box-shadow:var(--shadow); }
  .stat b { display:block; font-size:1.5rem; line-height:1; font-variant-numeric:tabular-nums; }
  .stat span { font-size:.72rem; text-transform:uppercase; letter-spacing:.09em; color:var(--dim); }

  .weekhead { display:flex; align-items:baseline; gap:12px; margin:34px 0 12px;
    padding-bottom:6px; border-bottom:1px solid var(--rule); }
  .weekhead h2 { font-size:.78rem; text-transform:uppercase; letter-spacing:.14em; margin:0; color:var(--dim);
    font-weight:700; }
  .weekhead .n { font-size:.72rem; color:var(--dim); font-variant-numeric:tabular-nums; }

  .posts { display:flex; flex-direction:column; gap:10px; }
  .post { display:grid; grid-template-columns:58px 92px 1fr; gap:14px; align-items:start;
    background:var(--surface); border:1px solid var(--line); border-left:3px solid var(--rule);
    border-radius:2px; padding:12px 14px; box-shadow:var(--shadow); }
  .post.is-queued { border-left-color:var(--green); }

  .when { text-align:center; padding-top:2px; }
  .dow { display:block; font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; color:var(--dim); }
  .dnum { display:block; font-size:1.45rem; font-weight:800; line-height:1.05; font-variant-numeric:tabular-nums; }
  .mon { display:block; font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; color:var(--dim); }
  .time { display:block; margin-top:5px; font-size:.7rem; color:var(--dim); font-variant-numeric:tabular-nums; }

  .shot img { width:92px; height:115px; object-fit:cover; border-radius:1px; display:block;
    background:var(--rule); }
  .novid { width:92px; height:115px; display:grid; place-items:center; border-radius:1px;
    background:linear-gradient(160deg,var(--purple),#3a0745); color:var(--gold);
    font-family:Georgia,serif; font-style:italic; font-size:.8rem; }

  .meta { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:6px; }
  .tag { font-size:.68rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase;
    padding:3px 8px; border-radius:2px; color:#fff; background:var(--purple); }
  .t-cal { background:var(--ink); } .t-place { background:var(--green); }
  .t-street { background:#7A1B8C; } .t-list { background:#0E7C6B; }
  .t-record { background:var(--purple); } .t-launch { background:#1B3A8C; }
  .t-weekend { background:#B4530E; } .t-video { background:#4A0857; }
  .state { font-size:.7rem; color:var(--dim); }
  .is-queued .state { color:var(--green); font-weight:600; }

  .lead { margin:0; font-size:.95rem; }
  details { margin-top:8px; }
  summary { cursor:pointer; font-size:.74rem; color:var(--dim); letter-spacing:.04em; }
  summary:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
  details pre { white-space:pre-wrap; font:inherit; font-size:.86rem; color:var(--text);
    background:var(--bg); border:1px solid var(--rule); border-radius:2px; padding:10px 12px; margin:8px 0 0;
    overflow-x:auto; }
  .link { margin:6px 0 0; font-size:.76rem; color:var(--dim); word-break:break-all; }

  footer { margin-top:48px; padding-top:16px; border-top:1px solid var(--rule); color:var(--dim); font-size:.8rem; }

  @media (max-width:640px) {
    .post { grid-template-columns:52px 72px 1fr; gap:10px; padding:10px; }
    .shot img, .novid { width:72px; height:90px; }
    .dnum { font-size:1.2rem; }
  }
  @media (prefers-reduced-motion:reduce) { * { animation:none !important; transition:none !important; } }
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">the town, on the record</div>
    <h1>Content plan</h1>
    <p class="sub">Every post generated from live site data — real events, real businesses, real launch dates.
      Nothing here promises a page that doesn't exist.</p>
  </header>

  <div class="stats">
    <div class="stat"><b>${items.length}</b><span>posts</span></div>
    <div class="stat"><b>${qCount}</b><span>queued</span></div>
    <div class="stat"><b>${items.length - qCount}</b><span>waiting</span></div>
    <div class="stat"><b>${weeks.length}</b><span>weeks</span></div>
    <div class="stat"><b>${items[0].month} ${items[0].dayNum}</b><span>starts</span></div>
    <div class="stat"><b>${items[items.length - 1].month} ${items[items.length - 1].dayNum}</b><span>ends</span></div>
  </div>

  ${weeks
    .map((w) => {
      const inWeek = items.filter((i) => i.monday === w)
      const [wy, wm, wd] = w.split("-").map(Number)
      return `<section>
      <div class="weekhead">
        <h2>Week of ${MONTH[wm - 1]} ${wd}</h2>
        <span class="n">${inWeek.length} post${inWeek.length === 1 ? "" : "s"} · ${
        inWeek.filter((i) => i.queued).length
      } queued</span>
      </div>
      <div class="posts">${inWeek.map(card).join("")}</div>
    </section>`
    })
    .join("")}

  <footer>
    Series in rotation: ${Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${esc(k)} (${v})`)
      .join(" · ")}.
    Regenerate with <code>build-content-calendar.mjs</code> → <code>build-social-cards.mjs</code> →
    <code>render-social-cards.mjs</code>.
  </footer>
</div>
`

fs.writeFileSync(OUT, html)
fs.rmSync(TMP, { recursive: true, force: true })
const kb = Math.round(fs.statSync(OUT).size / 1024)
console.log(`${items.length} posts (${qCount} queued) → ${OUT}  ${kb} kb`)
