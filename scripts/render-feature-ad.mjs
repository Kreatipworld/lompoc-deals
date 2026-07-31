#!/usr/bin/env node
/**
 * Builds the platform feature ad: big type that completes itself, one claim per beat, readable
 * with the sound off.
 *
 * The numbers are queried live at render time, so the ad can't quietly go stale — if the
 * business count moves, the next render says the new number. Nothing here is hand-typed except
 * the claims themselves, and every claim maps to something the platform actually does.
 *
 * Same two headless-Chrome facts the other renderers work around (see lib/video-frames.mjs):
 * MediaRecorder returns empty video in headless, and requestAnimationFrame never fires — so
 * frames are painted on a step loop, POSTed out as JPEGs, and encoded by ffmpeg.
 *
 * Usage:
 *   node scripts/render-feature-ad.mjs            # both shapes
 *   node scripts/render-feature-ad.mjs --only=ig
 */
import http from "node:http"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"
import { neon } from "@neondatabase/serverless"

const FPS = 30
const OUT_DIR = "content/social/video"
const REPO = process.cwd()
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

// Instagram's feed gives 4:5 the most room; TikTok is full-screen 9:16.
const SHAPES = {
  ig: { w: 1080, h: 1350, name: "lompoc-locals-features-4x5.mp4" },
  tt: { w: 1080, h: 1920, name: "lompoc-locals-features-9x16.mp4" },
}
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean)

const dbUrl = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(dbUrl)

async function liveNumbers() {
  const [[b], [e], [l], [p], [a]] = await Promise.all([
    sql`select count(*)::int n from businesses where status='approved'`,
    sql`select count(*)::int n from events where status='approved' and starts_at > now()`,
    sql`select count(*)::int n from events
        where status='approved' and starts_at > now() and title ilike '%rocket launch%'`,
    sql`select sum(jsonb_array_length(coalesce(photos_json,'[]'::jsonb)))::int n
        from businesses where status='approved'`,
    sql`select count(*)::int n from activities`,
  ])
  return { businesses: b.n, events: e.n, launches: l.n, photos: p.n, places: a.n }
}

/**
 * The beats. Each is one claim a resident can check, and every one is true of the live site:
 * the counts come from the database above, and the last three describe behaviour the pipeline
 * actually enforces (curation, de-duplication, both locales).
 */
const beats = (n) => [
  { kind: "open", head: "All of Lompoc.", sub: "One place.", dur: 2.2 },
  { head: "Every business in town.", stat: n.businesses.toLocaleString(), label: "local businesses", dur: 2.5 },
  { head: "Every event. Every launch.", stat: n.events.toLocaleString(), label: `upcoming — ${n.launches} over the base`, dur: 2.6 },
  { head: "Real photos of real places.", stat: n.photos.toLocaleString(), label: "photos, no stock imagery", dur: 2.5 },
  { head: "Curated places worth the drive.", stat: n.places.toLocaleString(), label: "hand-checked things to do", dur: 2.5 },
  { head: "One listing each.", sub: "Duplicates merged, not stacked.", dur: 2.4 },
  { head: "En inglés y en español.", sub: "Every page, both languages.", dur: 2.3 },
  { kind: "end", head: "lompoclocals.com", dur: 2.6 },
]

const PLAYER = (W, H, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#FAF5EC;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS};
const spec = ${JSON.stringify(spec)};
const cv = document.getElementById('c'), g = cv.getContext('2d');

const CREAM='#FAF5EC', INK='#241629', PURPLE='#650C75', GOLD='#EFC618', GREEN='#0B992F';
const GHOST='rgba(36,22,41,0.20)';   // the not-yet-landed word, as in the reference ad

const easeOut = t => 1 - Math.pow(1 - t, 3);
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp = (a,b,t) => a + (b-a)*t;

const load = src => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
});

/** Greedy wrap into lines of words, measured at the given font. */
function wrapWords(words, font, maxW) {
  g.font = font;
  const lines = [[]];
  for (const w of words) {
    const test = [...lines[lines.length-1], w].join(' ');
    if (g.measureText(test).width > maxW && lines[lines.length-1].length) lines.push([w]);
    else lines[lines.length-1].push(w);
  }
  return lines;
}

/**
 * Words land one after another: each fades up from the ghost colour to ink over a short beat,
 * so the line visibly completes itself rather than appearing all at once.
 */
function drawReveal(text, {y, size, weight, colour, maxW, x, p, stagger}) {
  const font = weight + ' ' + size + 'px "Plus Jakarta Sans", sans-serif';
  const words = text.split(' ');
  const lines = wrapWords(words, font, maxW);
  g.font = font; g.textBaseline = 'alphabetic';
  const lh = size * 1.06;
  let idx = 0;
  let yy = y;
  for (const line of lines) {
    let xx = x;
    for (const w of line) {
      const start = idx * stagger;
      const t = clamp01((p - start) / 0.22);
      const rise = (1 - easeOut(t)) * size * 0.16;
      g.fillStyle = t >= 1 ? colour : GHOST;
      if (t > 0 && t < 1) { g.save(); g.globalAlpha = lerp(0.35, 1, t); }
      g.fillText(w, xx, yy + rise);
      if (t > 0 && t < 1) g.restore();
      xx += g.measureText(w + ' ').width;
      idx++;
    }
    yy += lh;
  }
  return yy - y;
}

let MARK, MARK_W;
const PAD = Math.round(W * 0.093);
// The mark's SVG carries a viewBox but no width/height, so Chrome reports the default 300x150
// and the drawing came out squashed. Take the ratio from the viewBox instead.
const MARK_ASPECT = 314 / 402;

function lockup(alpha, white) {
  const img = white ? MARK_W : MARK;
  if (!img) return;
  g.save(); g.globalAlpha = alpha;
  const h = Math.round(W * 0.072);
  g.drawImage(img, PAD, PAD * 0.7, h * MARK_ASPECT, h);
  g.restore();
}

/** Lines the headline will occupy, so the block can be centred before anything is painted. */
function headLines(text, size) {
  return wrapWords(text.split(' '), '800 ' + size + 'px "Plus Jakarta Sans", sans-serif', W - PAD*2).length;
}

function paint(beat, p, tAbs) {
  const isEnd = beat.kind === 'end';
  g.fillStyle = isEnd ? PURPLE : CREAM;
  g.fillRect(0,0,W,H);

  if (isEnd) {
    // Closing card: the mark, the address, nothing else competing with it.
    const a = clamp01(p / 0.18);
    g.save(); g.globalAlpha = a;
    const h = Math.round(W * 0.20);
    if (MARK_W) g.drawImage(MARK_W, (W - h*MARK_ASPECT)/2, H*0.30, h*MARK_ASPECT, h);
    g.restore();
    g.textAlign = 'center';
    drawReveal(beat.head, {
      y: H*0.56, size: Math.round(W*0.072), weight: '800', colour: GOLD,
      maxW: W - PAD*2, x: W/2, p, stagger: 0.10,
    });
    g.font = '600 ' + Math.round(W*0.032) + 'px "Plus Jakarta Sans", sans-serif';
    g.fillStyle = 'rgba(255,255,255,' + clamp01((p-0.5)/0.3)*0.85 + ')';
    g.fillText('Made by locals, for locals', W/2, H*0.63);
    g.textAlign = 'left';
    return;
  }

  lockup(clamp01(p/0.2) * 0.9, false);

  // Centre the whole block rather than hanging it from a fixed top: the beats differ in height
  // (one line or two, stat or sub-line) and a fixed anchor left the lower half of the frame empty.
  const headSize = beat.kind === 'open' ? Math.round(W*0.105) : Math.round(W*0.082);
  const nLines = headLines(beat.head, headSize);
  let blockH = nLines * headSize * 1.06;
  if (beat.sub)  blockH += Math.round(W*0.055) + Math.round(W*0.052);
  if (beat.stat) blockH += Math.round(H*0.085) + Math.round(W*0.175) * 0.78 + Math.round(W*0.058);
  const top = Math.max(H*0.22, (H - blockH)/2) + headSize*0.62;
  const used = drawReveal(beat.head, {
    y: top, size: headSize, weight: '800', colour: INK,
    maxW: W - PAD*2, x: PAD, p, stagger: 0.085,
  });

  if (beat.sub) {
    const a = clamp01((p - 0.34) / 0.26);
    g.save(); g.globalAlpha = a;
    g.fillStyle = PURPLE;
    g.font = '700 ' + Math.round(W*0.052) + 'px "Plus Jakarta Sans", sans-serif';
    g.fillText(beat.sub, PAD, top + used + Math.round(W*0.055) + (1-easeOut(a))*22);
    g.restore();
  }

  if (beat.stat) {
    // The number carries the beat the way the product glyph does in the reference.
    const a = clamp01((p - 0.30) / 0.30);
    const scale = lerp(0.92, 1, easeOut(a));
    const sy = top + used + Math.round(H*0.085);
    g.save(); g.globalAlpha = a;
    g.translate(PAD, sy); g.scale(scale, scale);
    g.fillStyle = GREEN;
    g.font = '800 ' + Math.round(W*0.175) + 'px "Plus Jakarta Sans", sans-serif';
    g.fillText(beat.stat, 0, 0);
    const numW = g.measureText(beat.stat).width;
    g.restore();
    const la = clamp01((p - 0.48) / 0.28);
    g.save(); g.globalAlpha = la;
    g.fillStyle = 'rgba(36,22,41,0.62)';
    g.font = '600 ' + Math.round(W*0.036) + 'px "Plus Jakarta Sans", sans-serif';
    g.fillText(beat.label, PAD, sy + Math.round(W*0.058));
    g.restore();
  }

  // A hairline that grows across the beat — a quiet progress cue, like a slide advancing.
  g.fillStyle = 'rgba(101,12,117,0.16)';
  g.fillRect(PAD, H - PAD*0.75, (W - PAD*2) * clamp01(p), 5);
}

const toBlob = () => new Promise(r => cv.toBlob(r, 'image/jpeg', 0.94));

(async () => {
  MARK   = await load('/brand/lompoc-locals-mark.svg');
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  await document.fonts.load('800 120px "Plus Jakarta Sans"');
  await document.fonts.load('600 40px "Plus Jakarta Sans"');
  await document.fonts.ready;

  const total = spec.beats.reduce((a,b) => a + b.dur, 0);
  const frames = Math.round(total * FPS);
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    let acc = 0, beat = spec.beats[0], local = 0;
    for (const b of spec.beats) {
      if (t < acc + b.dur) { beat = b; local = t - acc; break; }
      acc += b.dur;
    }
    paint(beat, local / beat.dur, t);

    // Short cross-dissolve into cream at every seam, so beats cut cleanly rather than snapping.
    const FADE = 0.16;
    const intoBeat = local, outOfBeat = beat.dur - local;
    const edge = Math.min(intoBeat, outOfBeat);
    if (edge < FADE) {
      g.fillStyle = 'rgba(250,245,236,' + (1 - edge/FADE) * 0.55 + ')';
      g.fillRect(0,0,W,H);
    }

    const blob = await toBlob();
    await fetch('/frame?n=' + String(i).padStart(5,'0'), { method:'POST', body: await blob.arrayBuffer() });
  }
  await fetch('/done', { method:'POST' });
  document.title = 'DONE';
})();
</script>`

async function renderShape(key, numbers) {
  const { w: W, h: H, name } = SHAPES[key]
  const spec = { beats: beats(numbers) }
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `ad-${key}-`))
  let written = 0
  let finished = false

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (url.pathname === "/player.html") {
      res.writeHead(200, { "content-type": "text/html" })
      return res.end(PLAYER(W, H, spec))
    }
    if (url.pathname.startsWith("/brand/")) {
      const f = path.join(REPO, "public/brand", path.basename(url.pathname))
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { "content-type": "image/svg+xml" })
      return res.end(fs.readFileSync(f))
    }
    if (url.pathname === "/frame" && req.method === "POST") {
      const chunks = []
      req.on("data", (c) => chunks.push(c))
      req.on("end", () => {
        fs.writeFileSync(path.join(frameDir, `f-${url.searchParams.get("n")}.jpg`), Buffer.concat(chunks))
        written++
        res.writeHead(200); res.end("ok")
      })
      return
    }
    if (url.pathname === "/done") { finished = true; res.writeHead(200); return res.end("ok") }
    res.writeHead(404); res.end()
  })

  await new Promise((r) => server.listen(0, r))
  const port = server.address().port
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    `--window-size=${W},${H}`,
    `http://localhost:${port}/player.html`,
  ], { stdio: "ignore" })

  const deadline = Date.now() + (expected * 0.5 + 150) * 1000
  while (!finished && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250))
  chrome.kill()
  server.close()

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`${key}: painted only ${written}/${expected} frames`)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outFile = path.join(OUT_DIR, name)
  const code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, [
      "-y", "-framerate", String(FPS),
      "-i", path.join(frameDir, "f-%05d.jpg"),
      "-c:v", "libx264", "-preset", "slow", "-crf", "19",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile,
    ], { stdio: "ignore" })
    ff.on("close", r)
  })
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${outFile}`)

  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${name.padEnd(36)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB`)
  return outFile
}

const numbers = await liveNumbers()
console.log("live numbers:", numbers, "\n")
for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  await renderShape(key, numbers)
}
