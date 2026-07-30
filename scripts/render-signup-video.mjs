#!/usr/bin/env node
/**
 * Builds the vertical signup videos from real screenshots of the live site.
 *
 * A headless Chrome page paints the timeline onto a 1080x1920 canvas one frame at a time and
 * POSTs each frame to this script's own HTTP server; ffmpeg-static then encodes the sequence
 * to H.264 MP4. (MediaRecorder would be the obvious shortcut, but its canvas capture returns
 * empty video under headless Chrome — the painting works, the capture pipeline doesn't.)
 *
 * Capture the frames first (see content/social/video/README.md), then:
 *   node scripts/render-signup-video.mjs <framesDir> <outDir> [locals|business]
 */
import http from "node:http"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const FRAMES = process.argv[2] || "frames"
const OUT = process.argv[3] || "content/social/video"
const ONLY = process.argv[4]

const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const W = 1080
const H = 1920
const FPS = 30

// ── timelines ────────────────────────────────────────────────────────────────
// Each scene names a captured PNG, how long it's on screen, and where the pan starts and
// ends as a fraction of the scrollable height (0 = top of page, 1 = bottom).
const VIDEOS = {
  locals: {
    file: "lompoc-locals-signup.mp4",
    accent: "#650C75",
    bg: ["#2b0733", "#650C75"],
    scenes: [
      { img: "home", dur: 2.6, from: 0.0, to: 0.14, caption: "Lompoc has its own site now." },
      { img: "deals", dur: 2.8, from: 0.02, to: 0.45, caption: "Every local deal, one feed." },
      { img: "bizdeal", dur: 2.8, from: 0.06, to: 0.4, caption: "Real businesses. Real photos." },
      { img: "activities", dur: 2.4, from: 0.05, to: 0.5, caption: "And everywhere worth going." },
      { img: "signup", dur: 2.4, from: 0.0, to: 0.35, caption: "Free account. Two fields." },
      { img: "endcard-locals", dur: 2.4, from: 0, to: 0, zoom: 1.06, fullBleed: true },
    ],
  },
  business: {
    file: "lompoc-locals-claim.mp4",
    accent: "#0B992F",
    bg: ["#044313", "#0B992F"],
    scenes: [
      { img: "bizclaim", dur: 3.4, from: 0.0, to: 0.12, caption: "Your business page already exists." },
      { img: "bizclaim", dur: 3.4, from: 0.12, to: 0.42, caption: "Photos, hours, map — already built." },
      // Lands with the "Is this your business? / Claim this listing" card mid-frame — this
      // scene is the whole ask, so the button has to be visible while the caption says it.
      { img: "bizclaim", dur: 3.6, from: 0.74, to: 0.95, caption: "There's a Claim button on it." },
      { img: "signup", dur: 3.0, from: 0.0, to: 0.35, caption: "Two minutes. No charge." },
      { img: "partners", dur: 3.0, from: 0.04, to: 0.42, caption: "Then it's yours to run." },
      { img: "endcard-business", dur: 2.8, from: 0, to: 0, zoom: 1.06, fullBleed: true },
    ],
  },
}

// ── the page that paints and records ─────────────────────────────────────────
const PLAYER = /* html */ `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#111;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS};
const spec = JSON.parse(decodeURIComponent(location.hash.slice(1)));
const cv = document.getElementById('c'), g = cv.getContext('2d');

const load = src => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
});

const easeInOut = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;

// Phone geometry. The screenshots are shown inside a device frame rather than full-bleed —
// full-bleed reads as "someone sent me a screenshot", a framed device reads as a product demo.
const PX = 48, PY = 132, PW = 984, PH = 1520, RAD = 68, BEZEL = 13;

/** Draw one scene frame: the screenshot panned inside the phone, on a brand-coloured field. */
function drawScene(img, p, scene, bg) {
  // Background wash
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, bg[0]); grd.addColorStop(1, bg[1]);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);

  if (scene.fullBleed) {
    const s = (W / img.width) * (scene.zoom ? 1 + (scene.zoom - 1) * p : 1);
    g.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    return;
  }

  // Device body + shadow
  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 60; g.shadowOffsetY = 26;
  g.fillStyle = '#15101a';
  roundRect(PX, PY, PW, PH, RAD); g.fill();
  g.restore();

  // Screen
  const sx = PX + BEZEL, sy = PY + BEZEL, sw = PW - BEZEL * 2, sh = PH - BEZEL * 2;
  g.save();
  roundRect(sx, sy, sw, sh, RAD - BEZEL); g.clip();
  g.fillStyle = '#fff'; g.fillRect(sx, sy, sw, sh);
  const scale = (sw / img.width) * (scene.zoom ? 1 + (scene.zoom - 1) * p : 1);
  const drawH = img.height * scale, drawW = img.width * scale;
  const travel = Math.max(0, drawH - sh);
  const y = sy - travel * (scene.from + (scene.to - scene.from) * easeInOut(p));
  g.drawImage(img, sx + (sw - drawW) / 2, y, drawW, drawH);
  g.restore();

  // Specular edge so the device reads as glass rather than a flat rectangle
  g.save();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3;
  roundRect(PX + 2, PY + 2, PW - 4, PH - 4, RAD - 2); g.stroke();
  g.restore();
}

function wrap(text, maxW) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** Caption bar, bottom third, brand colour, fading in and out with the scene. */
function drawCaption(text, alpha, accent) {
  if (!text || alpha <= 0.01) return;
  g.save(); g.globalAlpha = alpha;
  g.font = '800 62px "Plus Jakarta Sans", -apple-system, Helvetica, sans-serif';
  const lines = wrap(text, W - 320);
  const lh = 84, padY = 52, padX = 60;
  const boxH = lines.length * lh + padY * 2 - (lh - 62);
  // TikTok/Reels overlay their own UI across roughly the bottom 22% and the right edge.
  // Keeping the card at y = H - 640 puts it inside the phone and clear of both.
  const boxW = W - 200, x = 100, y = H - 640;
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.filter = 'blur(0px)';
  roundRect(x + 6, y + 10, boxW, boxH, 34); g.fill();
  g.fillStyle = accent;
  roundRect(x, y, boxW, boxH, 34); g.fill();
  g.fillStyle = '#fff'; g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, x + padX, y + padY + i * lh - 6));
  g.restore();
}

function roundRect(x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

(async () => {
  await document.fonts.ready;
  const imgs = {};
  for (const s of spec.scenes) if (!imgs[s.img]) imgs[s.img] = await load('/frames/' + s.img + '.png');

  // MediaRecorder's canvas capture yields empty output in headless Chrome — the painting
  // works (verified), the capture pipeline doesn't. So frames are emitted one at a time as
  // JPEGs and handed to ffmpeg instead. Stepping by frame index rather than wall clock also
  // means every frame lands exactly on its mark, with no dropped or duplicated frames.
  const FADE = 0.45; // seconds of caption fade at each end of a scene
  const total = spec.scenes.reduce((a, s) => a + s.dur, 0);
  const frameCount = Math.round(total * FPS);

  const toBlob = () => new Promise(r => cv.toBlob(r, 'image/jpeg', 0.93));

  for (let i = 0; i < frameCount; i++) {
    const t = i / FPS;
    let acc = 0, scene = spec.scenes[0], local = 0;
    for (const s of spec.scenes) {
      if (t < acc + s.dur) { scene = s; local = t - acc; break; }
      acc += s.dur;
    }
    drawScene(imgs[scene.img], local / scene.dur, scene, spec.bg);
    const a = Math.min(1, local / FADE, (scene.dur - local) / FADE);
    drawCaption(scene.caption, a, spec.accent);
    // Whole-frame fade from/to black at the very start and end of the video.
    const edge = Math.min(t / 0.5, (total - t) / 0.6, 1);
    if (edge < 1) { g.fillStyle = 'rgba(0,0,0,' + (1 - edge) + ')'; g.fillRect(0, 0, W, H); }

    const blob = await toBlob();
    await fetch('/frame?n=' + String(i).padStart(5, '0'), {
      method: 'POST', body: await blob.arrayBuffer(),
    });
  }

  await fetch('/done?count=' + frameCount, { method: 'POST' });
  document.title = 'DONE';
})();
</script>`

// ── server + driver ──────────────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true })

const targets = ONLY ? [ONLY] : Object.keys(VIDEOS)
const results = []

let frameDir = ""
let framesWritten = 0
let finished = false

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost")

  if (url.pathname === "/player.html") {
    res.writeHead(200, { "content-type": "text/html" })
    return res.end(PLAYER)
  }
  if (url.pathname.startsWith("/frames/")) {
    const f = path.join(FRAMES, path.basename(url.pathname))
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
    res.writeHead(200, { "content-type": "image/png" })
    return res.end(fs.readFileSync(f))
  }
  if (url.pathname === "/frame" && req.method === "POST") {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      fs.writeFileSync(path.join(frameDir, `f-${url.searchParams.get("n")}.jpg`), Buffer.concat(chunks))
      framesWritten++
      if (framesWritten % 60 === 0) process.stdout.write(`    ${framesWritten} frames\r`)
      res.writeHead(200); res.end("ok")
    })
    return
  }
  if (url.pathname === "/done" && req.method === "POST") {
    finished = true
    res.writeHead(200); res.end("ok")
    return
  }
  res.writeHead(404); res.end()
})

await new Promise((r) => server.listen(0, r))
const port = server.address().port

for (const key of targets) {
  const spec = VIDEOS[key]
  if (!spec) throw new Error(`unknown video "${key}"`)
  const seconds = spec.scenes.reduce((a, s) => a + s.dur, 0)
  const expected = Math.round(seconds * FPS)
  console.log(`painting ${key} → ${spec.file}  (${seconds.toFixed(1)}s · ${expected} frames)`)

  frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `vid-${key}-`))
  framesWritten = 0
  finished = false

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      `--window-size=${W},${H}`,
      `http://localhost:${port}/player.html#${encodeURIComponent(JSON.stringify(spec))}`,
    ],
    { stdio: "ignore" }
  )

  const deadline = Date.now() + (expected * 0.5 + 120) * 1000
  while (!finished && Date.now() < deadline) await new Promise((r) => setTimeout(r, 300))
  chrome.kill()

  if (framesWritten < expected) {
    console.log(`  ✗ ${key} — only ${framesWritten}/${expected} frames painted`)
    fs.rmSync(frameDir, { recursive: true, force: true })
    continue
  }

  const dest = path.join(OUT, spec.file)
  // yuv420p + even dimensions keep it playable everywhere; faststart puts the moov atom
  // up front so it starts playing before the whole file downloads.
  const args = [
    "-y", "-framerate", String(FPS),
    "-i", path.join(frameDir, "f-%05d.jpg"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "20",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    dest,
  ]
  const code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, args, { stdio: "ignore" })
    ff.on("close", r)
  })
  fs.rmSync(frameDir, { recursive: true, force: true })

  if (code !== 0 || !fs.existsSync(dest)) {
    console.log(`  ✗ ${key} — ffmpeg exited ${code}`)
    continue
  }
  const bytes = fs.statSync(dest).size
  results.push(dest)
  console.log(`  ✓ ${spec.file}  ${(bytes / 1e6).toFixed(1)} MB  ${W}x${H}  ${seconds.toFixed(1)}s`)
}

server.close()
console.log(`\n${results.length}/${targets.length} written to ${OUT}/`)
process.exit(0)
