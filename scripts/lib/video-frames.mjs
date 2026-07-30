/**
 * Paints a UI segment to an MP4: screenshots panned inside a phone frame, on a brand field,
 * with caption cards and step badges.
 *
 * Why it works this way — two headless Chrome facts that cost real time to discover:
 *   • MediaRecorder's canvas capture returns EMPTY video in headless. Painting is fine;
 *     the capture pipeline isn't. So frames are POSTed out as JPEGs and encoded by ffmpeg.
 *   • requestAnimationFrame never fires in headless (no compositor). The loop steps by frame
 *     index instead, which also guarantees no dropped or duplicated frames.
 */
import http from "node:http"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

export const W = 1080
export const H = 1920
export const FPS = 30

const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

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
const easeInOut = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
const easeOut = t => 1 - Math.pow(1 - t, 3);

const PX = 48, PY = 132, PW = 984, PH = 1520, RAD = 68, BEZEL = 13;

function roundRect(x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}

function drawScene(img, p, scene, bg) {
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, bg[0]); grd.addColorStop(1, bg[1]);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);

  if (scene.fullBleed) {
    const s = (W / img.width) * (scene.zoom ? 1 + (scene.zoom - 1) * p : 1);
    g.drawImage(img, (W - img.width*s)/2, (H - img.height*s)/2, img.width*s, img.height*s);
    return;
  }

  // The phone slides up and settles on entry so a cut between beats has momentum.
  const intro = Math.min(1, p / 0.18);
  const lift = (1 - easeOut(intro)) * 90;

  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 60; g.shadowOffsetY = 26;
  g.fillStyle = '#15101a';
  roundRect(PX, PY + lift, PW, PH, RAD); g.fill();
  g.restore();

  const sx = PX + BEZEL, sy = PY + BEZEL + lift, sw = PW - BEZEL*2, sh = PH - BEZEL*2;
  g.save();
  roundRect(sx, sy, sw, sh, RAD - BEZEL); g.clip();
  g.fillStyle = '#fff'; g.fillRect(sx, sy, sw, sh);
  const scale = (sw / img.width) * (scene.zoom ? 1 + (scene.zoom - 1) * p : 1);
  const drawH = img.height * scale, drawW = img.width * scale;
  const travel = Math.max(0, drawH - sh);
  const y = sy - travel * (scene.from + (scene.to - scene.from) * easeInOut(p));
  g.drawImage(img, sx + (sw - drawW)/2, y, drawW, drawH);
  g.restore();

  g.save();
  g.globalAlpha = easeOut(intro);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3;
  roundRect(PX+2, PY+2+lift, PW-4, PH-4, RAD-2); g.stroke();
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

/** Caption card. Slides up as it fades so beats feel cut, not dissolved. */
function drawCaption(text, alpha, accent, rise) {
  if (!text || alpha <= 0.01) return;
  g.save(); g.globalAlpha = alpha;
  g.font = '800 62px "Plus Jakarta Sans", -apple-system, Helvetica, sans-serif';
  const lines = wrap(text, W - 320);
  const lh = 84, padY = 52, padX = 60;
  const boxH = lines.length * lh + padY*2 - (lh - 62);
  const boxW = W - 200, x = 100, y = H - 640 + rise;
  g.fillStyle = 'rgba(0,0,0,.35)';
  roundRect(x+6, y+10, boxW, boxH, 34); g.fill();
  g.fillStyle = accent;
  roundRect(x, y, boxW, boxH, 34); g.fill();
  g.fillStyle = '#fff'; g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, x + padX, y + padY + i*lh - 6));
  g.restore();
}

/** Small counter chip, top-left, so the tour reads as a sequence. */
function drawBadge(label, alpha, accent) {
  if (!label || alpha <= 0.01) return;
  g.save(); g.globalAlpha = alpha;
  g.font = '800 34px "Plus Jakarta Sans", -apple-system, Helvetica, sans-serif';
  const w = g.measureText(label).width + 64;
  g.fillStyle = 'rgba(0,0,0,.28)';
  roundRect(64, 46, w, 68, 34); g.fill();
  g.fillStyle = '#fff'; g.textBaseline = 'middle';
  g.fillText(label, 96, 82);
  g.restore();
}

(async () => {
  await document.fonts.ready;
  const imgs = {};
  for (const s of spec.scenes) if (!imgs[s.img]) imgs[s.img] = await load('/frames/' + s.img + '.png');

  const FADE = 0.4;
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
    drawCaption(scene.caption, a, spec.accent, (1 - easeOut(Math.min(1, local / FADE))) * 40);
    drawBadge(scene.badge, a, spec.accent);
    if (spec.fadeEdges) {
      const edge = Math.min(t / 0.5, (total - t) / 0.6, 1);
      if (edge < 1) { g.fillStyle = 'rgba(0,0,0,' + (1 - edge) + ')'; g.fillRect(0, 0, W, H); }
    }
    const blob = await toBlob();
    await fetch('/frame?n=' + String(i).padStart(5, '0'), { method: 'POST', body: await blob.arrayBuffer() });
  }
  await fetch('/done', { method: 'POST' });
  document.title = 'DONE';
})();
</script>`

/** Renders one UI segment to `outFile`. Returns its duration in seconds. */
export async function renderSegment({ scenes, bg, accent, fadeEdges = false, framesDir, outFile }) {
  const seconds = scenes.reduce((a, s) => a + s.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), "seg-"))
  let written = 0
  let finished = false

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (url.pathname === "/player.html") {
      res.writeHead(200, { "content-type": "text/html" }); return res.end(PLAYER)
    }
    if (url.pathname.startsWith("/frames/")) {
      const f = path.join(framesDir, path.basename(url.pathname))
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { "content-type": "image/png" }); return res.end(fs.readFileSync(f))
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
  const spec = { scenes, bg, accent, fadeEdges }
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    `--window-size=${W},${H}`,
    `http://localhost:${port}/player.html#${encodeURIComponent(JSON.stringify(spec))}`,
  ], { stdio: "ignore" })

  const deadline = Date.now() + (expected * 0.5 + 120) * 1000
  while (!finished && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250))
  chrome.kill()
  server.close()

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`segment painted only ${written}/${expected} frames`)
  }

  const code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, [
      "-y", "-framerate", String(FPS),
      "-i", path.join(frameDir, "f-%05d.jpg"),
      "-c:v", "libx264", "-preset", "medium", "-crf", "18",
      "-pix_fmt", "yuv420p", outFile,
    ], { stdio: "ignore" })
    ff.on("close", r)
  })
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} encoding ${outFile}`)
  return seconds
}
