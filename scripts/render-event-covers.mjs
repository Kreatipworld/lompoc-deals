#!/usr/bin/env node
/**
 * Renders the event topic covers to public/event-covers/<slug>.jpg (1200×675).
 *
 * Every event from the explorelompoc feed arrives with the same generic photo, so the
 * grid rendered as one flower field over and over (owner, Sep 20 2026: "very repetitive").
 * These are designed cards — one per topic, each its own palette and glyph — so a screen
 * of events reads as a set of different things happening, not one picture repeated.
 *
 *   node scripts/render-event-covers.mjs
 */
import { chromium } from "playwright"
import { mkdirSync } from "node:fs"
import { join } from "node:path"

const OUT = join(process.cwd(), "public", "event-covers")
mkdirSync(OUT, { recursive: true })

// glyphs are simple line drawings — big, soft, and set behind the type
const G = {
  art: '<path d="M12 44c0-17 14-31 31-31 16 0 28 9 28 21 0 8-6 12-13 12h-6c-5 0-8 3-8 7 0 2 1 4 2 5 1 2 2 3 2 5 0 4-3 7-8 7C21 70 12 58 12 44Z"/><circle cx="26" cy="38" r="4"/><circle cx="36" cy="27" r="4"/><circle cx="50" cy="26" r="4"/><circle cx="60" cy="34" r="4"/>',
  music: '<path d="M32 62V22l34-8v40"/><circle cx="24" cy="62" r="9"/><circle cx="58" cy="54" r="9"/>',
  history: '<path d="M10 34 42 14l32 20"/><path d="M18 34v30M34 34v30M50 34v30M66 34v30"/><path d="M8 68h68"/>',
  halloween: '<path d="M42 20c-4-8-12-8-12-8s4 6 2 10"/><path d="M42 22c16 0 28 11 28 25S58 72 42 72 14 61 14 47s12-25 28-25Z"/><path d="M30 42l8 6-8 6M54 42l-8 6 8 6M30 62c8-5 16-5 24 0"/>',
  farm: '<path d="M12 62c10-6 16-16 16-28 0 12 6 22 16 28M44 62c10-6 16-16 16-28 0 12 6 22 16 28"/><path d="M8 68h72"/>',
  marine: '<path d="M14 46c10-12 22-18 34-18 14 0 22 8 22 8s-6 4-6 10 6 10 6 10-8 8-22 8c-12 0-24-6-34-18Z"/><circle cx="34" cy="42" r="3"/><path d="M70 36l10-8v36l-10-8"/>',
  sports: '<circle cx="42" cy="42" r="28"/><path d="M42 14c-8 8-12 18-12 28s4 20 12 28M42 14c8 8 12 18 12 28s-4 20-12 28M15 34h54M15 50h54"/>',
  cars: '<path d="M12 50l6-16c1-3 4-5 7-5h34c3 0 6 2 7 5l6 16v10H12V50Z"/><path d="M12 50h60"/><circle cx="26" cy="60" r="6"/><circle cx="58" cy="60" r="6"/>',
  community: '<circle cx="30" cy="30" r="9"/><circle cx="56" cy="34" r="8"/><path d="M12 64c0-10 8-17 18-17s18 7 18 17"/><path d="M44 64c0-8 6-14 14-14s14 6 14 14"/>',
}

const TOPICS = [
  { slug: "art",       label: "Art & galleries", a: "#7b1f6a", b: "#c0417a", c: "#f0a35e" },
  { slug: "music",     label: "Live music",      a: "#1e2a63", b: "#4b3b9a", c: "#8f6ad6" },
  { slug: "history",   label: "History",         a: "#4a3520", b: "#7a5a33", c: "#c09456" },
  { slug: "halloween", label: "Fall & Halloween",a: "#3a1550", b: "#7a2a4f", c: "#e0742b" },
  { slug: "farm",      label: "Farms & fields",  a: "#17402c", b: "#2f6b42", c: "#87b85a" },
  { slug: "marine",    label: "Ocean & wildlife",a: "#06303f", b: "#0d5f74", c: "#4fb0b8" },
  { slug: "sports",    label: "Sports",          a: "#1d3a1d", b: "#2f6b2f", c: "#8dc63f" },
  { slug: "cars",      label: "Cars & shows",    a: "#2a2a33", b: "#4a4a58", c: "#9aa3b2" },
  { slug: "community", label: "Community",       a: "#4a0857", b: "#650C75", c: "#c98a2a" },
]

const page = (t) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:675px;overflow:hidden}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background:
      radial-gradient(70% 90% at 82% 6%, ${t.c}66 0%, transparent 62%),
      radial-gradient(60% 80% at 4% 96%, ${t.b}88 0%, transparent 60%),
      linear-gradient(135deg, ${t.a} 0%, ${t.b} 62%, ${t.a} 100%);
    position:relative}
  .glyph{position:absolute; right:-40px; bottom:-70px; width:660px; height:660px; opacity:.16;
    transform:rotate(-8deg)}
  .glyph svg{width:100%;height:100%}
  .rule{position:absolute; left:74px; top:86px; width:64px; height:7px; border-radius:4px; background:${t.c}}
  .kicker{position:absolute; left:74px; top:118px; color:#fff; opacity:.72;
    font-size:24px; font-weight:700; letter-spacing:8px; text-transform:uppercase}
  .label{position:absolute; left:74px; bottom:96px; right:300px; color:#fff;
    font-size:86px; font-weight:800; letter-spacing:-2.5px; line-height:1.02;
    text-shadow:0 10px 40px rgba(0,0,0,.35)}
  .grain{position:absolute;inset:0;opacity:.10;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")}
</style></head><body>
  <div class="glyph"><svg viewBox="0 0 84 84" fill="none" stroke="#ffffff" stroke-width="3.2"
    stroke-linecap="round" stroke-linejoin="round">${G[t.slug] ?? G.community}</svg></div>
  <div class="rule"></div>
  <div class="kicker">Lompoc</div>
  <div class="label">${t.label}</div>
  <div class="grain"></div>
</body></html>`

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1 })
for (const t of TOPICS) {
  await p.setContent(page(t), { waitUntil: "networkidle" })
  await p.screenshot({ path: join(OUT, `${t.slug}.jpg`), type: "jpeg", quality: 88 })
  console.log("✓", t.slug)
}
await b.close()
console.log(`\n${TOPICS.length} covers → public/event-covers/`)
