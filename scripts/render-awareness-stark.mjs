#!/usr/bin/env node
/**
 * "Know your town" — Treatment A, STARK.
 *
 * An awareness film, not a feature list. The argument is that people live here and know a
 * fraction of the place, and that the knowledge is scattered across Facebook groups, paper
 * flyers and stale listing sites. The numbers are the evidence for that argument, so they are
 * the only thing on screen: full-bleed brand colour, one idea per beat, enormous type, and a
 * count-up as the single hero effect. No photography at all — a photo would give the eye
 * somewhere easier to go than the sentence.
 *
 * Every figure is queried from the live database at render time. Nothing here is invented, and
 * re-running the script after the town grows re-renders the film with the new numbers.
 *
 * Two headless-Chrome facts this works around (same as lib/video-frames.mjs): MediaRecorder
 * returns empty video in headless, and requestAnimationFrame never fires. Frames are painted on
 * a step loop, POSTed out as JPEGs, and encoded by ffmpeg.
 *
 * Usage:
 *   node scripts/render-awareness-stark.mjs             # both shapes, with the music bed
 *   node scripts/render-awareness-stark.mjs --only=tt   # 9:16 only
 *   node scripts/render-awareness-stark.mjs --silent    # skip the audio pass
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

const SHAPES = {
  tt: { w: 1080, h: 1920, name: "awareness-stark-9x16.mp4" },
  ig: { w: 1080, h: 1350, name: "awareness-stark-4x5.mp4" },
}
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean)
const SILENT = process.argv.includes("--silent")

const dbUrl = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(dbUrl)

async function gather() {
  const [[b], [e], [l], [p]] = await Promise.all([
    sql`select count(*)::int n from businesses where status='approved'`,
    sql`select count(*)::int n from events where status='approved' and starts_at > now()`,
    sql`select count(*)::int n from events
        where status='approved' and starts_at > now() and title ilike '%rocket launch%'`,
    sql`select sum(jsonb_array_length(coalesce(photos_json,'[]'::jsonb)))::int n
        from businesses where status='approved'`,
  ])
  return { businesses: b.n, events: e.n, launches: l.n, photos: p.n }
}

const PLAYER = (W, H, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#FAF5EC;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS};
const spec = ${JSON.stringify(spec)};
const cv = document.getElementById('c'), g = cv.getContext('2d');

const C = {cream:'#FAF5EC', ink:'#241629', purple:'#650C75', gold:'#EFC618', green:'#0B992F', white:'#ffffff'};

const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const easeOut  = t => 1 - Math.pow(1 - t, 3);
const easeOut4 = t => 1 - Math.pow(1 - t, 4);
const PAD = Math.round(W * 0.10);
const MAXW = W - PAD*2;
const LH = 1.10;
// Flat colour fields band badly under H.264 on a phone screen. A trace of grain is what stops
// a 1080-wide sweep of purple from stepping. It is texture, not an effect.
const GRAIN_ALPHA = 0.022;
const MARK_ASPECT = 314 / 402;   // the SVG carries a viewBox but no width/height
const SERIF = 'italic 400 SIZEpx Georgia, "Times New Roman", serif';

let MARK, GRAIN;

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

function makeGrain(){
  const o=document.createElement('canvas'); o.width=256; o.height=256;
  const x=o.getContext('2d'), d=x.createImageData(256,256);
  for(let i=0;i<d.data.length;i+=4){
    const v=120+Math.random()*135;
    d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;
  }
  x.putImageData(d,0,0); return o;
}
function grain(){
  g.save(); g.globalAlpha=GRAIN_ALPHA; g.globalCompositeOperation='overlay';
  for(let y=0;y<H;y+=256) for(let x=0;x<W;x+=256) g.drawImage(GRAIN,x,y);
  g.restore();
}

function wrap(text,font,maxW){
  g.font=font;
  const words=text.split(' '), lines=[]; let line='';
  for(const w of words){
    const t = line ? line+' '+w : w;
    if(g.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t;
  }
  if(line) lines.push(line);
  return lines;
}

/**
 * A centred block of type that fades and lifts into place, one line after another.
 * Returns the baseline it finished on so the next element can sit under it.
 */
function block(text,{font,size,colour,y,alpha,stagger=0.0,at=0,maxW=MAXW}){
  const lines=wrap(text,font,maxW);
  g.font=font; g.textAlign='center'; g.textBaseline='alphabetic';
  let yy=y;
  lines.forEach((line,i)=>{
    const a = alpha * clamp01((at - i*stagger)/0.40);
    if(a>0.004){
      g.save();
      g.globalAlpha=a; g.fillStyle=colour;
      g.fillText(line, W/2, yy + (1-easeOut(clamp01((at-i*stagger)/0.40)))*size*0.12);
      g.restore();
    }
    yy += size*LH;
  });
  return yy - size*LH;
}

/**
 * The count-up, drawn on a fixed digit grid.
 *
 * Two things make a climbing figure readable rather than a smear. First, the value is sampled
 * on discrete steps instead of every frame: at 30fps a per-frame count changes faster than the
 * eye resolves and reads as noise. Second, digits are placed in fixed-width cells and the value
 * is right-aligned inside a box the width of the FINAL number, so the units column never moves
 * and each place-value locks from the left as the ease-out decelerates. That locking is the
 * whole pleasure of a counter; proportional digits destroy it by sliding the number sideways on
 * every tick.
 */
function drawCount(value,target,cx,baseY,size,colour,alpha){
  g.font='800 '+size+'px "Plus Jakarta Sans", sans-serif';
  g.textBaseline='alphabetic'; g.textAlign='center';
  let cell=0;
  for(let d=0;d<10;d++) cell=Math.max(cell,g.measureText(String(d)).width);
  const commaCell = cell*0.44;
  const fmt = n => n.toLocaleString('en-US');
  const box = [...fmt(target)].reduce((a,ch)=>a+(ch===','?commaCell:cell),0);
  const str = fmt(value);
  const strW = [...str].reduce((a,ch)=>a+(ch===','?commaCell:cell),0);
  let x = cx + box/2 - strW;            // right-aligned inside the final number's footprint
  g.save(); g.globalAlpha=alpha; g.fillStyle=colour;
  for(const ch of str){
    const w = ch===',' ? commaCell : cell;
    g.fillText(ch, x + w/2, baseY);
    x += w;
  }
  g.restore();
}

function paintBeat(b,local){
  const dur=b.dur;
  g.fillStyle=C[b.bg]; g.fillRect(0,0,W,H);
  // Everything on the beat clears before the field cuts, so we cut from an empty colour to an
  // empty colour. No wipes, no dissolves — at this size the colour change IS the transition,
  // and a swipe on top of it would be the second gesture the treatment is meant to refuse.
  const out = clamp01((dur - local)/0.34);
  if(out<=0.004){ grain(); return; }

  if(b.kind==='count'){
    const CS=0.14;                                   // the field holds empty for a beat first
    const u = clamp01((local-CS)/b.countLen);
    // ~13 value changes a second: fast enough to feel like climbing, slow enough to read.
    const steps = Math.max(10, Math.round(b.countLen*13));
    const qu = u>=1 ? 1 : Math.floor(u*steps)/steps;
    const value = Math.round(b.target*easeOut4(qu));

    // The settle: once the figure has landed it drops the last few pixels and eases off a
    // fractional overscale. It is the only motion left on screen at that moment.
    const s = clamp01((local - CS - b.countLen)/0.36);
    const sc = 1 + 0.030*(1-easeOut(s));
    const dy = -(1-easeOut(s))*size(b)*0.030;

    // The numeral, its label and its kicker are one block, centred as a block. Pinning the
    // numeral itself to a fraction of the height looked right on 9:16 and dropped the whole
    // group below centre on 4:5, where there is 570px less frame to give away.
    const numSize = size(b);
    const lSize = Math.round(W*0.042);
    const kSize = Math.round(W*0.045);
    const capH = numSize*0.72;
    const gapLabel = Math.round(numSize*0.34);
    const blockH = capH + gapLabel + (b.kicker?Math.round(W*0.085):0) + Math.round(lSize*0.32);
    const baseY = H*0.485 - blockH/2 + capH;
    const appear = clamp01(local/0.28);
    g.save();
    g.translate(W/2, baseY+dy); g.scale(sc,sc); g.translate(-W/2,-(baseY+dy));
    drawCount(value,b.target,W/2,baseY+dy,numSize,C[b.numColour],out*appear);
    g.restore();

    const labelAt = local - (CS + b.countLen + 0.10);
    const lFont = (b.labelWeight||600)+' '+lSize+'px "Plus Jakarta Sans", sans-serif';
    const lastY = block(b.label,{font:lFont,size:lSize,colour:C[b.labelColour],
      y:baseY+gapLabel,alpha:out,at:labelAt,stagger:0.10,maxW:MAXW});

    if(b.kicker){
      block(b.kicker,{font:SERIF.replace('SIZE',kSize),size:kSize,colour:C[b.kickerColour],
        y:lastY+Math.round(W*0.085),alpha:out,at:labelAt-0.48,stagger:0.10,maxW:MAXW});
    }
    grain(); return;
  }

  if(b.kind==='end'){
    const a = out*clamp01(local/0.42);
    const h = Math.round(W*0.20);
    const nSize=Math.round(W*0.082), uSize=Math.round(W*0.048), sSize=Math.round(W*0.036);
    const g1=Math.round(W*0.115), g2=Math.round(W*0.105), g3=Math.round(W*0.095);
    const top = H*0.47 - (h+g1+g2+g3+Math.round(sSize*0.3))/2;
    g.save(); g.globalAlpha=a;
    // Height first, width derived from the mark's own aspect — never two independent numbers.
    g.drawImage(MARK,(W-h*MARK_ASPECT)/2,top,h*MARK_ASPECT,h);
    g.restore();

    block('Lompoc Locals',{font:'800 '+nSize+'px "Plus Jakarta Sans", sans-serif',size:nSize,
      colour:C.cream,y:top+h+g1,alpha:out,at:local-0.30});
    block('lompoclocals.com',{font:'700 '+uSize+'px "Plus Jakarta Sans", sans-serif',size:uSize,
      colour:C.gold,y:top+h+g1+g2,alpha:out,at:local-0.62});
    block('Every business, event and launch. One place.',
      {font:'500 '+sSize+'px "Plus Jakarta Sans", sans-serif',size:sSize,
       colour:C.cream,y:top+h+g1+g2+g3,alpha:out*0.72,at:local-0.95});
    grain(); return;
  }

  // kind === 'text'
  // Headlines shrink until they fit the line count they were written for. "Lompoc isn't small."
  // broke as "Lompoc isn't / small." at the nominal size, which strands the payoff word on its
  // own line and reads as an accident rather than a break.
  let hSize = Math.round(W*(b.small?0.086:0.096));
  let hFont = '800 '+hSize+'px "Plus Jakarta Sans", sans-serif';
  if(b.maxLines){
    const fits = () => wrap(b.head,hFont,MAXW).length <= b.maxLines &&
      (!b.head2 || wrap(b.head2,hFont,MAXW).length <= b.maxLines);
    while(hSize > Math.round(W*0.058) && !fits()){
      hSize -= 3; hFont='800 '+hSize+'px "Plus Jakarta Sans", sans-serif';
    }
  }
  const nLines = wrap(b.head,hFont,MAXW).length;
  const secondLines = b.head2 ? wrap(b.head2,hFont,MAXW).length : 0;
  const total = (nLines+secondLines)*hSize*LH + (b.kicker?Math.round(W*0.115):0);
  const top = (H-total)/2 + hSize*0.72;

  let y = block(b.head,{font:hFont,size:hSize,colour:C[b.headColour],y:top,
    alpha:out,at:local-0.18,stagger:0.20});
  if(b.head2){
    y = block(b.head2,{font:hFont,size:hSize,colour:C[b.head2Colour],y:y+hSize*LH,
      alpha:out,at:local-0.18-nLines*0.20-0.14,stagger:0.20});
  }
  if(b.kicker){
    const kSize=Math.round(W*(b.kickerSerif===false?0.040:0.048));
    const kFont = b.kickerSerif===false
      ? '500 '+kSize+'px "Plus Jakarta Sans", sans-serif'
      : SERIF.replace('SIZE',kSize);
    block(b.kicker,{font:kFont,size:kSize,colour:C[b.kickerColour],
      y:y+Math.round(W*0.115),alpha:out,at:local-0.18-(nLines+secondLines)*0.20-0.42,stagger:0.10});
  }
  grain();
}

const size = b => Math.round(W*(b.numSize||0.40));
const toBlob = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.95));

(async () => {
  MARK = await load('/brand/lompoc-locals-mark-white.svg');
  GRAIN = makeGrain();
  for(const f of ['800 400px','700 60px','600 46px','500 40px']) await document.fonts.load(f+' "Plus Jakarta Sans"');
  await document.fonts.ready;

  const total=spec.beats.reduce((a,b)=>a+b.dur,0);
  const frames=Math.round(total*FPS);
  for(let i=0;i<frames;i++){
    const t=i/FPS;
    let acc=0, idx=0;
    for(let k=0;k<spec.beats.length;k++){
      if(t < acc+spec.beats[k].dur){ idx=k; break; }
      acc+=spec.beats[k].dur; idx=k;
    }
    paintBeat(spec.beats[idx], t-acc);
    const blob=await toBlob();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/**
 * Seven beats. Three of them are a single number.
 *
 * The running order is an argument, not a list: you know a fraction of this town (open), here is
 * how much is actually here (three counts), it belongs to all of the town (bilingual), so the
 * town was never the problem (thesis), and here is where it lives (end).
 *
 * The photo count is queried and printed but deliberately kept off screen. It is the one figure
 * that argues about the site rather than about the town, and a fourth count would have made the
 * middle of the film a spec sheet — which is the exact failure mode this treatment exists to
 * avoid.
 */
const beats = (n) => [
  {
    kind: "text", bg: "cream", head: "You live here.", headColour: "ink", maxLines: 1,
    kicker: "You know a fraction of it.", kickerColour: "purple", dur: 3.0,
  },
  {
    kind: "count", bg: "purple", target: n.businesses, numColour: "gold", countLen: 1.9,
    label: "businesses in Lompoc", labelColour: "cream",
    kicker: "You've walked past most of them.", kickerColour: "gold", dur: 4.2,
  },
  {
    kind: "count", bg: "gold", target: n.events, numColour: "ink", countLen: 1.6,
    label: "events on the calendar right now", labelColour: "purple", labelWeight: 700, dur: 3.4,
  },
  {
    kind: "count", bg: "green", target: n.launches, numColour: "cream", countLen: 1.5,
    label: "rocket launches coming up", labelColour: "white", labelWeight: 700,
    kicker: "Visible from your own driveway.", kickerColour: "white", dur: 3.8,
  },
  {
    kind: "text", bg: "ink", head: "Todo el pueblo.", headColour: "cream",
    head2: "The whole town.", head2Colour: "gold",
    kicker: "Every page, in both languages.", kickerColour: "cream", kickerSerif: false,
    small: true, maxLines: 1, dur: 2.9,
  },
  {
    kind: "text", bg: "cream", head: "Lompoc isn't small.", headColour: "ink", maxLines: 1,
    kicker: "It was just scattered.", kickerColour: "purple", dur: 3.1,
  },
  { kind: "end", bg: "purple", dur: 3.2 },
]

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

async function renderShape(key, spec, outFile) {
  const { w: W, h: H } = SHAPES[key]
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `stark-${key}-`))
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

  const deadline = Date.now() + (expected * 0.6 + 240) * 1000
  while (!finished && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250))
  chrome.kill()
  server.close()

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`${key}: painted only ${written}/${expected} frames`)
  }

  const { code, err } = await run([
    "-y", "-framerate", String(FPS),
    "-i", path.join(frameDir, "f-%05d.jpg"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile,
  ])
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${outFile}\n${err.split("\n").slice(-8).join("\n")}`)
  return seconds
}

/**
 * Lays the synthesised bed under the picture and lands the master at −14 LUFS, which is what the
 * social players normalise to — anything hotter is just turned down again on playback.
 */
async function mux(silentFile, bed, outFile, seconds) {
  const { code, err } = await run([
    "-y", "-i", silentFile, "-i", bed,
    "-filter_complex",
    `[1:a]aformat=channel_layouts=stereo:sample_rates=48000,atrim=0:${seconds.toFixed(2)},` +
      `afade=t=in:st=0:d=1.2,afade=t=out:st=${(seconds - 2.2).toFixed(2)}:d=2.2,` +
      `loudnorm=I=-14:TP=-1:LRA=7,alimiter=limit=0.97[a]`,
    "-map", "0:v", "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", "-t", seconds.toFixed(2), outFile,
  ])
  if (code !== 0) throw new Error(`mux failed (${code})\n${err.split("\n").slice(-10).join("\n")}`)
}

const n = await gather()
console.log("live numbers:", n)
console.log(`(photos ${n.photos.toLocaleString()} queried — kept off screen on purpose, see beats())\n`)

const spec = { beats: beats(n) }
const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
fs.mkdirSync(OUT_DIR, { recursive: true })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stark-"))

let bed = null
if (!SILENT) {
  bed = path.join(tmp, "bed.wav")
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, ["scripts/make-music-bed.mjs", bed, seconds.toFixed(2)],
      { stdio: "inherit" })
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`music bed failed (${c})`))))
  })
}

for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  const { w, h, name } = SHAPES[key]
  const outFile = path.join(OUT_DIR, name)
  const silentFile = bed ? path.join(tmp, `silent-${key}.mp4`) : outFile
  await renderShape(key, spec, silentFile)
  if (bed) await mux(silentFile, bed, outFile, seconds)
  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${name.padEnd(28)} ${w}x${h}  ${seconds.toFixed(1)}s  ${mb} MB${bed ? "  +bed" : "  silent"}`)
}

fs.rmSync(tmp, { recursive: true, force: true })
