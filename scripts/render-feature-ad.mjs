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
 * Two rules govern how a photograph meets the frame, because the pool is live data and nothing in
 * it says what a picture is of. First, the crop centres on measured edge energy rather than on the
 * geometric middle, so an off-centre subject stays in frame. Second, when a crop would throw away
 * more than half the picture — a 2:1 shop sign in a 9:16 frame, where no focal point can help —
 * the photo stops being cropped and is shown whole, full width, over a blurred blow-up of itself.
 * Nothing gets sliced past recognition in either shape.
 *
 * Sound is a synthesised pad (scripts/lib/music-bed.mjs), one chord per beat so the harmony turns
 * on the cut, resolving on the tonic over the end card. Both shapes carry the same mix at -14 LUFS.
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
import { buildBed } from "./lib/music-bed.mjs"

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

  // One photo per subject, and the title travels with it: the beats are cast by what a photo
  // shows (a rocket under "every launch"), which needs more than a bare URL.
  const pick = (rows, key) =>
    rows
      .map((r) => ({ title: r[key], url: (r.photos_json || []).map(photoUrl).find(Boolean) }))
      .filter((x) => x.url)
  const bizPhotos = pick(biz, "name")
  const actPhotos = pick(act, "title")

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
  // A photo that failed to download shifts every index after it, and the beats are cast by index —
  // so hand back where each surviving photo actually landed rather than leaving callers to guess.
  const files = []
  const position = new Map()
  kept.forEach((f, i) => {
    if (!f) return
    position.set(i, files.length)
    files.push(f)
  })
  return { files, position }
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
const LINE_HEIGHT = 1.08;
// Grain is texture, not an effect. At the old 0.055 it crawled visibly across the flat colour
// fields, which on a 4:5 feed video reads as compression noise.
const GRAIN_ALPHA = 0.03;
const MARK_ASPECT = 314 / 402;   // the SVG has a viewBox but no width/height

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

let MARK_W, PHOTOS = [], FOCUS = [], GRAIN, STOREFRONT = 0;

// How much of a photograph a full-bleed crop keeps: the short side of the frame against the
// long side of the picture. Below PLATE_MIN the crop is throwing away more than half the
// photo, at which point no focal point saves it — a shop sign that runs the full width of a
// 2:1 photograph cannot survive a 9:16 crop from any centre, so the picture stops being
// cropped and gets shown whole instead.
const FRAME_R = W/H;
const PLATE_MIN = 0.45;
const survives = img => { const r=img.width/img.height; return Math.min(r,FRAME_R)/Math.max(r,FRAME_R); };

/**
 * The widest business photo in the pool.
 *
 * Which photo is a storefront isn't recorded anywhere, but shape is a decent proxy: a building is
 * shot wide, a plate of food is shot square or tall. Measured here because only the browser knows
 * the pixel dimensions once the image has loaded.
 */
function widestIn([a,b]){
  let best=a, bestRatio=0;
  for(let i=a;i<b && i<PHOTOS.length;i++){
    const im=PHOTOS[i];
    if(!im || !im.height) continue;
    const r=im.width/im.height;
    if(r>bestRatio){ bestRatio=r; best=i; }
  }
  return best;
}

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

/**
 * object-fit: cover, centred on (fx,fy) of the source instead of on its geometric middle.
 *
 * The focal point is clamped, not obeyed: it can slide the crop anywhere inside the picture
 * but can never pull it past an edge and expose the background.
 */
function coverAt(img,x,y,w,h,fx,fy){
  if(!img) return;
  const s=Math.max(w/img.width,h/img.height);
  const dw=img.width*s, dh=img.height*s;
  const dx=Math.min(x, Math.max(x+w-dw, x+w/2-fx*dw));
  const dy=Math.min(y, Math.max(y+h-dh, y+h/2-fy*dh));
  g.drawImage(img,dx,dy,dw,dh);
}

/**
 * Where the subject of a photograph is.
 *
 * Nothing in the data records what a photo is *of*, so a crop can't be told where to look —
 * it has to work it out. Edge energy is a decent stand-in for subject: a rocket on a pad, a
 * shopfront, a row of campers carry dense detail; open sky and flat water carry almost none.
 * The centroid of that energy, pulled most of the way back toward the middle so one busy
 * corner can't yank the whole frame, is the point the crop centres on.
 *
 * Cheap by design — 72px wide, computed once per photo at load, never per frame.
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

/**
 * Lines fade up into place, one after another.
 *
 * The earlier version revealed word by word over a grey ghost of the finished line — so the whole
 * headline was on screen the entire time, half of it in the wrong colour, and it read as a
 * rendering fault rather than an effect. A line is either in its final colour or it isn't there.
 */
function reveal(text,{y,size,weight,colour,maxW,x,p,stagger,align}){
  const font=weight+' '+size+'px "Plus Jakarta Sans", sans-serif';
  const lines=wrapWords(text.split(' '),font,maxW);
  g.font=font; g.textBaseline='alphabetic'; g.textAlign='left';
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

/**
 * Where an uncroppable photograph goes instead — full width, sitting directly on top of the
 * headline, over a blurred blow-up of itself so the frame stays photographic rather than
 * turning into a letterbox. Returns null when a crop is safe and the photo should go
 * full-bleed as normal.
 */
function plateBox(img,top,headSize){
  if(!img || survives(img)>=PLATE_MIN) return null;
  const bottom=top-headSize*0.78-PAD*0.75, ceiling=H*0.07;
  let w=W, h=W*img.height/img.width;
  if(h>bottom-ceiling){ h=bottom-ceiling; w=h*img.width/img.height; }
  return {x:(W-w)/2, y:bottom-h, w, h};
}

function backdrop(img,p){
  // Zoomed well past the frame so the blur never samples off the edge of the picture, and
  // blurred hard enough that a textured source — a shingled wall behind a shop sign — reads
  // as a field of colour rather than as a smudged photograph.
  const s=lerp(1.34,1.42,easeInOut(p));
  g.save();
  g.filter='blur(72px)';
  g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
  coverAt(img,0,0,W,H,0.5,0.5);
  g.restore();
  g.fillStyle='rgba(18,10,22,0.56)'; g.fillRect(0,0,W,H);
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
  // A hair of push-in for life. Capped at 2%, which is a rounding error against the margin
  // any real sign leaves inside its own photograph.
  const s=lerp(1.0,1.02,easeInOut(p));
  const dw=box.w*s, dh=box.h*s;
  g.drawImage(img, box.x+(box.w-dw)/2, box.y+(box.h-dh)/2, dw, dh);
  g.restore();
  g.save();
  g.strokeStyle='rgba(255,255,255,0.12)'; g.lineWidth=2;
  g.strokeRect(box.x+1,box.y+1,box.w-2,box.h-2);
  g.restore();
}

/**
 * A neutral scrim, not a brand wash. Flooding the frame with purple or green turned a beach
 * into a purple beach and a rocket into a green rocket — the photographs are the whole
 * argument that this is a real town, so they keep their own colour. Only the strip the type
 * sits on gets darkened, and only enough to hold white text.
 */
function scrims(k){
  const grd=g.createLinearGradient(0,H*0.34,0,H);
  grd.addColorStop(0,'rgba(18,10,22,0)');
  grd.addColorStop(1,'rgba(18,10,22,'+(0.84*k).toFixed(3)+')');
  g.fillStyle=grd; g.fillRect(0,H*0.34,W,H*0.66);
  const t=g.createLinearGradient(0,0,0,H*0.16);
  t.addColorStop(0,'rgba(18,10,22,'+(0.34*k).toFixed(3)+')');
  t.addColorStop(1,'rgba(18,10,22,0)');
  g.fillStyle=t; g.fillRect(0,0,W,H*0.16);
}

function paintBeat(b,p){
  g.fillStyle=C[b.bg]||PURPLE; g.fillRect(0,0,W,H);

  const onDark = b.bg!=='cream' && b.bg!=='gold';
  const headColour = b.headColour ? C[b.headColour] : (onDark ? '#ffffff' : INK);

  // No mark in the corner. It used to sit top-left on every frame of the ad — six hundred frames
  // of the same logo in the same place, which reads as a watermark rather than as branding and
  // competes with the photograph underneath. The end card carries the mark and the name; that is
  // where an ad is supposed to sign itself.

  if(b.kind==='end'){
    const a=clamp01(p/0.20);
    g.save(); g.globalAlpha=a;
    const h=Math.round(W*0.22);
    g.drawImage(MARK_W,(W-h*MARK_ASPECT)/2,H*0.28,h*MARK_ASPECT,h);
    g.restore();
    // No tagline under the mark. The wordmark already reads LOCALS, so "made by locals, for
    // locals" put the word on screen three times in one frame — the same pile-up that had to be
    // cut out of the TV spot's ending. The url line is the whole sign-off.
    reveal(b.head,{y:H*0.56,size:Math.round(W*0.078),weight:'800',colour:GOLD,
      maxW:W-PAD*2,x:W/2,p,stagger:0.10,align:'center'});
    grain(GRAIN_ALPHA);
    return;
  }

  const headSize=b.big?Math.round(W*0.108):Math.round(W*0.086);
  const nLines=headLines(b.head,headSize);
  let blockH=nLines*headSize*LINE_HEIGHT;
  if(b.sub)  blockH+=Math.round(W*0.05)+Math.round(W*0.05);
  if(b.stat) blockH+=Math.round(W*0.19)*0.80+Math.round(W*0.056);

  // Photo beats anchor low so the picture stays visible; colour beats sit optically centred.
  const top = b.kind==='photo'
    ? H - PAD*1.5 - blockH + headSize*0.72
    : Math.max(H*0.22,(H-blockH)/2) + headSize*0.66;

  // The picture is painted after the type has been measured, because a photograph that has
  // to be shown whole is laid out around the words rather than behind them.
  if(b.kind==='photo'){
    const idx = b.photo==='storefront' ? STOREFRONT : b.photo;
    const at = idx%Math.max(1,PHOTOS.length);
    const img=PHOTOS[at];
    const box=plateBox(img,top,headSize);
    if(box){
      backdrop(img,p);
      scrims(0.5);
      plate(img,box,p);
    } else {
      // Slow push-in keeps a still photograph from feeling like a slide.
      // A beat's own focus:[x,y] overrides the measured focal point, for the day a photo
      // needs framing a machine can't guess.
      const f=b.focus ? {fx:b.focus[0], fy:b.focus[1]} : (FOCUS[at]||{fx:0.5,fy:0.5});
      const s=lerp(1.0,1.06,easeInOut(p));
      g.save();
      g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
      coverAt(img,0,0,W,H,f.fx,f.fy);
      g.restore();
      scrims(1);
    }
  }

  const used=reveal(b.head,{y:top,size:headSize,weight:'800',colour:headColour,
    maxW:W-PAD*2,x:PAD,p,stagger:0.10});

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

  grain(GRAIN_ALPHA);
}

const toBlob = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.94));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  // Nulls are kept, not filtered: the beats were cast against these positions in Node, and
  // dropping a failed image here would slide every photo after it into the wrong beat.
  PHOTOS = await Promise.all(spec.photos.map(f => load('/p/'+f)));
  FOCUS = PHOTOS.map(focusOf);
  STOREFRONT = widestIn(spec.bizRange);
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

    // Colour wipe across the seam: the next beat's field sweeps in over the current one, so a cut
    // lands as a deliberate change of colour rather than a dissolve.
    //
    // The direction alternates by beat. Every seam sweeping bottom-to-top gave the whole ad one
    // repeating gesture — six identical swipes read as a slideshow transition rather than as
    // deliberate cuts, and on a feed the eye starts predicting it by the third one.
    const next=spec.beats[idx+1];
    const toEnd=beat.dur-local;
    if(next && toEnd<WIPE){
      const w=easeInOut(1-toEnd/WIPE);
      g.fillStyle=C[next.bg]||PURPLE;
      const dir=idx%4;
      if(dir===0)      g.fillRect(0,H-H*w,W,H*w+2);   // up
      else if(dir===1) g.fillRect(0,0,W*w+2,H);       // in from the left
      else if(dir===2) g.fillRect(0,0,W,H*w+2);       // down
      else             g.fillRect(W-W*w,0,W*w+2,H);   // in from the right
    }

    const blob=await toBlob();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/**
 * Seven beats, and every one of them is either a photograph or a flat brand colour.
 *
 * The previous cut had eight beats across five colour fields, a 4×5 photo mosaic and a stack of
 * tilted polaroids — a different visual trick every three seconds. Each was fine alone; together
 * they read as a demo of what the renderer can do. What's left is one idea per beat: three
 * photographs carrying the three numbers, two flat colour statements, an open and an end.
 *
 * The argument, in order: you are missing things happening in your own town, and here is one
 * place where all of it lives. The three photo beats name a specific thing a resident misses —
 * the shop they've never noticed, the launch they could have watched, the places they drive
 * past — and the number underneath is the evidence that it is all already here. The numbers
 * are not a feature list; they are the receipt for "everything".
 *
 * Rule for the type: gold is for numbers and for the sub-line on a dark field. Nothing else.
 */
const beats = (n, cast) => [
  { kind: "open", bg: "purple", head: "Stop missing your own town.", sub: "It's all in one place.",
    subColour: "gold", big: true, dur: 2.6 },
  { kind: "photo", bg: "purple", photo: "storefront", head: "The shop two streets over.",
    stat: n.businesses.toLocaleString(), statColour: "gold", label: "Lompoc businesses, all of them here", dur: 3.2 },
  { kind: "photo", bg: "purple", photo: cast.launch, head: "The launch you could have watched.",
    stat: n.events.toLocaleString(), statColour: "gold", label: `coming up — ${n.launches} over the base`, dur: 3.2 },
  { kind: "photo", bg: "purple", photo: cast.land, head: "The places you drive past.",
    stat: n.photos.toLocaleString(), statColour: "gold", label: "real photos on the site, no stock", dur: 3.2 },
  { kind: "color", bg: "gold", head: "One place, not ten.", sub: "No more hunting Facebook groups.",
    headColour: "ink", subColour: "purple", dur: 2.6 },
  { kind: "color", bg: "green", head: "En inglés y en español.", sub: "Every page, both languages.",
    subColour: "gold", dur: 2.6 },
  { kind: "end", bg: "purple", head: "lompoclocals.com", dur: 2.8 },
]

/**
 * The bed under the picture.
 *
 * One chord per beat, changing on the cut, so a cut lands as a change of harmony as well as a
 * change of colour. I–V–vi–IV–I–V–I in A major: it opens on the tonic, travels, and comes home
 * on an authentic cadence over the end card, so the last chord is a resolution rather than a
 * fade-out that happened to run out of runtime.
 */
const CHORD_PER_BEAT = ["A", "E", "F#m", "D", "A", "E", "A"]

async function renderShape(key, spec, photoDir, bedPath) {
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
  // A silent upload gets demoted on both platforms, and a viewer who taps for sound gets
  // nothing back. The bed is built once for both shapes and cut to the same length as the
  // picture, so neither stream has to be trimmed against the other.
  const audio = bedPath ? ["-i", bedPath] : []
  const code = await new Promise((r) => {
    const ff = spawn(ffmpegPath, [
      "-y", "-framerate", String(FPS),
      "-i", path.join(frameDir, "f-%05d.jpg"),
      ...audio,
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
  console.log(`  ✓ ${name.padEnd(36)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB` +
    (bedPath ? "  + music" : "  (silent)"))
}

const { n, bizPhotos, actPhotos } = await gather()
console.log("live numbers:", n)
const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "ad-photos-"))
const all = [...bizPhotos, ...actPhotos]
const { files, position } = await cachePhotos(all.map((x) => x.url), photoDir)
console.log(`photos: ${files.length} of ${all.length} cached`)

/**
 * Cast the three photo beats by what the photograph shows.
 *
 * Indexing into an md5-ordered pool put a close-up of a plate of sushi under "every business in
 * town" and a rocket under "real photos of real places" — both true, neither composed. Matching on
 * the subject's own title is still live data; it just stops the running order deciding the images.
 */
const actAt = (re, taken = []) => {
  const i = actPhotos.findIndex((a, k) => re.test(a.title) && !taken.includes(k))
  return i < 0 ? null : { key: i, at: position.get(bizPhotos.length + i) ?? null }
}
const launch = actAt(/launch|vandenberg|rocket|space/i)
const land = actAt(/beach|dune|park|valley|trail|river|lake|bluff|garden|flower|ranch|hill/i, [launch?.key])
const cast = {
  // The business beat wants a storefront, and nothing in the data says which photo is one — so the
  // player picks the widest business photo at load time. A wide frame is a building; a square one
  // is usually a plate of food.
  bizRange: [0, position.get(bizPhotos.length) ?? files.length],
  launch: launch?.at ?? 0,
  land: land?.at ?? 0,
}
console.log(`cast: launch="${launch ? actPhotos[launch.key].title : "—"}" ` +
  `place="${land ? actPhotos[land.key].title : "—"}"\n`)

const spec = { beats: beats(n, cast), photos: files, bizRange: cast.bizRange }

// The bed is scheduled against the cut, so it is built from the same beat list the picture is.
const total = spec.beats.reduce((a, b) => a + b.dur, 0)
const schedule = spec.beats.map((b, i) => ({ chord: CHORD_PER_BEAT[i % CHORD_PER_BEAT.length], dur: b.dur }))
const accentAt = []
let mark = 0
schedule.forEach((s, i) => {
  mark += s.dur
  if (i < schedule.length - 1) accentAt.push({ at: mark, chord: schedule[i + 1].chord })
})
const audioDir = fs.mkdtempSync(path.join(os.tmpdir(), "ad-audio-"))
const bedPath = path.join(audioDir, "bed.wav")
await buildBed({ out: bedPath, schedule, total, lufs: -14, accentAt })

for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  await renderShape(key, spec, photoDir, bedPath)
}
fs.rmSync(photoDir, { recursive: true, force: true })
fs.rmSync(audioDir, { recursive: true, force: true })
