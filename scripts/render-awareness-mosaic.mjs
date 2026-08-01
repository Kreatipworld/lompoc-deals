#!/usr/bin/env node
/**
 * "Know your town" — awareness ad, treatment B: MOSAIC.
 *
 * The argument is not a feature list. People live in Lompoc and don't know their own town: there
 * are hundreds of businesses here, events every week, launches you could watch from the driveway.
 * So the ad makes the hub *visible* — one photograph you'd recognise, then a dozen, then a wall of
 * the town assembling itself out of real site photography while a counter outruns the tiles.
 *
 * Two rules keep a mosaic from turning into noise:
 *   1. Type never sits on a photograph. A cream shelf (or a purple panel) holds every word, and it
 *      grows and shrinks between beats — that shelf is the whole transition vocabulary, so there
 *      are no wipes, dissolves or slides fighting the grid.
 *   2. Arrival has a rhythm. Tiles bloom outward from the centre cell on a schedule that
 *      accelerates; they fade and settle, they never spin or fly.
 *
 * Tiles are square, so a photo that is far from square gets sliced. The existing feature ad has
 * exactly that defect — a storefront cropped until the sign reads "…ving H… ANTIQUE & VINT…" — so
 * candidates are scored in the browser (where the real pixel dimensions are known) and anything
 * wider than ~2:1, taller than ~1:2, or under 420px on its short side is dropped from the pool.
 * The one photo shown large is cast from the curated activities table, framed 4:3, barely cropped.
 *
 * Photos are downloaded once and served from the local frame server: same-origin keeps the canvas
 * untainted (toBlob throws on a tainted canvas) and avoids refetching 100 images every frame.
 *
 * Same two headless-Chrome facts the other renderers work around (see lib/video-frames.mjs):
 * MediaRecorder returns empty video in headless, and requestAnimationFrame never fires — so frames
 * are painted on a step loop, POSTed out as JPEGs, and encoded by ffmpeg.
 *
 * Every number is queried from Neon at render time. Nothing here is hardcoded or estimated.
 *
 * Usage:
 *   node scripts/render-awareness-mosaic.mjs             # both shapes
 *   node scripts/render-awareness-mosaic.mjs --only=tt   # 9:16 only
 *   node scripts/render-awareness-mosaic.mjs --no-audio
 */
import http from "node:http"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import ffmpegPath from "ffmpeg-static"
import { neon } from "@neondatabase/serverless"

const FPS = 30
const OUT_DIR = "content/social/video"
const REPO = process.cwd()
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const HERE = path.dirname(fileURLToPath(import.meta.url))

const SHAPES = {
  tt: { w: 1080, h: 1920, name: "awareness-mosaic-9x16.mp4", unit: 1.0 },
  // 4:5 is 570px shorter with the same width, so the shelf would eat the grid. The type unit
  // shrinks with it, which buys back a row and a half of mosaic.
  ig: { w: 1080, h: 1350, name: "awareness-mosaic-4x5.mp4", unit: 0.88 },
}
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean)
const NO_AUDIO = process.argv.includes("--no-audio")

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
  const [[b], [e], [l]] = await Promise.all([
    sql`select count(*)::int n from businesses where status='approved'`,
    sql`select count(*)::int n from events where status='approved' and starts_at > now()`,
    sql`select count(*)::int n from events
        where status='approved' and starts_at > now() and title ilike '%rocket launch%'`,
  ])

  /**
   * One business at a time from each category, round-robin.
   *
   * A flat md5 sample is a fair sample of the database and a terrible picture of the town: Food &
   * Drink is 104 of the 473 rows and its photos are the most photogenic, so the wall came out as
   * burgers, sushi and breakfast plates — a restaurant app, not a town. Taking the categories in
   * turn puts the tyre shop, the salon, the winery and the thrift store in the same wall, which is
   * the actual argument. md5 ordering inside each category keeps the run reproducible.
   */
  const biz = await sql`
    select name, photos_json from (
      select name, photos_json, category_id,
             row_number() over (partition by category_id order by md5(slug)) rn
      from businesses
      where status='approved' and jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 1
    ) t
    order by rn, category_id
    limit 132`
  const act = await sql`select title, photos_json from activities
    where jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 1 order by md5(slug)`

  // Photo #1 is the cover on the site — the one already chosen to represent the place.
  const pick = (rows, key) =>
    rows
      .map((r) => ({ title: r[key], url: (r.photos_json || []).map(photoUrl).find(Boolean) }))
      .filter((x) => x.url)

  return { n: { businesses: b.n, events: e.n, launches: l.n }, biz: pick(biz, "name"), act: pick(act, "title") }
}

/** Downloads each photo once so the player can load them same-origin. */
async function cachePhotos(items, dir) {
  fs.mkdirSync(dir, { recursive: true })
  const kept = []
  await Promise.all(
    items.map(async (item, i) => {
      try {
        const res = await fetch(item.url)
        if (!res.ok) return
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 12000) return // a 3KB "photo" is a placeholder or an error page
        fs.writeFileSync(path.join(dir, `${i}.jpg`), buf)
        kept[i] = `${i}.jpg`
      } catch {
        /* a dead photo url just means one fewer tile */
      }
    })
  )
  // A photo that failed to download shifts every index after it, and the hero is cast by index —
  // so hand back where each surviving photo actually landed rather than leaving callers to guess.
  const files = []
  const titles = []
  const position = new Map()
  kept.forEach((f, i) => {
    if (!f) return
    position.set(i, files.length)
    files.push(f)
    titles.push(items[i].title)
  })
  return { files, titles, position }
}

const PLAYER = (W, H, UNIT, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#FAF5EC;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS}, U=${W}*${UNIT};
const spec = ${JSON.stringify(spec)};
const cv = document.getElementById('c'), g = cv.getContext('2d');

const CREAM='#FAF5EC', INK='#241629', PURPLE='#650C75', GOLD='#EFC618', GREEN='#0B992F';
const C = {cream:CREAM, ink:INK, purple:PURPLE, gold:GOLD, green:GREEN};

const clamp01   = t => t < 0 ? 0 : t > 1 ? 1 : t;
const easeOut   = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
const lerp = (a,b,t) => a + (b-a)*t;
const PAD = Math.round(U * 0.082);
const GRAIN_ALPHA = 0.028;
const MARK_ASPECT = 314 / 402;   // the SVG has a viewBox but no width/height

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

let MARK_W, PHOTOS = [], GRAIN, HERO = 0;

/* ---------------- the grid ---------------- */

const COLS = 5;
const GAP  = Math.round(W * 0.0074);
const TILE = (W - GAP*(COLS+1)) / COLS;
const ROWS = Math.ceil((H - GAP) / (TILE + GAP));
const CELLS = COLS * ROWS;
// The grid is cut from the same cloth in both shapes, so in 9:16 it overshoots the frame; bleed
// the overshoot equally top and bottom rather than leaving a stub row at the bottom.
const Y0 = GAP - Math.max(0, (GAP + ROWS*(TILE+GAP)) - H) / 2;

const cellRect = i => ({
  x: GAP + (i % COLS) * (TILE + GAP),
  y: Y0 + Math.floor(i / COLS) * (TILE + GAP),
  w: TILE, h: TILE,
});

// Deterministic per-cell jitter — a perfect concentric bloom reads mechanical.
const hash = i => { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/**
 * Where the wall starts growing from.
 *
 * Not the middle of the frame — the middle of the strip of frame the type shelf isn't standing on.
 * In 4:5 the shelf takes a third of the height, and a bloom centred on the frame put its bottom
 * row half under the panel: with a dozen tiles on screen that doesn't read as "the wall continues
 * behind the type", it reads as a tile that got cut in half.
 */
const OPEN_MID = (H - ${JSON.stringify(spec.beats[1].shelf)}*U) / 2;
const CENTRE_ROW = Math.max(1, Math.min(ROWS-2,
  Math.round((OPEN_MID - Y0 - TILE/2)/(TILE+GAP))));
const CENTRE = CENTRE_ROW*COLS + Math.floor(COLS/2);

const byDistance = Array.from({length: CELLS}, (_, i) => i).sort((a, b) => {
  const d = i => {
    const dx = (i%COLS) - (CENTRE%COLS), dy = Math.floor(i/COLS) - CENTRE_ROW;
    return Math.hypot(dx, dy*1.02) + hash(i)*0.55;
  };
  return d(a) - d(b);
});
// The opening dozen are drawn only from the three rows that are certainly clear of the shelf;
// after that the fill is free to run to the corners.
const BLOOM = byDistance.filter(i => Math.abs(Math.floor(i/COLS) - CENTRE_ROW) <= 1).slice(0, 13);
const ORDER = [...BLOOM, ...byDistance.filter(i => !BLOOM.includes(i))];

/* ---------------- photo scoring ---------------- */

/**
 * How well a photo survives being cropped to a square thumbnail.
 *
 * Nothing in the data says what a photo is *of*, but its shape says how much of it a square crop
 * throws away, and its resolution says whether it holds up at 206px. A panorama loses both ends —
 * which is how a storefront sign ends up unreadable — so it is dropped, not shrunk.
 */
function tileScore(im){
  if(!im || !im.width || !im.height) return -1;
  if(Math.min(im.width, im.height) < 420) return -1;
  const sq = Math.abs(Math.log(im.width/im.height));
  if(sq > 0.74) return -1;                       // beyond ~2:1 either way
  const c = contrast(im);
  if(c.sd < 30 || c.mean > 228 || c.mean < 28) return -1;
  return 1/(1 + sq*2.4) + Math.min(1, Math.min(im.width,im.height)/1300)*0.32
       + Math.min(1, c.sd/70)*0.22;
}

/**
 * Mean and spread of brightness, from a 32px thumbnail of the photo.
 *
 * At tile size a photo of the sky above a roofline, or of a blank interior wall, is a coloured
 * rectangle — it costs a slot in the wall and gives nothing back. There is no field in the data
 * that says "this photo is empty", but a flat luminance histogram says it well enough, and this
 * is the only place in the pipeline that can see pixels at all.
 */
const CONTRAST = new Map();
function contrast(im){
  if(CONTRAST.has(im)) return CONTRAST.get(im);
  const o=document.createElement('canvas'); o.width=32; o.height=32;
  const x=o.getContext('2d', {willReadFrequently:true});
  x.drawImage(im,0,0,32,32);
  const d=x.getImageData(0,0,32,32).data;
  let sum=0, sum2=0, n=0;
  for(let i=0;i<d.length;i+=4){
    const l=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
    sum+=l; sum2+=l*l; n++;
  }
  const mean=sum/n;
  const out={mean, sd: Math.sqrt(Math.max(0, sum2/n - mean*mean))};
  CONTRAST.set(im,out);
  return out;
}

/* ---------------- painting helpers ---------------- */

function makeGrain(){
  const o=document.createElement('canvas'); o.width=260; o.height=260;
  const x=o.getContext('2d'), d=x.createImageData(260,260);
  for(let i=0;i<d.data.length;i+=4){
    const v=120+Math.random()*135;
    d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;
  }
  x.putImageData(d,0,0); return o;
}
function grain(){
  g.save(); g.globalAlpha=GRAIN_ALPHA; g.globalCompositeOperation='overlay';
  for(let y=0;y<H;y+=260) for(let x=0;x<W;x+=260) g.drawImage(GRAIN,x,y);
  g.restore();
}

/** object-fit: cover, clipped to the box. */
function cover(img,x,y,w,h){
  if(!img) return;
  g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip();
  const s=Math.max(w/img.width,h/img.height);
  const dw=img.width*s, dh=img.height*s;
  g.drawImage(img, x+(w-dw)/2, y+(h-dh)/2, dw, dh);
  g.restore();
}

function wrap(text,font,maxW){
  g.font=font;
  const words=text.split(' '), lines=[]; let line='';
  for(const w of words){
    const t=line?line+' '+w:w;
    if(g.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t;
  }
  if(line) lines.push(line);
  return lines;
}

/** Digits drawn in fixed-width slots — proportional figures make a counter jitter as it climbs. */
function tabular(str,x,y,size,colour){
  g.font='800 '+size+'px "Plus Jakarta Sans", sans-serif';
  let slot=0;
  for(const d of '0123456789') slot=Math.max(slot,g.measureText(d).width);
  g.fillStyle=colour; g.textAlign='center';
  let cx=x;
  for(const ch of str){
    const w = ch===',' ? slot*0.42 : slot;
    g.fillText(ch,cx+w/2,y);
    cx+=w;
  }
  g.textAlign='left';
  return cx-x;
}
function tabularWidth(str,size){
  g.font='800 '+size+'px "Plus Jakarta Sans", sans-serif';
  let slot=0;
  for(const d of '0123456789') slot=Math.max(slot,g.measureText(d).width);
  return [...str].reduce((a,ch)=>a+(ch===','?slot*0.42:slot),0);
}

/* ---------------- timeline ---------------- */

const B = spec.beats;
const TOTAL = B.reduce((a,b)=>a+b.dur,0);
const START = []; { let a=0; for(const b of B){ START.push(a); a+=b.dur; } }
const at = t => { let i=0; for(let k=0;k<B.length;k++) if(t>=START[k]) i=k; return i; };

// Beat 1 shows one photograph large; at beat 2 it settles into the centre cell and the rest
// bloom out around it. Beat 3 is the flood — an accelerating fill, so the wall lands as a rush.
const HERO_MORPH = [START[1], START[1]+0.55];
const arrive = new Array(CELLS).fill(Infinity);
arrive[ORDER[0]] = HERO_MORPH[0];
for(let k=1;k<=12 && k<CELLS;k++) arrive[ORDER[k]] = START[1]+0.2 + (k-1)*0.19;
for(let k=13;k<CELLS;k++){
  const u=(k-13)/Math.max(1,CELLS-14);
  arrive[ORDER[k]] = START[2]+0.1 + 3.5*Math.pow(u,0.62);
}

// Which photo each cell holds, and when a handful of them turn over. The wall keeps changing after
// it is full, because 473 places do not fit in 45 squares and the ad should not pretend they do.
const pool = spec.tilePool;           // filled in at load once real dimensions are known
const cellPhoto = [];                 // cell -> [{t, idx}, ...]
function assignPhotos(good){
  cellPhoto[ORDER[0]] = [{t:-1, idx: HERO}];
  for(let k=1;k<CELLS;k++) cellPhoto[ORDER[k]] = [{t:-1, idx: good[(k-1) % good.length]}];
  let next = CELLS-1;
  const flipRows = Math.min(ROWS, 5);
  for(let f=0; f<16; f++){
    const t = START[3]+0.4 + f*0.38;
    // Turnover belongs to the beat that says there is more than fits on screen. Letting it run on
    // under "It's all in one place" just moved the eye away from the line.
    if(t > START[4]-0.5) break;
    const cell = ORDER[(3 + f*7) % (flipRows*COLS)];
    cellPhoto[cell].push({t, idx: good[next++ % good.length]});
  }
}
function photoAt(cell,t){
  const list=cellPhoto[cell]; let cur=list[0], prev=null, p=1;
  for(let i=1;i<list.length;i++){
    if(t>=list[i].t){ prev=cur; cur=list[i]; p=clamp01((t-list[i].t)/0.4); }
  }
  return {cur:cur.idx, prev: prev?prev.idx:null, p};
}

/* ---------------- the shelf ---------------- */

// The end card keeps one row of the wall across the top. A sign-off on a bare purple field could
// belong to any of the three treatments; a band of the town's own photographs above it could not.
const STRIP_TOP = Y0 + TILE + GAP;
const topOf = b => b.strip ? STRIP_TOP : (b.shelf===null ? 0 : H - b.shelf*U);

const shelfTopAt = t => {
  const i=at(t), local=t-START[i];
  let y = topOf(B[i]);
  if(i>0 && local<0.5) y = lerp(topOf(B[i-1]), y, easeInOut(local/0.5));
  return y;
};

const headSize = b => Math.round(U*(b.bigType?0.070:0.062));
const serifSize = Math.round(U*0.048);

/** Height of a beat's words, so a panel with no counter can hold them optically centred. */
function blockHeight(b){
  let h = 0;
  if(b.eyebrow) h += U*0.095;
  if(b.lines){
    const size=headSize(b), font='800 '+size+'px "Plus Jakarta Sans", sans-serif';
    for(const ln of b.lines) h += wrap(ln.t,font,W-PAD*2).length * size*1.10;
    h += U*0.012;
  }
  if(b.serif){
    const font='italic '+serifSize+'px Georgia, "Times New Roman", serif';
    h += wrap(b.serif,font,W-PAD*2).length * serifSize*1.24;
  }
  return h;
}

function drawShelf(top,tone){
  g.fillStyle = tone==='purple' ? PURPLE : CREAM;
  g.fillRect(0,top,W,H-top+2);
  g.fillStyle = tone==='purple' ? GOLD : GREEN;
  g.fillRect(0,top,W,Math.round(U*0.006));
}

/* ---------------- the counter ---------------- */

const COUNT_FROM = START[1]+0.2, COUNT_HOLD = START[1]+0.2+11*0.19;
// The number stops climbing before the beat does. A counter that lands with a third of a second
// left is a payoff nobody gets to read — 473 needs a beat of its own to sit there.
const RACE_A = START[2]+0.1, RACE_B = START[2]+3.5;
function counterAt(t){
  if(t < COUNT_FROM) return 1;
  if(t < COUNT_HOLD) return Math.min(13, 1 + Math.floor((t-COUNT_FROM)/0.19) + 1);
  if(t < RACE_A) return 13;
  if(t < RACE_B) return Math.round(lerp(13, spec.n.businesses, easeOut((t-RACE_A)/(RACE_B-RACE_A))));
  return spec.n.businesses;
}

/* ---------------- the frame ---------------- */

function paint(t){
  const i = at(t), b = B[i], local = t - START[i];
  // The opening beat is composed from frame zero — no fade-up. A feed pulls the first frame for
  // the thumbnail, and half a second of empty cream is both a blank thumbnail and a blank hook.
  const fade = (i===0 ? 1 : clamp01(local/0.34)) * clamp01((b.dur-local)/0.26);
  const rise = i===0 ? 0 : (1-easeOut(clamp01(local/0.34))) * U*0.024;

  g.fillStyle = CREAM; g.fillRect(0,0,W,H);

  // -- the mosaic
  for(let cell=0; cell<CELLS; cell++){
    const a0 = arrive[cell];
    if(t < a0) continue;
    if(cell===ORDER[0] && t < HERO_MORPH[1]) continue;   // still travelling, drawn below
    const a = clamp01((t-a0)/0.34);
    const r = cellRect(cell);
    const s = lerp(0.90,1,easeOut(a));
    const cw = r.w*s, ch = r.h*s;
    const x = r.x+(r.w-cw)/2, y = r.y+(r.h-ch)/2;
    const ph = photoAt(cell,t);
    g.save(); g.globalAlpha = easeOut(a);
    if(ph.prev!==null && ph.p<1){
      cover(PHOTOS[ph.prev],x,y,cw,ch);
      g.globalAlpha = easeOut(a)*ph.p;
    }
    cover(PHOTOS[ph.cur],x,y,cw,ch);
    g.restore();
  }

  const shelfTop = shelfTopAt(t);

  // -- the one photograph you'd recognise, and its journey into the wall
  if(t < HERO_MORPH[1]){
    const availTop = H*0.085, availBot = shelfTopAt(0) - PAD*1.1;
    // The card takes the photograph's own proportions. A fixed 4:3 card cropped the theatre sign
    // until the last letter kissed the edge — and "you know this one" only works if the thing you
    // are supposed to know is whole.
    const im = PHOTOS[HERO];
    const ar = im && im.height ? im.width/im.height : 1.4;
    let cw = W - PAD*2.1, chh = cw/ar;
    if(chh > (availBot-availTop)*0.88){ chh = (availBot-availTop)*0.88; cw = chh*ar; }
    const card = {x:(W-cw)/2, y: availTop + (availBot-availTop-chh)/2, w:cw, h:chh};
    const cell = cellRect(ORDER[0]);
    const m = t < HERO_MORPH[0] ? 0 : easeInOut(clamp01((t-HERO_MORPH[0])/(HERO_MORPH[1]-HERO_MORPH[0])));
    // Full opacity from the first frame; the movement is a slow settle out of a 3% push-in, which
    // is enough to stop a still photograph reading as a paused video.
    const s = lerp(1.035,1,easeOut(clamp01(t/0.9)));
    const rect = {
      x: lerp(card.x,cell.x,m), y: lerp(card.y,cell.y,m),
      w: lerp(card.w,cell.w,m), h: lerp(card.h,cell.h,m),
    };
    g.save();
    g.translate(rect.x+rect.w/2, rect.y+rect.h/2); g.scale(s,s);
    g.translate(-(rect.x+rect.w/2), -(rect.y+rect.h/2));
    if(m<0.5){
      g.shadowColor='rgba(36,22,41,0.20)'; g.shadowBlur=U*0.05; g.shadowOffsetY=U*0.018;
      g.fillStyle=CREAM; g.fillRect(rect.x,rect.y,rect.w,rect.h);
      g.shadowColor='transparent';
    }
    cover(PHOTOS[HERO],rect.x,rect.y,rect.w,rect.h);
    g.restore();
  }

  // -- the wall settles under the closing line. Not a wash — 22% of purple is enough to stop a
  //    hundred colours competing with five words, and the photographs keep their own colour.
  const veil = clamp01((t - START[4] + 0.35)/0.7) * 0.22
             + clamp01((t - START[5])/0.6) * 0.20;
  if(veil > 0.005){
    g.save(); g.globalAlpha=veil; g.fillStyle=PURPLE; g.fillRect(0,0,W,H); g.restore();
  }

  // -- the shelf, and everything written on it
  drawShelf(shelfTop, b.tone);

  // Beats that carry a counter are bottom-anchored by it, so their words start at the top of the
  // shelf. Beats without one have nothing holding them down, and a block of type floating at the
  // top of a short panel with a hand of empty cream underneath just looks like a mistake.
  let y = b.centre
    ? shelfTop + Math.max(PAD*0.6, ((H-shelfTop) - blockHeight(b)) / 2)
    : shelfTop + PAD;

  if(b.eyebrow){
    g.save(); g.globalAlpha=fade;
    g.font='700 '+Math.round(U*0.029)+'px "Plus Jakarta Sans", sans-serif';
    g.fillStyle=PURPLE; g.textBaseline='alphabetic';
    let x=PAD;
    for(const ch of b.eyebrow){ g.fillText(ch,x,y+U*0.029); x+=g.measureText(ch).width+U*0.008; }
    g.fillStyle=GREEN; g.fillRect(PAD, y+U*0.049, U*0.075, Math.round(U*0.006));
    g.restore();
    y += U*0.095;
  }

  if(b.lines){
    const size=headSize(b);
    const font='800 '+size+'px "Plus Jakarta Sans", sans-serif';
    g.save(); g.globalAlpha=fade; g.textBaseline='alphabetic';
    let yy=y+size*0.86;
    for(const ln of b.lines){
      for(const s of wrap(ln.t,font,W-PAD*2)){
        g.font=font; g.fillStyle=C[ln.c]||INK;
        g.fillText(s,PAD,yy+rise);
        yy+=size*1.10;
      }
    }
    y=yy-size*0.86+U*0.012;
    g.restore();
  }

  if(b.serif){
    const size=serifSize;
    g.save(); g.globalAlpha=clamp01((local-0.5)/0.4)*clamp01((b.dur-local)/0.26);
    g.font='italic '+size+'px Georgia, "Times New Roman", serif';
    g.fillStyle=C[b.serifColour]||GOLD; g.textBaseline='alphabetic';
    let yy=y+size*1.05;
    for(const s of wrap(b.serif,g.font,W-PAD*2)){ g.fillText(s,PAD,yy+rise); yy+=size*1.24; }
    g.restore();
  }

  // -- the counter: one object, always in the same place, growing
  const cA = clamp01((t-START[1]+0.02)/0.34) * clamp01((START[3]-t)/0.3);
  if(cA>0.01 && b.counter){
    const size=Math.round(U*0.195);
    const str=counterAt(t).toLocaleString();
    const by=H - PAD*0.92;
    g.save(); g.globalAlpha=cA;
    const nw=tabular(str,PAD,by,size,PURPLE);
    const lx=PAD+nw+U*0.030;
    const lsize=Math.round(U*0.032);
    const lfont='600 '+lsize+'px "Plus Jakarta Sans", sans-serif';
    const lls=wrap(b.counter,lfont,W-PAD-lx);
    g.font=lfont; g.fillStyle='rgba(36,22,41,0.60)';
    let ly=by-(lls.length-1)*lsize*1.22-lsize*0.16;
    for(const s of lls){ g.fillText(s,lx,ly); ly+=lsize*1.22; }
    g.restore();
  }

  // -- end card
  if(b.kind==='end'){
    const a=clamp01((local-0.18)/0.4);
    g.save(); g.globalAlpha=a;
    const h=Math.round(U*0.215);
    g.drawImage(MARK_W,(W-h*MARK_ASPECT)/2,H*0.39,h*MARK_ASPECT,h);
    g.restore();
    g.save(); g.globalAlpha=clamp01((local-0.42)/0.4);
    g.textAlign='center'; g.fillStyle=GOLD;
    g.font='800 '+Math.round(U*0.080)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText('lompoclocals.com',W/2,H*0.667);
    g.globalAlpha=clamp01((local-0.75)/0.4);
    g.fillStyle='rgba(250,245,236,0.88)';
    g.font='600 '+Math.round(U*0.034)+'px "Plus Jakarta Sans", sans-serif';
    g.fillText('Made by locals, for locals',W/2,H*0.725);
    g.textAlign='left'; g.restore();
  }

  grain();
}

const toBlob = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.94));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  PHOTOS = await Promise.all(spec.photos.map(f => load('/p/'+f)));
  GRAIN = makeGrain();
  await document.fonts.load('800 200px "Plus Jakarta Sans"');
  await document.fonts.load('600 40px "Plus Jakarta Sans"');
  await document.fonts.load('700 40px "Plus Jakarta Sans"');
  await document.fonts.ready;

  // The hero is cast by name in Node, but only the browser knows the pixels. A tall photo of a
  // landmark in a landscape card would be cropped to a sliver of itself, so the first candidate
  // that is actually landscape and actually sharp wins.
  HERO = spec.heroCandidates.find(i => {
    const im = PHOTOS[i];
    if(!im || !im.width) return false;
    const ar = im.width/im.height;
    return ar > 1.15 && ar < 2.2 && im.width >= 900;
  }) ?? spec.heroCandidates.find(i => PHOTOS[i]) ?? 0;

  // Rank the pool by how well each photo survives a square crop, then hand the best ones to the
  // cells that arrive first — those sit nearest the centre and stay on screen longest.
  const good = pool
    .map(i => ({i, s: tileScore(PHOTOS[i])}))
    .filter(x => x.s > 0 && x.i !== HERO)
    .sort((a,b) => b.s - a.s)
    .map(x => x.i);
  await fetch('/log?m='+encodeURIComponent(
    'tile pool '+good.length+' usable of '+pool.length+' loaded, '+CELLS+' cells + flips'),
    {method:'POST'});
  assignPhotos(good);

  const frames=Math.round(TOTAL*FPS);
  for(let i=0;i<frames;i++){
    paint(i/FPS);
    const blob=await toBlob();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/**
 * Six beats. One photograph, a dozen, the whole wall, the evidence, the promise, the sign-off.
 *
 * `shelf` is the height of the type panel in units of U (a share of the frame width, scaled per
 * shape) — it is the only transition in the ad. It grows for the flood so the numbers have room,
 * then shrinks hard for beat 4 so the mosaic finally breathes full-bleed, then a purple panel
 * takes most of the frame for the bilingual line and all of it for the end card.
 */
const beats = (n) => [
  {
    kind: "open", tone: "cream", shelf: 0.44,
    eyebrow: "LOMPOC, CALIFORNIA",
    lines: [{ t: "You know this one.", c: "ink" }],
    bigType: true, dur: 2.8,
  },
  {
    kind: "bloom", tone: "cream", shelf: 0.44,
    lines: [{ t: "And a few more.", c: "ink" }],
    counter: "places you could name", dur: 3.1,
  },
  {
    kind: "flood", tone: "cream", shelf: 0.50,
    lines: [{ t: "Your town is bigger than that.", c: "ink" }],
    counter: "local businesses in Lompoc", dur: 5.3,
  },
  {
    kind: "evidence", tone: "cream", shelf: 0.33, centre: true,
    lines: [
      { t: `${n.events} upcoming events.`, c: "ink" },
      { t: `${n.launches} are rocket launches.`, c: "purple" },
    ],
    dur: 3.6,
  },
  {
    kind: "promise", tone: "purple", shelf: 0.46, centre: true,
    lines: [{ t: "It's all in one place.", c: "cream" }],
    serif: "Todo tu pueblo, en un solo lugar.", serifColour: "gold",
    bigType: true, dur: 3.4,
  },
  { kind: "end", tone: "purple", shelf: null, strip: true, dur: 3.4 },
]

async function renderShape(key, spec, photoDir) {
  const { w: W, h: H, name, unit } = SHAPES[key]
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `mosaic-${key}-`))
  let written = 0
  let finished = false

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (url.pathname === "/player.html") {
      res.writeHead(200, { "content-type": "text/html" })
      return res.end(PLAYER(W, H, unit, spec))
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
    if (url.pathname === "/log") {
      console.log(`  · ${url.searchParams.get("m")}`)
      res.writeHead(200); return res.end("ok")
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

  const deadline = Date.now() + (expected * 0.8 + 300) * 1000
  while (!finished && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250))
  chrome.kill()
  server.close()

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`${key}: painted only ${written}/${expected} frames`)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const silent = path.join(frameDir, "silent.mp4")
  let code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, [
      "-y", "-framerate", String(FPS),
      "-i", path.join(frameDir, "f-%05d.jpg"),
      "-c:v", "libx264", "-preset", "slow", "-crf", "19",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", silent,
    ], { stdio: "ignore" })
    ff.on("close", r)
  })
  if (code !== 0) { fs.rmSync(frameDir, { recursive: true, force: true }); throw new Error(`ffmpeg exited ${code}`) }

  const outFile = path.join(OUT_DIR, name)
  if (NO_AUDIO) {
    fs.copyFileSync(silent, outFile)
  } else {
    const bed = path.join(frameDir, "bed.wav")
    await new Promise((r) => {
      const p = spawn(process.execPath, [path.join(HERE, "make-music-bed.mjs"), bed, seconds.toFixed(2)],
        { stdio: "ignore" })
      p.on("close", r)
    })
    if (!fs.existsSync(bed)) throw new Error("music bed was not produced")
    // The bed leaves make-music-bed.mjs at -20 LUFS; social platforms normalise to about -14, so
    // the master lands there with a dB of true-peak headroom.
    code = await new Promise((r) => {
      const ff = spawn(ffmpegPath, [
        "-y", "-i", silent, "-i", bed,
        "-filter:a", "loudnorm=I=-14:TP=-1:LRA=9",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-shortest", "-movflags", "+faststart", outFile,
      ], { stdio: "ignore" })
      ff.on("close", r)
    })
    if (code !== 0) { fs.rmSync(frameDir, { recursive: true, force: true }); throw new Error(`mux exited ${code}`) }
  }

  fs.rmSync(frameDir, { recursive: true, force: true })
  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${name.padEnd(30)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB`)
}

/* ---------------- run ---------------- */

const { n, biz, act } = await gather()
console.log("live numbers:", n)

const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "mosaic-photos-"))
const all = [...act, ...biz]                       // activities first: the hero is cast from them
const { files, titles, position } = await cachePhotos(all, photoDir)
console.log(`photos: ${files.length} of ${all.length} cached`)

/**
 * The one photo shown large is cast by name, not by index.
 *
 * A local recognises the theatre, the mission, the flower fields — that recognition is the whole
 * point of "You know this one." Indexing into an md5-ordered pool would put a plate of food there
 * and the line would fall flat. Activities are the curated table, so the hero comes from it.
 */
const HERO_PREF = [/lompoc theatre/i, /la purisima mission/i, /flower fields/i, /murals/i, /jalama/i]
const heroCandidates = []
for (const re of HERO_PREF) {
  const i = act.findIndex((a) => re.test(a.title || ""))
  if (i >= 0 && position.has(i)) heroCandidates.push(position.get(i))
}
if (!heroCandidates.length) heroCandidates.push(0)
console.log(`hero candidates: ${heroCandidates.map((i) => `"${titles[i]}"`).join(", ")}`)

const spec = {
  beats: beats(n),
  n,
  photos: files,
  heroCandidates,
  tilePool: files.map((_, i) => i),
}

for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  await renderShape(key, spec, photoDir)
}
fs.rmSync(photoDir, { recursive: true, force: true })
