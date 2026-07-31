#!/usr/bin/env node
/**
 * The platform feature ad: brand-coloured, photo-led, readable with the sound off.
 *
 * Every beat is a full-bleed brand colour or real photography from the site — the whole pitch is
 * that this platform holds the actual town, so the ad is built out of the actual town. Photos come
 * from the same `photos_json` the pages render, and every number is queried at render time, so the
 * ad can't drift from what the site says.
 *
 * Photos are downloaded once and served from the local frame server: same-origin keeps the canvas
 * untainted (toBlob throws on a tainted canvas), and it avoids refetching 40 images every frame.
 *
 * Same two headless-Chrome facts the other renderers work around (see lib/video-frames.mjs):
 * MediaRecorder returns empty video in headless, and requestAnimationFrame never fires — so frames
 * are painted on a step loop, POSTed out as JPEGs, and encoded by ffmpeg.
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

const photoUrl = (p) => {
  const u = typeof p === "string" ? p : p?.url || p?.src
  return u && /^https?:\/\//.test(u) ? u : null
}

async function gather() {
  const [[b], [e], [l], [p], [a]] = await Promise.all([
    sql`select count(*)::int n from businesses where status='approved'`,
    sql`select count(*)::int n from events where status='approved' and starts_at > now()`,
    sql`select count(*)::int n from events
        where status='approved' and starts_at > now() and title ilike '%rocket launch%'`,
    sql`select sum(jsonb_array_length(coalesce(photos_json,'[]'::jsonb)))::int n
        from businesses where status='approved'`,
    sql`select count(*)::int n from activities`,
  ])

  // md5 ordering, not random: the same run twice produces the same ad.
  const biz = await sql`select name, photos_json from businesses
    where status='approved' and jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 3
    order by md5(slug) limit 40`
  const act = await sql`select title, photos_json from activities
    where jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 1 order by md5(slug) limit 14`

  // One photo per business, so the mosaic shows 30 different places rather than 3 places 10 times.
  const bizPhotos = biz.map((r) => (r.photos_json || []).map(photoUrl).find(Boolean)).filter(Boolean)
  const actPhotos = act.map((r) => (r.photos_json || []).map(photoUrl).find(Boolean)).filter(Boolean)

  return {
    n: { businesses: b.n, events: e.n, launches: l.n, photos: p.n, places: a.n },
    bizPhotos,
    actPhotos,
  }
}

/** Downloads each photo once so the player can load them same-origin. */
async function cachePhotos(urls, dir) {
  fs.mkdirSync(dir, { recursive: true })
  const kept = []
  await Promise.all(
    urls.map(async (u, i) => {
      try {
        const res = await fetch(u)
        if (!res.ok) return
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 2000) return
        fs.writeFileSync(path.join(dir, `${i}.jpg`), buf)
        kept[i] = `${i}.jpg`
      } catch {
        /* a dead photo url just means one fewer tile */
      }
    })
  )
  return kept.filter(Boolean)
}

const PLAYER = (W, H, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#650C75;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS};
const spec = ${JSON.stringify(spec)};
const cv = document.getElementById('c'), g = cv.getContext('2d');

const CREAM='#FAF5EC', INK='#241629', PURPLE='#650C75', GOLD='#EFC618', GREEN='#0B992F';
const C = {cream:CREAM, ink:INK, purple:PURPLE, gold:GOLD, green:GREEN, white:'#ffffff'};

const easeOut   = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
const clamp01   = t => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp = (a,b,t) => a + (b-a)*t;
const PAD = Math.round(W * 0.088);
const MARK_ASPECT = 314 / 402;   // the SVG has a viewBox but no width/height

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

let MARK_W, PHOTOS = [], GRAIN;

/** Film grain, painted once offscreen — the same texture the cards carry. */
function makeGrain(){
  const o=document.createElement('canvas'); o.width=260; o.height=260;
  const x=o.getContext('2d'), d=x.createImageData(260,260);
  for(let i=0;i<d.data.length;i+=4){
    const v=120+Math.random()*135;
    d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;
  }
  x.putImageData(d,0,0); return o;
}
function grain(alpha){
  g.save(); g.globalAlpha=alpha; g.globalCompositeOperation='overlay';
  for(let y=0;y<H;y+=260) for(let x=0;x<W;x+=260) g.drawImage(GRAIN,x,y);
  g.restore();
}

function roundRect(x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}

/** object-fit: cover. */
function cover(img,x,y,w,h){
  if(!img) return;
  const s=Math.max(w/img.width,h/img.height);
  const dw=img.width*s, dh=img.height*s;
  g.drawImage(img, x+(w-dw)/2, y+(h-dh)/2, dw, dh);
}

function wrapWords(words,font,maxW){
  g.font=font;
  const lines=[[]];
  for(const w of words){
    const test=[...lines[lines.length-1],w].join(' ');
    if(g.measureText(test).width>maxW && lines[lines.length-1].length) lines.push([w]);
    else lines[lines.length-1].push(w);
  }
  return lines;
}

/** Words land one after another, each rising into place — the line completes itself. */
function reveal(text,{y,size,weight,colour,ghost,maxW,x,p,stagger,align}){
  const font=weight+' '+size+'px "Plus Jakarta Sans", sans-serif';
  const lines=wrapWords(text.split(' '),font,maxW);
  g.font=font; g.textBaseline='alphabetic'; g.textAlign='left';
  const lh=size*1.05;
  let idx=0, yy=y;
  for(const line of lines){
    const lw=g.measureText(line.join(' ')).width;
    let xx = align==='center' ? x-lw/2 : x;
    for(const w of line){
      const t=clamp01((p - idx*stagger)/0.20);
      const rise=(1-easeOut(t))*size*0.20;
      g.save();
      g.globalAlpha = t<=0 ? 0 : lerp(0.25,1,t);
      g.fillStyle = t>=1 ? colour : (ghost||colour);
      g.fillText(w,xx,yy+rise);
      g.restore();
      xx += g.measureText(w+' ').width;
      idx++;
    }
    yy+=lh;
  }
  return yy-y;
}

const headLines = (text,size) =>
  wrapWords(text.split(' '),'800 '+size+'px "Plus Jakarta Sans", sans-serif',W-PAD*2).length;

function lockup(alpha){
  if(!MARK_W) return;
  g.save(); g.globalAlpha=alpha;
  const h=Math.round(W*0.072);
  g.drawImage(MARK_W,PAD,PAD*0.72,h*MARK_ASPECT,h);
  g.restore();
}

/**
 * A mosaic of real places. Tiles pop in on a diagonal wave, then a brand scrim closes over them
 * so the headline has somewhere quiet to sit — the photos still read through it.
 */
function mosaic(p,cols,rows,scrim){
  const cw=W/cols, ch=H/rows;
  let i=0;
  for(let r=0;r<rows;r++) for(let cI=0;cI<cols;cI++){
    const img=PHOTOS[i%Math.max(1,PHOTOS.length)];
    const t=clamp01((p-(r+cI)*0.035)/0.28);
    if(t>0){
      const s=lerp(0.86,1,easeOut(t));
      g.save(); g.globalAlpha=easeOut(t);
      const w=cw*s, h=ch*s;
      g.translate(cI*cw+(cw-w)/2, r*ch+(ch-h)/2);
      g.beginPath(); g.rect(0,0,w,h); g.clip();
      cover(img,0,0,w,h);
      g.restore();
    }
    i++;
  }
  if(scrim>0){
    g.save(); g.globalAlpha=scrim; g.fillStyle=PURPLE; g.fillRect(0,0,W,H); g.restore();
  }
}

function paintBeat(b,p){
  g.fillStyle=C[b.bg]||PURPLE; g.fillRect(0,0,W,H);

  if(b.kind==='mosaic') mosaic(p,b.cols,b.rows,clamp01((p-0.30)/0.22)*0.80);

  if(b.kind==='photo'){
    const img=PHOTOS[b.photo%Math.max(1,PHOTOS.length)];
    // Slow push-in keeps a still photograph from feeling like a slide.
    const s=lerp(1.0,1.10,easeInOut(p));
    g.save();
    g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
    cover(img,0,0,W,H);
    g.restore();
    const grd=g.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,'rgba(36,22,41,0.32)');
    grd.addColorStop(0.42,'rgba(36,22,41,0.26)');
    grd.addColorStop(1, b.bg==='green' ? 'rgba(11,153,47,0.95)' : 'rgba(101,12,117,0.95)');
    g.fillStyle=grd; g.fillRect(0,0,W,H);
  }

  if(b.kind==='cards'){
    // Three tilted photo cards, as if pulled off the site and laid down. They sit high on
    // purpose: the headline anchors low, and white type over a white card reads as nothing.
    const base=H*0.30;
    for(let i=0;i<3;i++){
      const t=clamp01((p-0.10-i*0.09)/0.34);
      if(t<=0) continue;
      const img=PHOTOS[(b.photo+i*5)%Math.max(1,PHOTOS.length)];
      const cwid=W*0.36, chg=cwid*1.25;
      const ang=(-10+i*10)*Math.PI/180;
      const cx=W*(0.28+i*0.22), cy=base+(1-easeOut(t))*H*0.10;
      g.save(); g.globalAlpha=easeOut(t);
      g.translate(cx,cy); g.rotate(ang*easeOut(t));
      g.shadowColor='rgba(0,0,0,0.30)'; g.shadowBlur=44; g.shadowOffsetY=16;
      g.fillStyle='#fff'; roundRect(-cwid/2,-chg/2,cwid,chg,26); g.fill();
      g.shadowColor='transparent';
      g.save(); roundRect(-cwid/2+10,-chg/2+10,cwid-20,chg-20,18); g.clip();
      cover(img,-cwid/2+10,-chg/2+10,cwid-20,chg-20);
      g.restore(); g.restore();
    }
  }

  const onDark = b.bg!=='cream' && b.bg!=='gold';
  const headColour = b.headColour ? C[b.headColour] : (onDark ? '#ffffff' : INK);
  const ghost = onDark ? 'rgba(255,255,255,0.30)' : 'rgba(36,22,41,0.22)';

  lockup(clamp01(p/0.18)*(onDark?0.95:0.85));

  if(b.kind==='end'){
    const a=clamp01(p/0.20);
    g.save(); g.globalAlpha=a;
    const h=Math.round(W*0.22);
    g.drawImage(MARK_W,(W-h*MARK_ASPECT)/2,H*0.28,h*MARK_ASPECT,h);
    g.restore();
    reveal(b.head,{y:H*0.56,size:Math.round(W*0.078),weight:'800',colour:GOLD,
      ghost:'rgba(239,198,24,0.28)',maxW:W-PAD*2,x:W/2,p,stagger:0.09,align:'center'});
    g.textAlign='center';
    g.globalAlpha=clamp01((p-0.45)/0.3);
    g.fillStyle='rgba(255,255,255,0.9)';
    g.font='600 '+Math.round(W*0.034)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText('Made by locals, for locals',W/2,H*0.635);
    g.globalAlpha=1; g.textAlign='left';
    grain(0.05);
    return;
  }

  const headSize=b.big?Math.round(W*0.108):Math.round(W*0.086);
  const nLines=headLines(b.head,headSize);
  let blockH=nLines*headSize*1.05;
  if(b.sub)  blockH+=Math.round(W*0.05)+Math.round(W*0.05);
  if(b.stat) blockH+=Math.round(W*0.19)*0.80+Math.round(W*0.056);

  // Photo beats anchor low so the picture stays visible; colour beats sit optically centred.
  const anchorLow = b.kind==='photo'||b.kind==='mosaic'||b.kind==='cards';
  const top = anchorLow
    ? H - PAD*1.5 - blockH + headSize*0.72
    : Math.max(H*0.22,(H-blockH)/2) + headSize*0.66;

  const used=reveal(b.head,{y:top,size:headSize,weight:'800',colour:headColour,ghost,
    maxW:W-PAD*2,x:PAD,p,stagger:0.075});

  if(b.stat){
    const a=clamp01((p-0.26)/0.28);
    const sc=lerp(0.88,1,easeOut(a));
    const sy=top+used+Math.round(W*0.115);
    g.save(); g.globalAlpha=a;
    g.translate(PAD,sy); g.scale(sc,sc);
    g.fillStyle=C[b.statColour]||GOLD;
    g.font='800 '+Math.round(W*0.19)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText(b.stat,0,0);
    g.restore();
    const la=clamp01((p-0.46)/0.26);
    g.save(); g.globalAlpha=la;
    g.fillStyle = onDark ? 'rgba(255,255,255,0.85)' : 'rgba(36,22,41,0.62)';
    g.font='600 '+Math.round(W*0.037)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText(b.label,PAD,sy+Math.round(W*0.062));
    g.restore();
  }

  if(b.sub){
    const a=clamp01((p-0.34)/0.26);
    g.save(); g.globalAlpha=a;
    g.fillStyle=C[b.subColour]||(onDark?GOLD:PURPLE);
    g.font='700 '+Math.round(W*0.052)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText(b.sub,PAD,top+used+Math.round(W*0.058)+(1-easeOut(a))*24);
    g.restore();
  }

  grain(0.055);
}

const toBlob = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.94));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  PHOTOS = (await Promise.all(spec.photos.map(f => load('/p/'+f)))).filter(Boolean);
  GRAIN = makeGrain();
  await document.fonts.load('800 140px "Plus Jakarta Sans"');
  await document.fonts.load('600 40px "Plus Jakarta Sans"');
  await document.fonts.ready;

  const total=spec.beats.reduce((a,b)=>a+b.dur,0);
  const frames=Math.round(total*FPS);
  const WIPE=0.30;

  for(let i=0;i<frames;i++){
    const t=i/FPS;
    let acc=0, idx=0;
    for(let k=0;k<spec.beats.length;k++){
      if(t < acc+spec.beats[k].dur){ idx=k; break; }
      acc+=spec.beats[k].dur; idx=k;
    }
    const beat=spec.beats[idx], local=t-acc;
    paintBeat(beat,local/beat.dur);

    // Colour wipe across the seam: the next beat's field sweeps up over the current one, so a cut
    // lands as a deliberate change of colour rather than a dissolve.
    const next=spec.beats[idx+1];
    const toEnd=beat.dur-local;
    if(next && toEnd<WIPE){
      const w=easeInOut(1-toEnd/WIPE);
      g.fillStyle=C[next.bg]||PURPLE;
      g.fillRect(0,H-H*w,W,H*w+2);
    }

    const blob=await toBlob();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

const beats = (n, actStart) => [
  { kind: "open", bg: "purple", head: "All of Lompoc.", sub: "One place.", subColour: "gold", big: true, dur: 2.3 },
  { kind: "mosaic", bg: "purple", cols: 4, rows: 5, head: "Every business in town.",
    stat: n.businesses.toLocaleString(), statColour: "gold", label: "local businesses, all of them real", dur: 3.0 },
  { kind: "photo", bg: "purple", photo: actStart + 1, head: "Every event. Every launch.",
    stat: n.events.toLocaleString(), statColour: "gold", label: `upcoming — ${n.launches} over the base`, dur: 2.9 },
  { kind: "cards", bg: "green", photo: 2, head: "Real photos. Real places.",
    stat: n.photos.toLocaleString(), statColour: "gold", label: "photos on the site, no stock imagery", dur: 3.0 },
  { kind: "photo", bg: "green", photo: actStart + 4, head: "Curated places worth the drive.",
    stat: n.places.toLocaleString(), statColour: "gold", label: "hand-checked things to do", dur: 2.8 },
  { kind: "color", bg: "gold", head: "One listing each.", sub: "Duplicates merged, not stacked.",
    headColour: "ink", subColour: "purple", dur: 2.4 },
  { kind: "color", bg: "cream", head: "En inglés y en español.", sub: "Every page, both languages.",
    headColour: "ink", subColour: "green", dur: 2.3 },
  { kind: "end", bg: "purple", head: "lompoclocals.com", dur: 2.7 },
]

async function renderShape(key, spec, photoDir) {
  const { w: W, h: H, name } = SHAPES[key]
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
    if (url.pathname.startsWith("/p/")) {
      const f = path.join(photoDir, path.basename(url.pathname))
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { "content-type": "image/jpeg" })
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
}

const { n, bizPhotos, actPhotos } = await gather()
console.log("live numbers:", n)
const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "ad-photos-"))
const files = await cachePhotos([...bizPhotos, ...actPhotos], photoDir)
console.log(`photos: ${files.length} of ${bizPhotos.length + actPhotos.length} cached\n`)

// Activity photos are appended after the business photos, so the place-led beats can index into
// the landscape half rather than landing on somebody's lunch.
const actStart = Math.max(0, files.length - actPhotos.length)
const spec = { beats: beats(n, actStart), photos: files }
for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  await renderShape(key, spec, photoDir)
}
fs.rmSync(photoDir, { recursive: true, force: true })
