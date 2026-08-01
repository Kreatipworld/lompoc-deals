#!/usr/bin/env node
/**
 * A business highlight: one member business, one story, in motion and as a still.
 *
 * This is the first of many, so the script takes a slug rather than a business. Everything a
 * highlight says is read out of the row at render time — name, address, hours, the about text we
 * wrote — so a highlight can't drift from what the business's own page says.
 *
 * Architecture is lifted from scripts/render-feature-ad.mjs: photos are downloaded once and
 * served same-origin (a tainted canvas can't toBlob), the crop centres on measured edge energy
 * rather than the geometric middle, and a photograph that can't survive a crop is shown whole
 * over a blurred blow-up of itself instead of being sliced. Frames are painted on a step loop and
 * POSTed out as JPEGs because headless Chrome gives back empty MediaRecorder video and never
 * fires requestAnimationFrame (see lib/video-frames.mjs).
 *
 * What's new here, and the reason for a separate script:
 *
 *   • Derived crops. A member's photo set is usually one room shot five ways — five beats cut
 *     from five whole frames read as the same picture five times. So a highlight can name
 *     sub-rectangles of its own photos, cut out with ffmpeg before the render, and use those as
 *     beats. A shelf of trophies and a shop floor come out of the same 1600x900 file and look
 *     nothing alike. Every rect in HIGHLIGHTS was extracted and looked at before it shipped.
 *
 *   • A hand-verified hook. The generic path builds beats out of the row, which is safe but
 *     never surprising. A highlight may supply a hook that a human checked against the
 *     photographs — Vargas's floor mat reads "Since 1974", so that is the piece. Nothing in a
 *     hook may state a fact the row or the business's own signage doesn't carry: no invented
 *     founding story, no anniversary arithmetic, no rating (we hold no ratings).
 *
 *   • The still card comes off the same canvas as the video, so the post and the reel can't
 *     drift apart in type, colour or grain.
 *
 * Usage:
 *   node scripts/render-business-highlight.mjs vargas-jewelers-trophies-awards
 *   node scripts/render-business-highlight.mjs <slug> --only=tt --no-card
 */
import http from "node:http"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import ffmpegPath from "ffmpeg-static"
import { neon } from "@neondatabase/serverless"
import { buildBed } from "./lib/music-bed.mjs"
import { assertNoPriceFraming, detailSentence, neighbourhoodLabel, streetLine } from "./lib/voice.mjs"

const FPS = 30
const VIDEO_DIR = "content/social/video"
const CARD_DIR = "content/social/posts"
const REPO = process.cwd()
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const SHAPES = {
  ig: { w: 1080, h: 1350, suffix: "4x5" },
  tt: { w: 1080, h: 1920, suffix: "9x16" },
}

const SLUG = process.argv[2]
if (!SLUG || SLUG.startsWith("--")) {
  console.error("usage: node scripts/render-business-highlight.mjs <business-slug> [--only=ig,tt] [--no-card] [--no-video]")
  process.exit(1)
}
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean)
const NO_CARD = process.argv.includes("--no-card")
const NO_VIDEO = process.argv.includes("--no-video")

const dbUrl = fs
  .readFileSync(".env.local", "utf8")
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .replace(/^["']|["']$/g, "")
const sql = neon(dbUrl)

/* ------------------------------------------------------------------ *
 * Hand-verified highlights
 * ------------------------------------------------------------------ */

/**
 * Per-slug direction, written after looking at every photograph in the set.
 *
 * `crops` are source rectangles in the photo's own pixels, [x, y, w, h], cut with ffmpeg before
 * the render. `beats` name them. Everything a beat says has to be traceable to the row or to the
 * business's own signage in the photograph the beat is showing.
 *
 * Vargas: seven photos, six of them the same bright shop floor from slightly different corners.
 * Cutting between whole frames would read as one picture repeated, so four rectangles do the
 * work instead — the hanging street sign, the floor mat, the trophy shelf, the chain rail. The
 * mat is the piece: it is their own mat, it says "Vargas Jewelers · Lompoc, CA. · Since 1974",
 * and a jeweller that has been on H Street that long is a better story than a product list. We
 * print the line the way their mat prints it and stop there — no founder, no family, no count of
 * years, because the record holds none of that.
 */
const HIGHLIGHTS = {
  "vargas-jewelers-trophies-awards": {
    crops: {
      sign: { from: 6, rect: [520, 60, 720, 760] }, // the hanging street sign, awning above
      mat: { from: 0, rect: [300, 600, 640, 300] }, // the floor mat — carries "Since 1974"
      trophies: { from: 1, rect: [820, 0, 560, 700] }, // trophy shelf and the watch-band case
      chains: { from: 5, rect: [640, 20, 520, 660] }, // the chain rail over the front counter
    },
    beats: [
      {
        kind: "photo",
        photo: "sign",
        focus: [0.5, 0.42],
        head: "There's a jeweler on North H Street.",
        sub: "Look down when you walk in.",
        dur: 3.0,
      },
      // The mat is 2.1:1 and can't survive either crop, so it lands as a plate in both shapes —
      // whole, full width, over a blurred blow-up of itself. That is also the right treatment
      // for it: the mat is a rectangle and it reads as one.
      { kind: "photo", photo: "mat", head: "Since 1974.", big: true, headColour: "gold", dur: 3.8 },
      {
        kind: "photo",
        photo: "trophies",
        focus: [0.45, 0.42],
        head: "Repairs and engraving, done in the shop.",
        sub: "Trophies, awards, plaques.",
        dur: 3.2,
      },
      {
        kind: "photo",
        photo: "chains",
        focus: [0.45, 0.36],
        head: "Gold and silver. Estate pieces. Citizen watches.",
        dur: 3.2,
      },
      // A gold field, not green. Gold type on green is the one pairing in the palette that
      // doesn't hold — both sit around the same luminance and the sub line went muddy — and a
      // bright beat here also stops the last third of the piece being purple all the way out.
      { kind: "color", bg: "gold", head: "Open Monday to Saturday.", sub: "Closed Sunday.", subColour: "purple", dur: 2.6 },
      { kind: "end", bg: "purple", dur: 3.4 },
    ],
    card: {
      photo: "mat",
      eyebrow: "On North H Street, since 1974 —",
      title: "Vargas Jewelers Trophies & Awards",
      meta: "Fine gold and silver, estate pieces, Citizen watches. Repairs and engraving done in the shop.",
    },
  },
}

/* ------------------------------------------------------------------ *
 * The row
 * ------------------------------------------------------------------ */

const photoUrl = (p) => {
  const u = typeof p === "string" ? p : p?.url || p?.src
  return u && /^https?:\/\//.test(u) ? u : null
}

const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
]

/**
 * The open days as two plain sentences, or null when the row has no usable hours.
 *
 * Only a single unbroken run is described as a range; anything else is listed. A shop open
 * Mon–Wed and Fri would otherwise be advertised as open Monday to Friday, which is a closed door
 * on a Thursday for somebody who drove across town.
 */
function hoursLines(hours) {
  if (!hours || typeof hours !== "object") return null
  const open = DAYS.filter(([k]) => hours[k]?.open && hours[k]?.close)
  const shut = DAYS.filter(([k]) => !(hours[k]?.open && hours[k]?.close))
  if (!open.length || open.length === 7) return open.length === 7 ? { head: "Open every day.", sub: null } : null
  const idx = open.map(([k]) => DAYS.findIndex((d) => d[0] === k))
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  const head = contiguous
    ? `Open ${open[0][1]} to ${open[open.length - 1][1]}.`
    : `Open ${open.map(([, n]) => n.slice(0, 3)).join(", ")}.`
  const sub =
    shut.length === 1 ? `Closed ${shut[0][1]}.`
    : shut.length ? `Closed ${shut.map(([, n]) => n.slice(0, 3)).join(", ")}.`
    : null
  return { head, sub }
}

async function loadBusiness(slug) {
  const [row] = await sql`
    select b.id, b.name, b.slug, b.address, b.about, b.hours_json, b.photos_json, b.status,
           c.name as category
    from businesses b left join categories c on c.id = b.category_id
    where b.slug = ${slug}`
  if (!row) throw new Error(`no business with slug "${slug}"`)
  if (row.status !== "approved") throw new Error(`${slug} is ${row.status}, not approved`)
  const photos = (row.photos_json || []).map(photoUrl).filter(Boolean)
  if (!photos.length) throw new Error(`${slug} has no usable photos`)
  return { ...row, photos }
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
        fs.writeFileSync(path.join(dir, `p${i}.jpg`), buf)
        kept[i] = `p${i}.jpg`
      } catch {
        /* a dead photo url is one fewer beat, not a failed render */
      }
    })
  )
  return kept
}

/** Cuts the named rectangles out of the downloaded photos. Returns name → filename. */
async function cutCrops(crops, files, dir) {
  const out = {}
  for (const [name, { from, rect }] of Object.entries(crops || {})) {
    const src = files[from]
    if (!src) {
      console.warn(`  ! crop "${name}" wants photo ${from}, which didn't download — skipped`)
      continue
    }
    const dest = `c-${name}.jpg`
    const [x, y, w, h] = rect
    const code = await new Promise((r) => {
      const ff = spawn(ffmpegPath, [
        "-y", "-i", path.join(dir, src),
        "-vf", `crop=${w}:${h}:${x}:${y}`,
        "-q:v", "2", path.join(dir, dest),
      ], { stdio: "ignore" })
      ff.on("close", r)
    })
    if (code !== 0) throw new Error(`crop "${name}" failed (ffmpeg ${code})`)
    out[name] = dest
  }
  return out
}

/* ------------------------------------------------------------------ *
 * The player
 * ------------------------------------------------------------------ */

const PLAYER = (W, H, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet">
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
const LINE_HEIGHT = 1.08;
const GRAIN_ALPHA = 0.03;
const MARK_ASPECT = 314 / 402;

// TikTok and Reels paint their caption, handle and button rail over the bottom of a 9:16 frame.
// Nothing that has to be read lives down there. The 4:5 cut has no such overlay, so it only
// needs an optical margin.
const SAFE_BOTTOM = H > W * 1.5 ? Math.round(H * 0.175) : Math.round(H * 0.072);

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

let MARK_W, PHOTOS = [], FOCUS = [], GRAIN;

// How much of a photograph a full-bleed crop keeps: the short side of the frame against the long
// side of the picture. Below PLATE_MIN the crop is throwing away more than half the photo and no
// focal point can save it — a 2:1 floor mat cannot survive a 9:16 crop from any centre — so the
// picture stops being cropped and is shown whole instead.
const FRAME_R = W/H;
const PLATE_MIN = 0.45;
const survives = img => { const r=img.width/img.height; return Math.min(r,FRAME_R)/Math.max(r,FRAME_R); };

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

/** object-fit: cover, centred on (fx,fy) of the source. The focal point can slide the crop
 *  anywhere inside the picture but never past an edge. */
function coverAt(img,x,y,w,h,fx,fy){
  if(!img) return;
  const s=Math.max(w/img.width,h/img.height);
  const dw=img.width*s, dh=img.height*s;
  const dx=Math.min(x, Math.max(x+w-dw, x+w/2-fx*dw));
  const dy=Math.min(y, Math.max(y+h-dh, y+h/2-fy*dh));
  g.drawImage(img,dx,dy,dw,dh);
}

/**
 * Where the subject of a photograph is, when nothing has told the crop where to look.
 *
 * Edge energy stands in for subject: a shelf of trophies or a rail of chains carries dense
 * detail, an empty floor carries almost none. The centroid of that energy, pulled most of the
 * way back to the middle so one busy corner can't yank the frame, is what the crop centres on.
 * Cheap by design — 72px wide, once per photo at load.
 */
function focusOf(img){
  if(!img || !img.width) return {fx:0.5,fy:0.5};
  const w=72, h=Math.max(8,Math.round(72*img.height/img.width));
  const o=document.createElement('canvas'); o.width=w; o.height=h;
  const x=o.getContext('2d',{willReadFrequently:true});
  x.drawImage(img,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data;
  const lum=i=>0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
  let sx=0, sy=0, tot=0;
  for(let j=1;j<h-1;j++) for(let i=1;i<w-1;i++){
    const c=j*w+i;
    const e=Math.abs(lum(c)-lum(c+1))+Math.abs(lum(c)-lum(c+w));
    const wt=e*e;
    sx+=wt*(i+0.5); sy+=wt*(j+0.5); tot+=wt;
  }
  if(!tot) return {fx:0.5,fy:0.5};
  return { fx: lerp(0.5, sx/tot/w, 0.55), fy: lerp(0.5, sy/tot/h, 0.55) };
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

/** Lines fade up into place, one after another. A line is either in its final colour or it
 *  isn't on screen — a ghosted preview of the finished headline reads as a rendering fault. */
function reveal(text,{y,size,weight,colour,maxW,x,p,stagger,align,font}){
  const f = font || (weight+' '+size+'px "Plus Jakarta Sans", sans-serif');
  const lines=wrapWords(text.split(' '),f,maxW);
  g.font=f; g.textBaseline='alphabetic'; g.textAlign='left';
  const lh=size*LINE_HEIGHT;
  let yy=y;
  lines.forEach((line,i)=>{
    const t=clamp01((p - i*stagger)/0.26);
    if(t>0){
      const str=line.join(' ');
      const xx = align==='center' ? x-g.measureText(str).width/2 : x;
      g.save();
      g.globalAlpha=easeOut(t);
      g.fillStyle=colour;
      g.fillText(str,xx,yy+(1-easeOut(t))*size*0.16);
      g.restore();
    }
    yy+=lh;
  });
  return yy-y;
}

const headLines = (text,size) =>
  wrapWords(text.split(' '),'800 '+size+'px "Plus Jakarta Sans", sans-serif',W-PAD*2).length;

/** One line, shrunk until it fits. A wrapped url reads as broken. */
function fitLine(text,{max,min,weight,maxW}){
  for(let s=max;s>=min;s-=2){
    g.font=weight+' '+s+'px "Plus Jakarta Sans", sans-serif';
    if(g.measureText(text).width<=maxW) return s;
  }
  return min;
}

/**
 * Where an uncroppable photograph goes instead — sitting directly above the type, over a blurred
 * blow-up of itself so the frame stays photographic rather than turning into a letterbox.
 *
 * Held to 86% of the frame width rather than the full bleed the feature ad uses: these are
 * rectangles cut out of a 1600px photo, and the last 14% of width is the difference between a
 * crisp plate and a visibly upscaled one.
 */
const PLATE_W = 0.86;
function plateBox(img,top,headSize){
  if(!img || survives(img)>=PLATE_MIN) return null;
  const bottom=top-headSize*0.86-PAD*0.7, ceiling=H*0.085;
  let w=W*PLATE_W, h=w*img.height/img.width;
  if(h>bottom-ceiling){ h=bottom-ceiling; w=h*img.width/img.height; }
  // Centred in the room above the type, not dropped to the bottom of it. A 2:1 plate under a
  // one-line headline leaves 700px of blurred field above it on the 9:16 cut, and a picture
  // pinned to the words with a void over it reads as a layout that ran out of content.
  return {x:(W-w)/2, y:ceiling+(bottom-ceiling-h)/2, w, h};
}

/**
 * The field behind a plate.
 *
 * A crop blurred behind itself is a poor backdrop — the mat rectangle blurs to a flat brown
 * field and the frame reads as empty. A derived crop knows which photograph it was cut out of,
 * so the blur is taken from the whole room instead: same place, same light, actual depth.
 */
const backdropFor = i => PHOTOS[(spec.backdropOf||{})[i] ?? i] || PHOTOS[i];

function backdrop(img,p){
  const s=lerp(1.34,1.42,easeInOut(p));
  g.save();
  g.filter='blur(72px)';
  g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
  coverAt(img,0,0,W,H,0.5,0.5);
  g.restore();
  g.fillStyle='rgba(18,10,22,0.58)'; g.fillRect(0,0,W,H);
}

function plate(img,box,p){
  g.save();
  g.shadowColor='rgba(0,0,0,0.55)';
  g.shadowBlur=Math.round(W*0.055);
  g.shadowOffsetY=Math.round(W*0.014);
  g.fillStyle='#000'; g.fillRect(box.x,box.y,box.w,box.h);
  g.restore();
  g.save();
  g.beginPath(); g.rect(box.x,box.y,box.w,box.h); g.clip();
  const s=lerp(1.0,1.03,easeInOut(p));
  const dw=box.w*s, dh=box.h*s;
  g.drawImage(img, box.x+(box.w-dw)/2, box.y+(box.h-dh)/2, dw, dh);
  g.restore();
  g.save();
  g.strokeStyle='rgba(255,255,255,0.14)'; g.lineWidth=2;
  g.strokeRect(box.x+1,box.y+1,box.w-2,box.h-2);
  g.restore();
}

/** A neutral scrim, not a brand wash — the photographs keep their own colour. Only the strip
 *  the type sits on is darkened, and only enough to hold white text. */
function scrims(k){
  const grd=g.createLinearGradient(0,H*0.30,0,H);
  grd.addColorStop(0,'rgba(18,10,22,0)');
  grd.addColorStop(1,'rgba(18,10,22,'+(0.88*k).toFixed(3)+')');
  g.fillStyle=grd; g.fillRect(0,H*0.30,W,H*0.70);
  const t=g.createLinearGradient(0,0,0,H*0.16);
  t.addColorStop(0,'rgba(18,10,22,'+(0.34*k).toFixed(3)+')');
  t.addColorStop(1,'rgba(18,10,22,0)');
  g.fillStyle=t; g.fillRect(0,0,W,H*0.16);
}

/* ---------- the end card ---------- */

function paintEnd(b,p){
  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);
  const a=clamp01(p/0.20);
  const markH=Math.round(W*0.20);

  // The whole sign-off is measured and then centred as one block. Pinning the mark to a fixed
  // fraction of the height put the 9:16 end card's last line 800px above the bottom of the frame.
  const nameSize=Math.round(W*0.062);
  const gap=Math.round(W*0.13);
  const nameH=wrapWords(spec.biz.name.split(' '),'800 '+nameSize+'px "Plus Jakarta Sans", sans-serif',W-PAD*2)
    .length*nameSize*LINE_HEIGHT;
  const blockH=markH+gap+nameH+Math.round(W*0.052);
  const top=Math.max(H*0.12,(H-blockH)/2);

  g.save(); g.globalAlpha=a;
  g.drawImage(MARK_W,(W-markH*MARK_ASPECT)/2,top,markH*MARK_ASPECT,markH);
  g.restore();

  // No tagline under the mark. The wordmark already reads LOCALS; printing "made by locals, for
  // locals" under it puts the word on screen three times in one frame.
  let y = top + markH + gap;
  y += reveal(spec.biz.name,{y,size:nameSize,weight:'800',colour:GOLD,
    maxW:W-PAD*2,x:W/2,p,stagger:0.10,align:'center'});

  const la=clamp01((p-0.34)/0.26);
  g.save(); g.globalAlpha=la;
  const size=fitLine(spec.url,{max:Math.round(W*0.036),min:Math.round(W*0.023),weight:'700',maxW:W-PAD*2});
  g.font='700 '+size+'px "Plus Jakarta Sans", sans-serif';
  g.textAlign='center'; g.fillStyle='rgba(255,255,255,0.90)';
  g.fillText(spec.url,W/2,y+Math.round(W*0.052));
  g.textAlign='left';
  g.restore();
  grain(GRAIN_ALPHA);
}

/* ---------- a beat ---------- */

function paintBeat(b,p){
  if(b.kind==='end') return paintEnd(b,p);

  g.fillStyle=C[b.bg]||PURPLE; g.fillRect(0,0,W,H);
  const onDark = b.bg!=='cream' && b.bg!=='gold';
  const headColour = b.headColour ? C[b.headColour] : (onDark ? '#ffffff' : INK);

  const headSize=b.big?Math.round(W*0.112):Math.round(W*0.082);
  const nLines=headLines(b.head,headSize);
  let blockH=nLines*headSize*LINE_HEIGHT;
  if(b.sub) blockH+=Math.round(W*0.052)+Math.round(W*0.030);

  // Photo beats anchor low against the safe margin so the picture stays visible; colour beats
  // sit optically centred.
  const top = b.kind==='photo'
    ? H - SAFE_BOTTOM - blockH + headSize*0.72
    : Math.max(H*0.24,(H-blockH)/2) + headSize*0.66;

  // The picture is painted after the type has been measured, because a photograph that has to be
  // shown whole is laid out around the words rather than behind them.
  if(b.kind==='photo'){
    const img=PHOTOS[b.photo];
    const box=plateBox(img,top,headSize);
    if(box){
      backdrop(backdropFor(b.photo),p);
      scrims(0.55);
      plate(img,box,p);
    } else {
      const f=b.focus ? {fx:b.focus[0], fy:b.focus[1]} : (FOCUS[b.photo]||{fx:0.5,fy:0.5});
      const s=lerp(1.0,1.07,easeInOut(p));
      g.save();
      g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
      coverAt(img,0,0,W,H,f.fx,f.fy);
      g.restore();
      scrims(1);
    }
  }

  const used=reveal(b.head,{y:top,size:headSize,weight:'800',colour:headColour,
    maxW:W-PAD*2,x:PAD,p,stagger:0.10});

  if(b.sub){
    const a=clamp01((p-0.34)/0.26);
    g.save(); g.globalAlpha=a;
    g.fillStyle=C[b.subColour]||(onDark?GOLD:PURPLE);
    g.font='700 '+Math.round(W*0.046)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText(b.sub,PAD,top+used+Math.round(W*0.048)+(1-easeOut(a))*24);
    g.restore();
  }

  grain(GRAIN_ALPHA);
}

/* ---------- the still card ---------- */

/**
 * A standalone post, built on the same canvas as the video so the two can't drift apart.
 *
 * The type scale is the house card scale from build-social-cards.mjs — Georgia italic eyebrow at
 * 54, headline stepped by length, meta at 44, url last — so a highlight sits in a profile grid
 * next to the spotlight and week cards without looking like it came from somewhere else.
 */
function paintCard(){
  const card = spec.card;
  const img = PHOTOS[card.photo];
  const pad = PAD;
  const bottom = H - SAFE_BOTTOM;

  g.fillStyle=PURPLE; g.fillRect(0,0,W,H);

  // Measure the type block from the bottom up, then give the picture whatever is left.
  const titleSize = card.title.length > 26 ? 92 : card.title.length > 18 ? 108 : 122;
  const eyebrowFont = 'italic 600 54px Georgia, serif';
  const metaSize = 44, urlMax = 40, urlMin = 26;

  const titleLines = wrapWords(card.title.split(' '),'800 '+titleSize+'px "Plus Jakarta Sans", sans-serif',W-pad*2);
  const metaLines  = card.meta ? wrapWords(card.meta.split(' '),'500 '+metaSize+'px "Plus Jakarta Sans", sans-serif',W-pad*2) : [];
  const eyebrowLines = wrapWords(card.eyebrow.split(' '),eyebrowFont,W-pad*2);

  const urlSize = fitLine(spec.url,{max:urlMax,min:urlMin,weight:'800',maxW:W-pad*2});
  const blockH =
    eyebrowLines.length*54*1.2 + 14 +
    titleLines.length*titleSize*1.04 +
    (metaLines.length ? 30 + metaLines.length*metaSize*1.35 : 0) +
    50 + urlSize*1.2;
  const blockTop = bottom - blockH;

  if(img){
    const ceiling = H*0.085;
    const floor = blockTop - Math.round(W*0.075);
    let pw = W*PLATE_W, ph = pw*img.height/img.width;
    if(ph > floor-ceiling){ ph = floor-ceiling; pw = ph*img.width/img.height; }
    // Centred in the room above the type rather than dropped to the bottom of it. On the 9:16
    // cut the room is 600px taller than the picture needs, and a bottom-anchored plate left a
    // quarter of the card as empty blur at the top.
    const box = {x:(W-pw)/2, y:ceiling+(floor-ceiling-ph)/2, w:pw, h:ph};
    backdrop(backdropFor(card.photo),0.5);
    plate(img,box,0);
  } else {
    const grd=g.createLinearGradient(0,0,W*0.4,H);
    grd.addColorStop(0,'#1b0a20'); grd.addColorStop(0.45,'#4a0857'); grd.addColorStop(1,PURPLE);
    g.fillStyle=grd; g.fillRect(0,0,W,H);
  }

  // A wash under the type, so the words sit on a field rather than on the blur.
  const wash=g.createLinearGradient(0,blockTop-Math.round(W*0.14),0,H);
  wash.addColorStop(0,'rgba(101,12,117,0)');
  wash.addColorStop(1,'rgba(101,12,117,0.94)');
  g.fillStyle=wash; g.fillRect(0,blockTop-Math.round(W*0.14),W,H-blockTop+Math.round(W*0.14));

  g.textBaseline='alphabetic'; g.textAlign='left';
  let y = blockTop + 54;
  g.font=eyebrowFont; g.fillStyle=GOLD;
  eyebrowLines.forEach(l => { g.fillText(l.join(' '),pad,y); y += 54*1.2; });
  y += 14;

  g.font='800 '+titleSize+'px "Plus Jakarta Sans", sans-serif'; g.fillStyle='#ffffff';
  titleLines.forEach((l,i) => { g.fillText(l.join(' '),pad,y+titleSize*0.86); y += titleSize*1.04; void i; });

  if(metaLines.length){
    y += 30;
    g.font='500 '+metaSize+'px "Plus Jakarta Sans", sans-serif'; g.fillStyle='#f3e6f6';
    metaLines.forEach(l => { g.fillText(l.join(' '),pad,y+metaSize*0.8); y += metaSize*1.35; });
  }

  y += 50;
  g.font='800 '+urlSize+'px "Plus Jakarta Sans", sans-serif'; g.fillStyle=GOLD;
  g.fillText(spec.url,pad,y+urlSize*0.86);

  grain(GRAIN_ALPHA);
}

/* ---------- run ---------- */

const toJpeg = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.94));
const toPng  = () => new Promise(r => cv.toBlob(r,'image/png'));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  PHOTOS = await Promise.all(spec.photos.map(f => load('/p/'+f)));
  FOCUS = PHOTOS.map(focusOf);
  GRAIN = makeGrain();
  await document.fonts.load('800 140px "Plus Jakarta Sans"');
  await document.fonts.load('600 44px "Plus Jakarta Sans"');
  await document.fonts.load('500 44px "Plus Jakarta Sans"');
  await document.fonts.ready;

  if(spec.mode === 'card'){
    paintCard();
    const blob = await toPng();
    await fetch('/card',{method:'POST',body:await blob.arrayBuffer()});
    await fetch('/done',{method:'POST'});
    document.title='DONE';
    return;
  }

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

    // Colour wipe across the seam, direction alternating: every seam sweeping the same way gives
    // the whole piece one repeating gesture, and on a feed the eye predicts it by the third cut.
    const next=spec.beats[idx+1];
    const toEnd=beat.dur-local;
    if(next && toEnd<WIPE){
      const w=easeInOut(1-toEnd/WIPE);
      g.fillStyle=C[next.bg]||PURPLE;
      const dir=idx%4;
      if(dir===0)      g.fillRect(0,H-H*w,W,H*w+2);
      else if(dir===1) g.fillRect(0,0,W*w+2,H);
      else if(dir===2) g.fillRect(0,0,W,H*w+2);
      else             g.fillRect(W-W*w,0,W*w+2,H);
    }

    const blob=await toJpeg();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/* ------------------------------------------------------------------ *
 * Beats
 * ------------------------------------------------------------------ */

/**
 * The generic highlight, for a business with no hand-written direction.
 *
 * Deliberately modest: the photographs are whatever the row holds, so the beats are the ones any
 * row can support — where it is, what it is in its own about text, when it's open, where to read
 * the rest. No hook, because a hook has to be checked against a photograph by somebody.
 */
function genericBeats(biz) {
  const beats = []
  const n = Math.min(3, biz.photos.length)
  const where = neighbourhoodLabel(biz.address).replace(/\s*—\s*$/, "")
  beats.push({
    kind: "photo", photo: 0,
    head: `${biz.name}.`,
    sub: streetLine(biz.address) ? `${streetLine(biz.address)}, Lompoc.` : `Lompoc, California.`,
    dur: 3.2,
  })
  // detailSentence, not the raw first sentence of the about text: it strips the business name and
  // the street address, both of which the beat before this one has already put on screen. Left
  // raw, this beat read "Sake Sushi & Korean BBQ serves ... at 1325 N H St, Suite C in Lompoc."
  const detail = detailSentence(biz.name, biz.about)
  if (detail) beats.push({ kind: "photo", photo: Math.min(1, n - 1), head: detail, dur: 3.4 })
  const hrs = hoursLines(biz.hours_json)
  if (hrs) beats.push({ kind: "color", bg: "gold", head: hrs.head, sub: hrs.sub, subColour: "purple", dur: 2.6 })
  else beats.push({ kind: "color", bg: "gold", head: `Open ${where}.`, dur: 2.6 })
  beats.push({ kind: "end", bg: "purple", dur: 3.4 })
  return beats
}

/**
 * The bed under the picture: one chord per beat, changing on the cut, so a cut lands as a change
 * of harmony as well as a change of colour. I–V–vi–IV–V–I in A major — it opens on the tonic,
 * travels, and comes home on an authentic cadence over the end card, so the last chord is a
 * resolution rather than a fade-out that ran out of runtime.
 */
const PROGRESSION = ["A", "E", "F#m", "D", "E", "A"]
const chordFor = (i, n) => (i === n - 1 ? "A" : PROGRESSION[i % (PROGRESSION.length - 1)])

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function serve(photoDir, W, H, spec, onFrame, onCard) {
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
    if ((url.pathname === "/frame" || url.pathname === "/card") && req.method === "POST") {
      const chunks = []
      req.on("data", (c) => chunks.push(c))
      req.on("end", () => {
        const buf = Buffer.concat(chunks)
        if (url.pathname === "/card") onCard?.(buf)
        else onFrame?.(url.searchParams.get("n"), buf)
        res.writeHead(200); res.end("ok")
      })
      return
    }
    if (url.pathname === "/done") { finished = true; res.writeHead(200); return res.end("ok") }
    res.writeHead(404); res.end()
  })
  return { server, done: () => finished }
}

async function drive(server, done, W, H, timeoutSec) {
  await new Promise((r) => server.listen(0, r))
  const port = server.address().port
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    `--window-size=${W},${H}`,
    `http://localhost:${port}/player.html`,
  ], { stdio: "ignore" })
  const deadline = Date.now() + timeoutSec * 1000
  while (!done() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200))
  chrome.kill()
  server.close()
}

async function renderVideo(key, spec, photoDir, bedPath, outFile) {
  const { w: W, h: H } = SHAPES[key]
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `hl-${key}-`))
  let written = 0

  const { server, done } = serve(photoDir, W, H, spec, (n, buf) => {
    fs.writeFileSync(path.join(frameDir, `f-${n}.jpg`), buf)
    written++
  })
  await drive(server, done, W, H, expected * 0.6 + 240)

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`${key}: painted only ${written}/${expected} frames`)
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  // A silent upload gets demoted on both platforms and gives nothing back to a viewer who taps
  // for sound. The bed is built once for both shapes and cut to the length of the picture.
  const code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, [
      "-y", "-framerate", String(FPS),
      "-i", path.join(frameDir, "f-%05d.jpg"),
      ...(bedPath ? ["-i", bedPath] : []),
      "-c:v", "libx264", "-preset", "slow", "-crf", "19",
      ...(bedPath ? ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"] : []),
      "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      "-t", seconds.toFixed(3), outFile,
    ], { stdio: "ignore" })
    ff.on("close", r)
  })
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${outFile}`)

  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${path.basename(outFile).padEnd(46)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB` +
    (bedPath ? "  + music" : "  (silent)"))
}

async function renderCard(key, spec, photoDir, outFile) {
  const { w: W, h: H } = SHAPES[key]
  let got = null
  const { server, done } = serve(photoDir, W, H, spec, null, (buf) => { got = buf })
  await drive(server, done, W, H, 120)
  if (!got) throw new Error(`${key}: card never painted`)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, got)
  const kb = (got.length / 1024).toFixed(0)
  console.log(`  ✓ ${path.basename(outFile).padEnd(46)} ${W}x${H}  ${kb} KB`)
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

const biz = await loadBusiness(SLUG)
const direction = HIGHLIGHTS[SLUG] || null
console.log(`${biz.name} — ${biz.category || "uncategorised"}, ${biz.photos.length} photos` +
  (direction ? "  (hand-directed)" : "  (generic)"))

const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "hl-photos-"))
const files = await cachePhotos(biz.photos, photoDir)
const cropFiles = await cutCrops(direction?.crops, files, photoDir)
console.log(`photos: ${files.filter(Boolean).length}/${biz.photos.length} cached` +
  (Object.keys(cropFiles).length ? `, ${Object.keys(cropFiles).length} crops cut` : ""))

// One flat list for the player; beats name photos by crop key or by original index.
const pool = []
const at = new Map()
files.forEach((f, i) => { if (f) { at.set(i, pool.length); pool.push(f) } })
// A crop remembers the photograph it came out of, so the blurred field behind a plate can be the
// whole room rather than a blow-up of the rectangle sitting on top of it.
const backdropOf = {}
for (const [name, f] of Object.entries(cropFiles)) {
  at.set(name, pool.length)
  const src = at.get(direction.crops[name].from)
  if (src !== undefined) backdropOf[pool.length] = src
  pool.push(f)
}

const resolve = (ref) => {
  const i = at.get(ref)
  if (i === undefined) throw new Error(`beat references photo "${ref}", which isn't in the pool`)
  return i
}
const beats = (direction?.beats || genericBeats(biz)).map((b) =>
  b.kind === "photo" ? { ...b, photo: resolve(b.photo) } : { ...b })

const url = `lompoclocals.com/biz/${biz.slug}`

// Guard: nothing that frames the town or a member on price ships.
for (const b of beats) for (const t of [b.head, b.sub]) if (t) assertNoPriceFraming(t, `${SLUG} beat`)

const card = direction?.card
  ? { ...direction.card, photo: resolve(direction.card.photo) }
  : {
      photo: 0,
      eyebrow: neighbourhoodLabel(biz.address),
      title: biz.name,
      meta: detailSentence(biz.name, biz.about) || null,
    }
if (card.meta) assertNoPriceFraming(card.meta, `${SLUG} card meta`)
assertNoPriceFraming(card.eyebrow, `${SLUG} card eyebrow`)

const seconds = beats.reduce((a, b) => a + b.dur, 0)
console.log(`\nbeats (${seconds.toFixed(1)}s):`)
beats.forEach((b, i) => console.log(`  ${i + 1}. ${String(b.dur.toFixed(1)).padStart(4)}s  ` +
  `${b.kind.padEnd(6)} ${b.head || biz.name}${b.sub ? `  /  ${b.sub}` : ""}`))

const base = { photos: pool, backdropOf, biz: { name: biz.name }, url, card }

let bedPath = null
if (!NO_VIDEO) {
  const schedule = beats.map((b, i) => ({ chord: chordFor(i, beats.length), dur: b.dur }))
  const accentAt = []
  let mark = 0
  schedule.forEach((s, i) => {
    mark += s.dur
    if (i < schedule.length - 1) accentAt.push({ at: mark, chord: schedule[i + 1].chord })
  })
  const audioDir = fs.mkdtempSync(path.join(os.tmpdir(), "hl-audio-"))
  bedPath = path.join(audioDir, "bed.wav")
  console.log("")
  await buildBed({ out: bedPath, schedule, total: seconds, lufs: -14, accentAt })
}

console.log("")
for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  const { suffix } = SHAPES[key]
  if (!NO_VIDEO) {
    await renderVideo(key, { ...base, mode: "video", beats },
      photoDir, bedPath, path.join(VIDEO_DIR, `highlight-${biz.slug}-${suffix}.mp4`))
  }
  if (!NO_CARD) {
    await renderCard(key, { ...base, mode: "card" },
      photoDir, path.join(CARD_DIR, `highlight-${biz.slug}-${key}.png`))
  }
}

fs.rmSync(photoDir, { recursive: true, force: true })
if (bedPath) fs.rmSync(path.dirname(bedPath), { recursive: true, force: true })
