#!/usr/bin/env node
/**
 * The "wow" cut of the platform ad — same argument, cinematic grammar.
 *
 * The restrained cut (render-feature-ad.mjs) treats seven beats equally and sits silent. This one
 * is built like a product commercial: one idea per beat, motion that reads as physical rather than
 * decorative, and a build into the end card.
 *
 * What it argues, in order: you keep hearing about your own town too late → now it's all in one
 * place, and here is the evidence → the scatter it replaces → both languages, because it's the
 * whole town → stop missing your own town. The numbers are proof the hub is complete, not specs.
 *
 * The four techniques doing the work:
 *   • Count-ups. Every stat ticks from nothing to the live figure on an ease-out, drawn on a fixed
 *     digit grid so the number settles instead of jittering as digits and commas arrive.
 *   • Push transitions. Seams are not wipes: the outgoing beat and the incoming one travel together,
 *     always leftward, so the film has one consistent direction of travel. The last seam breaks that
 *     and lifts vertically — the only direction change in the film, which is what makes the end card
 *     feel like arrival.
 *   • Masked type. Lines rise out from behind a clipping edge on a quintic ease. Nothing fades in.
 *   • A build. Colour beats shorten, then a six-cut montage under one held line, then the lift.
 *
 * Photo framing is the other thing this cut fixes. The old one cover-cropped a wide storefront into
 * a 9:16 frame and sliced the business name off both edges. Here the business beat is a full-width
 * panel on a colour field: the image is never cropped horizontally, only vertically, so signage
 * survives in both shapes. Full-bleed is kept for the rocket and the landscape, whose subjects are
 * centred and large enough to take a crop.
 *
 * Same two headless-Chrome facts every renderer here works around (see lib/video-frames.mjs):
 * MediaRecorder returns empty video in headless, and requestAnimationFrame never fires — so frames
 * are painted on a step loop, POSTed out as JPEGs, and encoded by ffmpeg.
 *
 * Both languages are cut, not dubbed. Lompoc is 63.4% Hispanic, so Spanish is a majority-audience
 * language here rather than a translation pass — and most people read the screen instead of the
 * caption, which makes a Spanish read over English lettering a film that reaches nobody properly.
 * Every word on screen comes from COPY, keyed by language, so the two cuts cannot drift apart.
 *
 * Usage:
 *   node scripts/render-feature-ad-wow.mjs              # English, both shapes
 *   node scripts/render-feature-ad-wow.mjs --lang=es    # Spanish, both shapes
 *   node scripts/render-feature-ad-wow.mjs --lang=en,es --only=tt
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
  ig: { w: 1080, h: 1350, tag: "4x5" },
  tt: { w: 1080, h: 1920, tag: "9x16" },
}
const outName = (lang, tag) => `lompoc-locals-features-wow-${lang}-${tag}.mp4`
// The English cut also keeps its original filename. master-commercial.mjs lays both narrations over
// that exact file, and renaming it out from under that script would break the master silently.
const legacyName = (tag) => `lompoc-locals-features-wow-${tag}.mp4`

const arg = (flag, fallback) =>
  (process.argv.find((a) => a.startsWith(`--${flag}=`)) || `--${flag}=${fallback}`)
    .slice(flag.length + 3).split(",").map((s) => s.trim()).filter(Boolean)

const ONLY = arg("only", "")
const LANGS = arg("lang", "en")

const SEAM = 0.42 // how long a push transition takes

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
  const [[b], [e], [l], [p]] = await Promise.all([
    sql`select count(*)::int n from businesses where status='approved'`,
    sql`select count(*)::int n from events where status='approved' and starts_at > now()`,
    sql`select count(*)::int n from events
        where status='approved' and starts_at > now() and title ilike '%rocket launch%'`,
    sql`select sum(jsonb_array_length(coalesce(photos_json,'[]'::jsonb)))::int n
        from businesses where status='approved'`,
  ])

  // md5 ordering, not random: the same run twice produces the same ad. Thrift and consignment
  // shops are excluded from the pool — a resale storefront under "your whole town, one place"
  // undersold the beat — and food-and-drink storefronts sort first, because the panel picker
  // works by aspect ratio and should find an inviting one before it finds anything else.
  const biz = await sql`select name, photos_json from businesses
    where status='approved' and jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 3
      and name !~* 'thrift|second.?hand|consign|pawn'
      and name !~* 'starbucks|mcdonald|subway|domino|pizza hut|taco bell|burger king|carl.?s jr|jack in the box|kfc|wendy|little caesars|panda express|ihop|denny|walmart|target|albertsons|vons|grocery outlet|rite aid|cvs|walgreens|7.eleven|dollar (tree|general)|autozone|o.?reilly|napa auto|big 5|ross|marshalls'
    order by (name ~* 'grill|coffee|caf|bak|restaurant|saloon|taproom|winery|market|florist|garden') desc,
      md5(slug) limit 40`
  const act = await sql`select title, photos_json from activities
    where jsonb_array_length(coalesce(photos_json,'[]'::jsonb)) >= 1 order by md5(slug) limit 14`

  const pick = (rows, key) =>
    rows
      .map((r) => ({ title: r[key], url: (r.photos_json || []).map(photoUrl).find(Boolean) }))
      .filter((x) => x.url)

  return {
    n: { businesses: b.n, events: e.n, launches: l.n, photos: p.n },
    bizPhotos: pick(biz, "name"),
    actPhotos: pick(act, "title"),
  }
}

/** Downloads each photo once so the player can load them same-origin (a tainted canvas can't toBlob). */
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
<style>html,body{margin:0;background:#241629;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS}, SEAM=${SEAM};
const spec = ${JSON.stringify(spec)};
const out = document.getElementById('c'), outCtx = out.getContext('2d');
// Two scratch buffers so a push transition can hold both beats at once.
const bufA = document.createElement('canvas'), bufB = document.createElement('canvas');
bufA.width=bufB.width=W; bufA.height=bufB.height=H;
// Everything paints through 'g'. Swapping it is what lets one paint routine serve the visible
// canvas and the two transition buffers without every helper taking a context argument.
let g = outCtx;

const CREAM='#FAF5EC', INK='#241629', PURPLE='#650C75', GOLD='#EFC618', GREEN='#0B992F';
const C = {cream:CREAM, ink:INK, purple:PURPLE, gold:GOLD, green:GREEN, white:'#ffffff'};

const clamp01   = t => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp      = (a,b,t) => a + (b-a)*t;
const easeOut   = t => 1 - Math.pow(1 - t, 3);
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
const easeInOut = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
// A settle with about 5% overshoot — enough that arrivals have mass, not enough to read as a bounce.
const settle = t => t>=1 ? 1 : 1 - Math.pow(2,-9*t)*Math.cos(t*Math.PI*2.1);

const TALL = H/W > 1.5;
const PAD = Math.round(W * 0.088);
// TikTok and Reels paint the username, caption and action rail over the bottom of a 9:16 frame.
// PAD*2 leaves the stat label 190px up — inside that band, so the number's own caption gets
// covered by the platform's. The 4:5 feed frame has no such furniture, so it keeps PAD*2.
const SAFE_BOTTOM = TALL ? Math.round(H * 0.17) : PAD * 2;
const LINE_HEIGHT = 1.06;
const GRAIN_ALPHA = 0.03;
const MARK_ASPECT = 314 / 402;   // the SVG has a viewBox but no width/height

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});
const log = m => fetch('/log',{method:'POST',body:m});

let MARK_W, PHOTOS = [], GRAIN, PANEL = 0, MONTAGE = [];

const ratio = im => (im && im.height) ? im.width/im.height : 0;

/**
 * The best storefront candidate in a range.
 *
 * Which photo is a storefront isn't recorded anywhere, and the old heuristic — widest wins — is
 * exactly the photo that suffers most in a tall crop. A building sits between about 4:3 and 2:1;
 * anything wider is a panorama that would have to be cropped to nothing, anything squarer is
 * usually a plate of food. So: widest inside the band, and only fall back outside it.
 */
function storefrontIn([a,b]){
  let best=-1, bestR=0, fall=-1, fallR=0;
  for(let i=a;i<b && i<PHOTOS.length;i++){
    const r=ratio(PHOTOS[i]); if(!r) continue;
    if(r>=1.15 && r<=2.05){ if(r>bestR){ bestR=r; best=i; } }
    else if(r>fallR){ fallR=r; fall=i; }
  }
  return best>=0 ? best : Math.max(0,fall);
}

/** Any montage slot the Node side couldn't cast falls back to whatever crops best in this shape. */
function bestFit(count, taken){
  const target = W/H;
  return PHOTOS.map((im,i)=>({i, r:ratio(im)}))
    .filter(x => x.r && !taken.includes(x.i))
    .sort((a,b)=> Math.abs(Math.log(a.r/target)) - Math.abs(Math.log(b.r/target)))
    .slice(0,count).map(x=>x.i);
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

/** object-fit: cover, with a scale and a drift for parallax. dy is a fraction of the box height. */
function cover(img,x,y,w,h,scale,dy){
  if(!img) return;
  const s=Math.max(w/img.width,h/img.height)*(scale||1);
  const dw=img.width*s, dh=img.height*s;
  g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip();
  g.drawImage(img, x+(w-dw)/2, y+(h-dh)/2+(dy||0)*h, dw, dh);
  g.restore();
}

function wrapWords(text,font,maxW){
  g.font=font;
  const lines=[[]];
  for(const w of text.split(' ')){
    const test=[...lines[lines.length-1],w].join(' ');
    if(g.measureText(test).width>maxW && lines[lines.length-1].length) lines.push([w]);
    else lines[lines.length-1].push(w);
  }
  return lines.map(l=>l.join(' '));
}
const widestOf = (lines,font) => { g.font=font; return Math.max(...lines.map(l=>g.measureText(l).width)); };

/**
 * Even out a bad rag.
 *
 * Greedy wrapping is fine at English lengths, but Spanish runs 15–25% longer for the same meaning
 * and regularly spills one short word onto a line of its own. Re-wrapping at the NARROWEST width
 * that still produces the same number of lines redistributes the words without costing a line.
 *
 * Only applied when the last line is under a third of the widest one. A long word alone on line two
 * ("scattered.") is a legitimate rag, and rewrapping every headline would change the English cut for
 * no reason — the English film is already approved.
 */
function ragFix(text,font,maxW,lines){
  if(lines.length<2) return lines;
  g.font=font;
  const w=lines.map(l=>g.measureText(l).width);
  if(w[w.length-1] > Math.max.apply(null,w)*0.34) return lines;
  let lo=0, hi=maxW;
  for(let i=0;i<20;i++){
    const mid=(lo+hi)/2;
    if(wrapWords(text,font,mid).length<=lines.length) hi=mid; else lo=mid;
  }
  const fixed=wrapWords(text,font,hi);
  return fixed.length===lines.length ? fixed : lines;
}

/** The largest size at or below the start size that wraps into maxLines and stays inside maxW. */
function fitLines(text,weight,maxW,size,maxLines,floor){
  let s=size;
  for(;;){
    const font=weight+' '+s+'px "Plus Jakarta Sans", sans-serif';
    const lines=wrapWords(text,font,maxW);
    if((lines.length<=maxLines && widestOf(lines,font)<=maxW) || s<=floor)
      return {size:s, lines:ragFix(text,font,maxW,lines)};
    s=Math.max(floor,Math.round(s*0.94));
  }
}

/**
 * One line, shrunk to fit — the sub-lines and stat labels are single-line by design.
 *
 * Canvas advance widths scale linearly with font size, so the size that fits is one measurement
 * rather than a search. Below the floor the line wraps instead of getting too small to read: the
 * Spanish stat labels are the longest strings in the film and would otherwise run off the frame.
 */
function fitSingle(text,weight,maxW,size,floor){
  g.font=weight+' '+size+'px "Plus Jakarta Sans", sans-serif';
  const w=g.measureText(text).width;
  const s = w<=maxW ? size : Math.max(floor,Math.floor(size*maxW/w));
  const font=weight+' '+s+'px "Plus Jakarta Sans", sans-serif';
  g.font=font;
  const lines = g.measureText(text).width<=maxW
    ? [text] : ragFix(text,font,maxW,wrapWords(text,font,maxW));
  return {size:s, lines};
}

/**
 * Lines rise out from behind a clipping edge, one after the next.
 *
 * No fade: a line is either behind its edge or it has arrived. That is what gives type mass —
 * a fade reads as a slide deck, a masked rise reads as something moving into place.
 */
function riseLines(lines,{x,y,size,weight,colour,align,p,stagger,dur}){
  const font=weight+' '+size+'px "Plus Jakarta Sans", sans-serif';
  const lh=size*LINE_HEIGHT;
  g.textBaseline='alphabetic'; g.textAlign='left';
  lines.forEach((str,i)=>{
    const t=clamp01((p - i*stagger)/(dur||0.30));
    if(t<=0) return;
    const yy=y+i*lh, off=(1-easeOutQuint(t))*size*1.12;
    g.save();
    g.beginPath(); g.rect(0,yy-size*1.08,W,size*1.48); g.clip();
    g.font=font; g.fillStyle=colour;
    const xx = align==='center' ? x-g.measureText(str).width/2 : x;
    g.fillText(str,xx,yy+off);
    g.restore();
  });
  return lines.length*lh;
}

/**
 * A counting number on a fixed digit grid.
 *
 * Proportional digits change width as the value climbs, so a naive count-up shivers for its whole
 * run and the comma arriving shunts everything sideways. Every digit is drawn centred in a cell the
 * width of a zero, and the comma keeps its own narrow cell whether or not it is showing yet — so
 * each character lands in the position it will hold at rest.
 */
function countText(v,target){
  const td=String(target);
  let cd=String(v);
  cd=' '.repeat(Math.max(0,td.length-cd.length))+cd.slice(-td.length);
  const out=[];
  for(let i=0;i<cd.length;i++){
    out.push({ch:cd[i],cell:true});
    const after=cd.length-i-1;
    if(after>0 && after%3===0) out.push({ch: cd[i]===' ' ? ' ' : ',', cell:false});
  }
  return out;
}
function drawCount(v,target,x,y,size,colour){
  const font='800 '+size+'px "Plus Jakarta Sans", sans-serif';
  g.font=font; g.fillStyle=colour; g.textAlign='left'; g.textBaseline='alphabetic';
  const cell=g.measureText('0').width, comma=g.measureText(',').width;
  let cx=x;
  for(const tk of countText(v,target)){
    const w = tk.cell ? cell : comma;
    if(tk.ch!==' '){
      const cw=g.measureText(tk.ch).width;
      g.fillText(tk.ch, cx+(w-cw)/2, y);
    }
    cx+=w;
  }
  return cx-x;
}

const HEAD_W = () => W - PAD*2;

/**
 * Type block geometry, shared by the panel beat (which needs to know its height in advance).
 *
 * Every string is fitted rather than trusted. The headline sizes are tuned to the English lines, and
 * the Spanish equivalents are longer — so the head shrinks up to 28% before it would take a third
 * line, and the sub and the stat label shrink before they would reach the frame edge.
 */
function blockMetrics(b){
  const headStart = Math.round(W*(b.big ? 0.104 : b.kind==='panel' ? (TALL?0.080:0.072) : 0.084));
  const head = fitLines(b.head,'800',HEAD_W(),headStart,2,Math.round(headStart*0.72));
  const statSize = Math.round(W*(TALL?0.185:0.155));
  const label = b.label ? fitSingle(b.label,'600',HEAD_W(),Math.round(W*0.036),Math.round(W*0.027)) : null;
  const sub   = b.sub   ? fitSingle(b.sub,'700',HEAD_W(),Math.round(W*0.050),Math.round(W*0.038)) : null;
  let h = head.lines.length*head.size*LINE_HEIGHT;
  if(b.stat) h += Math.round(W*0.045) + statSize*0.74 + Math.round(W*0.052)
                + (label.lines.length-1)*label.size*LINE_HEIGHT;
  if(b.sub)  h += Math.round(W*0.10) + (sub.lines.length-1)*sub.size*LINE_HEIGHT;
  return {headSize:head.size, lines:head.lines, statSize, label, sub, h};
}

/** Headline, then the counting stat, then its label — strictly in that order, never at once. */
function drawTypeBlock(b,p,top,m,onDark){
  const headColour = b.headColour ? C[b.headColour] : (onDark ? '#ffffff' : INK);
  const used = riseLines(m.lines,{x:PAD,y:top,size:m.headSize,weight:'800',
    colour:headColour,p,stagger:0.075,dur:0.30});

  if(b.stat){
    // Nothing is drawn before the count starts. An earlier pass faded the digits in first, which
    // parked a lone "0" under the headline for two thirds of a second and read as a bug.
    const t=clamp01((p-0.20)/(1.15/b.dur));
    const v=t>=1 ? b.stat : Math.floor(b.stat*easeOutQuint(t));
    const sy=top+used+Math.round(W*0.045)+m.statSize*0.74;
    // The number does not slide and does not fade — it counts. One motion.
    if(v>0) drawCount(v,b.stat,PAD,sy,m.statSize,C[b.statColour]||GOLD);
    const la=clamp01((p-0.44)/0.24);
    if(la>0){
      g.save(); g.globalAlpha=la;
      g.fillStyle = onDark ? 'rgba(255,255,255,0.86)' : 'rgba(36,22,41,0.66)';
      g.font='600 '+m.label.size+'px "Plus Jakarta Sans", sans-serif';
      m.label.lines.forEach((s,i)=>
        g.fillText(s,PAD,sy+Math.round(W*0.052)+i*m.label.size*LINE_HEIGHT));
      g.restore();
    }
  }

  if(b.sub){
    const a=clamp01((p-0.30)/0.26);
    if(a>0){
      g.save(); g.globalAlpha=a;
      g.fillStyle=C[b.subColour]||(onDark?GOLD:PURPLE);
      const size=m.sub.size;
      g.font='700 '+size+'px "Plus Jakarta Sans", sans-serif';
      const y0=top+used+Math.round(W*0.062);
      m.sub.lines.forEach((s,i)=>{
        const yy=y0+i*size*LINE_HEIGHT;
        g.save();
        g.beginPath(); g.rect(0,yy-size*1.08,W,size*1.42); g.clip();
        g.fillText(s,PAD,yy+(1-easeOutQuint(a))*size*0.9);
        g.restore();
      });
      g.restore();
    }
  }
}

/** The bottom scrim that lets white type sit on a photograph without a brand wash over the image. */
function scrim(from,to){
  const grd=g.createLinearGradient(0,H*from,0,H);
  grd.addColorStop(0,'rgba(18,10,22,0)');
  grd.addColorStop(1,'rgba(18,10,22,'+to+')');
  g.fillStyle=grd; g.fillRect(0,H*from,W,H*(1-from));
}

function paintBeat(b,p){
  g.fillStyle=C[b.bg]||PURPLE; g.fillRect(0,0,W,H);
  const onDark = b.bg!=='cream' && b.bg!=='gold';

  if(b.kind==='open'){
    // The film opens on ink and the purple floods up into it. One gesture, half a second, and it
    // stops the first frame being a flat colour card sitting there waiting for text.
    const f=easeInOut(clamp01(p/(0.55/b.dur)));
    g.fillStyle=INK; g.fillRect(0,0,W,H);
    g.fillStyle=PURPLE; g.fillRect(0,H-H*f,W,H*f+2);
  }

  if(b.kind==='panel'){
    // Full width, natural aspect: the image is never cropped horizontally, so a shopfront sign
    // survives in both shapes. Only the height gets clipped, and only when the type needs the room.
    const img=PHOTOS[PANEL];
    const m=blockMetrics(b);
    const natural = img ? W/ratio(img) : H*0.5;
    // 7% shorter than the image's natural height at full width. That shortfall is the entire
    // headroom for the drift: cover then scales to the WIDTH, never the height, so the sides of the
    // photograph are never touched no matter how far it travels vertically.
    const panelH = Math.min(natural*0.90, TALL ? H*0.58 : H*0.46);
    const gap = Math.round(W*0.10);
    const total = panelH + gap + m.h;
    const top = Math.max(PAD*0.7,(H-total)/2);
    // No fade on the image: the panel is what makes this beat's push transition visible, so it has
    // to be fully there the moment the beat starts travelling in from the right edge.
    const rise = (1-easeOutQuint(clamp01(p/0.34)))*Math.round(W*0.030);
    cover(img,0,top+rise,W,panelH,1,lerp(-0.048,0.048,easeInOut(p)));
    drawTypeBlock(b,p,top+panelH+gap+m.headSize*0.80,m,onDark);
    grain(GRAIN_ALPHA);
    return;
  }

  if(b.kind==='photo' || b.kind==='flash'){
    let img, q=p;
    if(b.kind==='flash'){
      const slice=1/b.cuts, k=Math.min(b.cuts-1,Math.floor(p/slice));
      img=PHOTOS[MONTAGE[k%MONTAGE.length]];
      q=(p-k*slice)/slice;
    } else {
      img=PHOTOS[b.photo%Math.max(1,PHOTOS.length)];
    }
    // Slow push with a touch of vertical drift: the photograph moves, the type doesn't. That
    // difference is the parallax — a zoom on its own just reads as a zoom.
    const s = b.kind==='flash' ? lerp(1.03,1.10,q) : lerp(1.0,1.085,easeInOut(q));
    const dy = b.kind==='flash' ? 0 : lerp(-0.02,0.02,easeInOut(q));
    cover(img,0,0,W,H,s,dy);
    // A neutral scrim, not a brand wash: the photographs are the whole argument that this is a
    // real town, so they keep their own colour. Only the strip the type sits on gets darkened.
    scrim(0.34,0.84);
    const topGrd=g.createLinearGradient(0,0,0,H*0.16);
    topGrd.addColorStop(0,'rgba(18,10,22,0.30)'); topGrd.addColorStop(1,'rgba(18,10,22,0)');
    g.fillStyle=topGrd; g.fillRect(0,0,W,H*0.16);
  }

  if(b.kind==='end'){
    // A soft lift behind the mark. It reads as depth on a flat field, not as a glow effect.
    const rg=g.createRadialGradient(W/2,H*0.42,0,W/2,H*0.42,W*0.85);
    rg.addColorStop(0,'rgba(255,255,255,0.10)'); rg.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=rg; g.fillRect(0,0,W,H);

    const markH=Math.round(W*(TALL?0.24:0.20));
    const markTop=H*(TALL?0.33:0.30);
    const sc=lerp(0.86,1,settle(clamp01(p/0.34)));
    g.save();
    g.globalAlpha=clamp01(p/0.10);
    g.translate(W/2,markTop+markH/2); g.scale(sc,sc);
    g.drawImage(MARK_W,-markH*MARK_ASPECT/2,-markH/2,markH*MARK_ASPECT,markH);
    g.restore();

    // A gold hairline opens from the centre, then the domain rises through it. Sequential, so the
    // eye is led rather than asked to watch two things.
    const ruleY=markTop+markH+Math.round(W*0.070);
    const rw=easeOut(clamp01((p-0.26)/0.22))*W*0.22;
    if(rw>0){ g.fillStyle=GOLD; g.fillRect(W/2-rw/2,ruleY,rw,3); }

    riseLines(['lompoclocals.com'],{x:W/2,y:ruleY+Math.round(W*0.130),size:Math.round(W*0.082),
      weight:'800',colour:GOLD,align:'center',p:p-0.34,stagger:0,dur:0.30});

    const ta=clamp01((p-0.56)/0.26);
    if(ta>0){
      const k=fitSingle(spec.kicker,'600',HEAD_W(),Math.round(W*0.036),Math.round(W*0.028));
      g.save(); g.globalAlpha=ta; g.textAlign='center';
      g.fillStyle='rgba(255,255,255,0.90)';
      g.font='600 '+k.size+'px "Plus Jakarta Sans", sans-serif';
      k.lines.forEach((s,i)=>
        g.fillText(s,W/2,ruleY+Math.round(W*0.215)+i*k.size*LINE_HEIGHT));
      g.textAlign='left'; g.restore();
    }
    grain(GRAIN_ALPHA);
    return;
  }

  const m=blockMetrics(b);
  // Photo beats anchor low so the picture stays visible; colour beats sit optically centred.
  // m.h runs first baseline to last baseline, so the bottom margin is exactly PAD*2 — the previous
  // version added the headline ascent on top of that and pushed the stat label off the bottom edge.
  const top = (b.kind==='photo'||b.kind==='flash')
    ? H - SAFE_BOTTOM - m.h
    : Math.max(H*0.24,(H-m.h)/2) + m.headSize*0.72;
  drawTypeBlock(b,p,top,m,onDark);
  grain(GRAIN_ALPHA);
}

const toBlob = () => new Promise(r => out.toBlob(r,'image/jpeg',0.94));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  // Nulls are kept, not filtered: the beats were cast against these positions in Node, and dropping
  // a failed image here would slide every photo after it into the wrong beat.
  PHOTOS = await Promise.all(spec.photos.map(f => load('/p/'+f)));
  PANEL = storefrontIn(spec.bizRange);
  GRAIN = makeGrain();
  await document.fonts.load('800 200px "Plus Jakarta Sans"');
  await document.fonts.load('600 40px "Plus Jakarta Sans"');
  await document.fonts.ready;

  const cuts = spec.beats.find(b=>b.kind==='flash').cuts;
  const hero = spec.beats.filter(b=>b.kind==='photo').map(b=>b.photo).concat([PANEL]);
  MONTAGE = spec.montage.filter(i => PHOTOS[i]).slice(0,cuts);
  if(MONTAGE.length < cuts) MONTAGE = MONTAGE.concat(bestFit(cuts-MONTAGE.length, hero.concat(MONTAGE)));
  const dims = i => PHOTOS[i] ? PHOTOS[i].width+'x'+PHOTOS[i].height : 'missing';
  log(W+'x'+H+' panel='+spec.titles[PANEL]+' ('+dims(PANEL)+')\\n  · montage='+
    MONTAGE.map(i=>spec.titles[i]).join(' / '));

  const total=spec.beats.reduce((a,b)=>a+b.dur,0);
  const frames=Math.round(total*FPS);

  for(let i=0;i<frames;i++){
    const t=i/FPS;
    let acc=0, idx=0;
    for(let k=0;k<spec.beats.length;k++){
      if(t < acc+spec.beats[k].dur){ idx=k; break; }
      acc+=spec.beats[k].dur; idx=k;
    }
    const beat=spec.beats[idx], local=t-acc;
    const next=spec.beats[idx+1];
    const toEnd=beat.dur-local;
    // Nothing pushes INTO the montage — that cut is meant to land hard, on the drop. The montage
    // does push out, vertically, and that lift is the film's only change of direction.
    const pushes = next && toEnd<SEAM && next.kind!=='flash';

    if(pushes){
      const e=easeInOut(1-toEnd/SEAM);
      g=bufA.getContext('2d'); paintBeat(beat,local/beat.dur);
      g=bufB.getContext('2d'); paintBeat(next,0);
      g=outCtx;
      g.fillStyle='#241629'; g.fillRect(0,0,W,H);
      // Everything travels left through the film. The one exception is the lift into the end
      // card — the only change of direction, which is what makes it read as arrival.
      if(next.kind==='end'){
        g.drawImage(bufA,0,Math.round(-H*e));
        g.drawImage(bufB,0,Math.round(H-H*e));
      } else {
        g.drawImage(bufA,Math.round(-W*e),0);
        g.drawImage(bufB,Math.round(W-W*e),0);
      }
    } else {
      g=outCtx;
      paintBeat(beat,local/beat.dur);
    }

    const blob=await toBlob();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/**
 * Every word on screen, both languages, in one table.
 *
 * Keyed by beat so a line and its counterpart sit on adjacent rows: that is the only thing that
 * stops the two cuts drifting as copy gets revised. The Spanish is written, not translated —
 * Mexican Spanish as it is actually spoken on the Central Coast, ustedes never vosotros, and phrased
 * for the punch rather than the words ("andaba todo regado" for scattered, "hasta después" for the
 * beat you always hear about a thing too late).
 *
 * Beat 6 is the one beat that is not the same argument twice. "En inglés y en español" is a promise
 * made TO an English speaker; a Spanish speaker does not need to be told the site has English. The
 * Spanish cut makes the same point from the other side — the whole site is theirs too — and both
 * land on the same closing line, that the town belongs to everyone.
 */
const COPY = {
  en: {
    open:  { head: "Something’s always happening.", sub: "You hear about it after." },
    biz:   { head: "Your whole town, one place.", sub: "The restaurants. The shops. The one-of-a-kinds." },
    event: { head: "Know before it happens.", sub: "Every event. Every launch. Every weekend." },
    photo: { head: "Find your next favorite spot.", sub: "See it before you go." },
    was:   { head: "It used to be scattered.", sub: "Flyers. Group chats. Word of mouth." },
    both:  { head: "En inglés y en español.", sub: "Because it’s everyone’s town." },
    flash: { head: "Stop missing your own town." },
    end:   { kicker: "Know what’s going on." },
  },
  es: {
    open:  { head: "Siempre está pasando algo.", sub: "Y uno se entera hasta después." },
    biz:   { head: "Todo tu pueblo, en un solo lugar.", sub: "Los restaurantes. Las tiendas. Los rincones únicos." },
    event: { head: "Entérate antes, no después.", sub: "Cada evento. Cada lanzamiento. Cada fin de semana." },
    photo: { head: "Encuentra tu nuevo lugar favorito.", sub: "Míralo antes de ir." },
    was:   { head: "Antes andaba todo regado.", sub: "Volantes. Chats de grupo. De boca en boca." },
    both:  { head: "Toda la página, también en español.", sub: "Porque el pueblo es de todos." },
    flash: { head: "No te quedes fuera de tu pueblo." },
    end:   { kicker: "Entérate de lo que pasa." },
  },
}

/**
 * Eight beats, and the argument runs: you hear about your own town too late → now it is all in one
 * place, and here is the proof → this is what it replaces → both languages, because it is the whole
 * town → stop missing it → where to go.
 *
 * No numbers anywhere. The counters looked like proof but aged the moment they rendered, and a
 * narration recorded against one day's figures disagreed with the next render's screen. The film
 * now argues in benefits only, so the picture and any read stay true indefinitely.
 *
 * Rule for the type: gold is for the sub-line on a dark field. Nothing else.
 */
const beats = (n, cast, lang) => {
  const t = COPY[lang]
  return [
    { kind: "open", bg: "purple", big: true, dur: 2.8,
      head: t.open.head, sub: t.open.sub, subColour: "gold" },

    { kind: "panel", bg: "purple", photo: "storefront", dur: 3.4,
      head: t.biz.head, sub: t.biz.sub },

    { kind: "photo", bg: "purple", photo: cast.launch, dur: 3.3,
      head: t.event.head, sub: t.event.sub },

    { kind: "photo", bg: "purple", photo: cast.land, dur: 3.3,
      head: t.photo.head, sub: t.photo.sub },

    { kind: "color", bg: "gold", dur: 2.3,
      head: t.was.head, sub: t.was.sub, headColour: "ink", subColour: "purple" },

    { kind: "color", bg: "green", dur: 2.3,
      head: t.both.head, sub: t.both.sub, subColour: "gold" },

    { kind: "flash", bg: "purple", dur: 1.8, cuts: 6, head: t.flash.head },

    { kind: "end", bg: "purple", dur: 3.2 },
  ]
}

/* ── audio ─────────────────────────────────────────────────────────────────────────────────── */

function run(args) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

/**
 * The bed, plus the two things that make motion audible.
 *
 * A push transition with no sound is a slide; with a short filtered-noise sweep under it, it reads
 * as something physically moving past. One sweep per seam, quiet enough that you feel it rather
 * than hear it. The end card gets a single bell — E, B, E — which is the V of the bed's key, so it
 * resolves rather than sits on top.
 *
 * The build is two things. A low tone swells through the last two seconds before the montage and
 * cuts dead on the hard cut into it, which is what makes that cut land as a drop rather than as an
 * edit. And the bed itself lifts about 6dB from there through the sign-off — the generated pad is
 * flat by design, and measuring the first mix showed the montage arriving at the same level as
 * everything before it, which is the one thing a crescendo cannot do.
 */
async function buildAudio(total, seams, swellAt, riseAt, bellAt, dest) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "adwow-audio-"))
  const bed = path.join(tmp, "bed.wav")

  // Generated four chords longer than needed: make-music-bed fades its own tail out over the last
  // three seconds, and that is exactly where this film wants its biggest moment.
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath,
      [path.join(REPO, "scripts/make-music-bed.mjs"), bed, String(Math.ceil(total) + 6)],
      { stdio: "ignore" })
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`music bed failed (${c})`))))
  })

  const whoosh = path.join(tmp, "whoosh.wav")
  let r = await run(["-y", "-f", "lavfi", "-i", "anoisesrc=d=0.62:c=pink:a=0.6:r=48000",
    "-af", "highpass=f=190,lowpass=f=2800,afade=t=in:st=0:d=0.34:curve=exp," +
           "afade=t=out:st=0.34:d=0.28:curve=qua",
    "-ac", "2", "-ar", "48000", whoosh])
  if (r.code !== 0) throw new Error("whoosh failed\n" + r.err.split("\n").slice(-6).join("\n"))

  const bell = path.join(tmp, "bell.wav")
  r = await run(["-y",
    "-f", "lavfi", "-i", "sine=f=659.25:d=3.0:sample_rate=48000",
    "-f", "lavfi", "-i", "sine=f=987.77:d=3.0:sample_rate=48000",
    "-f", "lavfi", "-i", "sine=f=1318.51:d=3.0:sample_rate=48000",
    "-filter_complex",
      "[0:a]volume=0.50[a];[1:a]volume=0.26[b];[2:a]volume=0.14[c];" +
      "[a][b][c]amix=inputs=3:normalize=0,afade=t=in:st=0:d=0.015," +
      "afade=t=out:st=0.02:d=2.9:curve=exp,lowpass=f=5200[o]",
    "-map", "[o]", "-ac", "2", "-ar", "48000", bell])
  if (r.code !== 0) throw new Error("bell failed\n" + r.err.split("\n").slice(-6).join("\n"))

  // The riser: A and its octave, the bed's own tonic, so it reads as pressure inside the music
  // rather than as a sound effect laid over it. Cut, not faded, at the drop.
  const riser = path.join(tmp, "riser.wav")
  r = await run(["-y",
    "-f", "lavfi", "-i", "sine=f=55:d=2.0:sample_rate=48000",
    "-f", "lavfi", "-i", "sine=f=110:d=2.0:sample_rate=48000",
    "-f", "lavfi", "-i", "sine=f=220.5:d=2.0:sample_rate=48000",
    "-filter_complex",
      "[0:a]volume=0.50[a];[1:a]volume=0.34[b];[2:a]volume=0.12[c];" +
      "[a][b][c]amix=inputs=3:normalize=0,afade=t=in:st=0:d=1.86:curve=exp," +
      "afade=t=out:st=1.86:d=0.12,lowpass=f=900[o]",
    "-map", "[o]", "-ac", "2", "-ar", "48000", riser])
  if (r.code !== 0) throw new Error("riser failed\n" + r.err.split("\n").slice(-6).join("\n"))

  const inputs = ["-i", bed]
  const filters = [
    `[0:a]atrim=0:${total.toFixed(2)},asetpts=N/SR/TB,` +
      `volume=eval=frame:volume='0.72+0.72*min(1,max(0,(t-${swellAt.toFixed(2)})/1.4))',` +
      `afade=t=in:st=0:d=1.4,afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5[bed]`,
  ]
  const labels = ["[bed]"]
  seams.forEach((s, i) => {
    inputs.push("-i", whoosh)
    const ms = Math.round(s * 1000)
    filters.push(`[${i + 1}:a]adelay=${ms}|${ms},volume=-14dB[w${i}]`)
    labels.push(`[w${i}]`)
  })
  const bellIdx = seams.length + 1
  inputs.push("-i", bell)
  const bms = Math.round(bellAt * 1000)
  filters.push(`[${bellIdx}:a]adelay=${bms}|${bms},volume=-9dB[bell]`)
  labels.push("[bell]")

  inputs.push("-i", riser)
  const rms = Math.round(riseAt * 1000)
  filters.push(`[${bellIdx + 1}:a]adelay=${rms}|${rms},volume=-11dB[riser]`)
  labels.push("[riser]")

  filters.push(
    `${labels.join("")}amix=inputs=${labels.length}:duration=longest:normalize=0,` +
      `atrim=0:${total.toFixed(2)},alimiter=limit=0.97[a]`
  )

  const raw = path.join(tmp, "mix.wav")
  r = await run(["-y", ...inputs, "-filter_complex", filters.join(";"),
    "-map", "[a]", "-ac", "2", "-ar", "48000", raw])
  if (r.code !== 0) throw new Error("audio mix failed\n" + r.err.split("\n").slice(-12).join("\n"))

  // Two passes, not one. Single-pass loudnorm is a dynamic normaliser working blind: measured on
  // the finished file it landed at -12.6 LUFS against a -14 target, 1.4 LU hot. Measuring first and
  // handing the numbers back as measured_* makes the second pass a straight linear gain, which
  // hits the target.
  const target = "I=-14:TP=-1:LRA=9"
  const measure = async (file) => {
    const a = await run(["-i", file, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"])
    const json = a.err.slice(a.err.lastIndexOf("{"))
    return JSON.parse(json.slice(0, json.indexOf("}") + 1))
  }
  const m = await measure(raw)
  const normed = path.join(tmp, "normed.wav")
  r = await run(["-y", "-i", raw, "-af",
    `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
      `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:` +
      `linear=true`,
    "-ac", "2", "-ar", "48000", normed])
  if (r.code !== 0) throw new Error("loudness pass failed\n" + r.err.split("\n").slice(-12).join("\n"))

  // And then check the homework. loudnorm silently drops out of linear mode when its own true-peak
  // headroom check fails, which left the first cut of this film 0.8 LU hot. A static gain moves
  // integrated loudness by exactly its own value, so measuring the normalised file and applying the
  // remaining difference is the one step that actually lands on the number.
  const after = await measure(normed)
  const delta = -14 - Number(after.input_i)
  r = await run(["-y", "-i", normed, "-af", `volume=${delta.toFixed(2)}dB`,
    "-ac", "2", "-ar", "48000", dest])
  fs.rmSync(tmp, { recursive: true, force: true })
  if (r.code !== 0) throw new Error("trim pass failed\n" + r.err.split("\n").slice(-12).join("\n"))
  console.log(`  mix ${m.input_i} LUFS → normalised ${after.input_i} → trimmed ${delta.toFixed(2)}dB to -14`)
}

/* ── render ────────────────────────────────────────────────────────────────────────────────── */

async function renderShape(key, spec, photoDir, audioFile, lang) {
  const { w: W, h: H, tag } = SHAPES[key]
  const name = outName(lang, tag)
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `adwow-${key}-`))
  let written = 0
  let finished = false

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (url.pathname === "/player.html") {
      // charset spelled out: the Spanish cut is full of accented characters and the player is a
      // string literal, not a file on disk, so nothing else declares the encoding to Chrome.
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
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
    if (url.pathname === "/log" && req.method === "POST") {
      const chunks = []
      req.on("data", (c) => chunks.push(c))
      req.on("end", () => { console.log(`  · ${Buffer.concat(chunks)}`); res.writeHead(200); res.end("ok") })
      return
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

  const deadline = Date.now() + (expected * 0.7 + 240) * 1000
  while (!finished && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250))
  chrome.kill()
  server.close()

  if (written < expected) {
    fs.rmSync(frameDir, { recursive: true, force: true })
    throw new Error(`${key}: painted only ${written}/${expected} frames`)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outFile = path.join(OUT_DIR, name)
  const { code, err } = await run([
    "-y", "-framerate", String(FPS), "-i", path.join(frameDir, "f-%05d.jpg"),
    "-i", audioFile,
    "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-t", seconds.toFixed(2), "-movflags", "+faststart", outFile,
  ])
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${outFile}\n${err.split("\n").slice(-10).join("\n")}`)

  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${name.padEnd(42)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB`)
  if (lang === "en") {
    fs.copyFileSync(outFile, path.join(OUT_DIR, legacyName(tag)))
    console.log(`    ↳ also written as ${legacyName(tag)} (master-commercial.mjs reads that name)`)
  }
}

/* ── main ──────────────────────────────────────────────────────────────────────────────────── */

const { n, bizPhotos, actPhotos } = await gather()
console.log("live numbers:", n)
const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "adwow-photos-"))
const all = [...bizPhotos, ...actPhotos]
const { files, position } = await cachePhotos(all.map((x) => x.url), photoDir)
console.log(`photos: ${files.length} of ${all.length} cached`)

/**
 * Cast the two full-bleed photo beats by what the photograph shows.
 *
 * Indexing into an md5-ordered pool put a plate of sushi under one line and a rocket under another —
 * both true, neither composed. Matching on the subject's own title is still live data; it just stops
 * the running order deciding the images.
 */
const actAt = (re, taken = []) => {
  const i = actPhotos.findIndex((a, k) => re.test(a.title) && !taken.includes(k))
  return i < 0 ? null : { key: i, at: position.get(bizPhotos.length + i) ?? null }
}
const launch = actAt(/launch|vandenberg|rocket|space/i)
const land = actAt(/beach|dune|park|valley|trail|river|lake|bluff|garden|flower|ranch|hill/i, [launch?.key])
// The food-and-drink storefronts sort first (see gather), but the panel picker chooses by aspect
// ratio across its whole range — so the range itself is confined to that preferred prefix whenever
// one exists. posAt walks forward past any photos that failed to cache.
const PREFER = /grill|coffee|caf|bak|restaurant|saloon|taproom|winery|market|florist|garden/i
const preferredCount = bizPhotos.filter((b) => PREFER.test(b.title)).length
const posAt = (k) => {
  for (let i = k; i <= bizPhotos.length; i++) {
    const p = position.get(i)
    if (p !== undefined) return p
  }
  return files.length
}
const cast = {
  bizRange: [0, preferredCount > 0 ? posAt(preferredCount) : posAt(bizPhotos.length)],
  launch: launch?.at ?? 0,
  land: land?.at ?? 0,
}
console.log(`cast: launch="${launch ? actPhotos[launch.key].title : "—"}" ` +
  `place="${land ? actPhotos[land.key].title : "—"}"`)

/**
 * The montage is cast by hand, from places rather than from the business pool.
 *
 * Picking the six photos that happened to crop best put a big-box wine aisle and a promo graphic
 * with its own burnt-in green price text under the line "Stop missing your own town" — technically
 * live site photography, and the exact opposite of the argument. The activities table is the
 * curated set of actual Lompoc places, so the montage is drawn from there.
 *
 * Ordered for contrast and for a last image worth lifting away from: adobe, then a playground, an
 * interior, the coast, the hills, and the flower fields last, because that is the one picture of
 * this town everyone recognises. The theatre marquee is deliberately not in here — it is a tight
 * shot of a sign, and a 9:16 crop cuts it to "LOMPO / THEAT". Anything that fails to cache falls
 * through to the player's crop-fit picker rather than leaving a hole.
 */
const MONTAGE_WANTED = [/purisima|mission/i, /river/i, /wine ghetto/i,
                        /ocean beach/i, /harris grade/i, /flower/i]
const montage = []
for (const re of MONTAGE_WANTED) {
  const k = actPhotos.findIndex((a, i) => re.test(a.title) && ![launch?.key, land?.key].includes(i))
  if (k < 0) continue
  const at = position.get(bizPhotos.length + k)
  if (at !== undefined && !montage.includes(at)) montage.push(at)
}
console.log(`montage: ${montage.length} of ${MONTAGE_WANTED.length} cast from places`)

// Titles travel with the photos so the player can report which storefront it picked.
const titles = []
all.forEach((x, i) => { const at = position.get(i); if (at !== undefined) titles[at] = x.title })

for (const l of LANGS) if (!COPY[l]) throw new Error(`unknown --lang=${l} (have ${Object.keys(COPY)})`)

// The beat structure and every duration are language-independent — only the words change — so the
// cut length, the seam times and therefore the whole mix are shared by both films.
const cut = beats(n, cast, LANGS[0])
const total = cut.reduce((a, b) => a + b.dur, 0)

// Seam times: the push starts SEAM seconds before a beat ends. Must match the player's own test for
// when it pushes. The cut into the montage gets no sweep — that silence is what makes it land.
const seams = []
let acc = 0
cut.forEach((b, i) => {
  acc += b.dur
  const next = cut[i + 1]
  if (next && next.kind !== "flash") seams.push(acc - SEAM)
})
const flashStart = cut.slice(0, cut.findIndex((b) => b.kind === "flash")).reduce((a, b) => a + b.dur, 0)
const endStart = total - cut[cut.length - 1].dur

const audioFile = path.join(os.tmpdir(), `adwow-master-${process.pid}.wav`)
console.log(`\naudio: bed + ${seams.length} sweeps + riser + bell; ` +
  `riser ${(flashStart - 1.98).toFixed(1)}s, drop ${flashStart.toFixed(1)}s, bell ${endStart.toFixed(1)}s`)
// The riser ends 0.02s before the montage cut so the drop is silence-then-picture, not a crossfade.
await buildAudio(total, seams, flashStart - 1.0, flashStart - 1.98, endStart + 0.12, audioFile)

for (const lang of LANGS) {
  const langCut = beats(n, cast, lang)
  const spec = {
    beats: langCut, photos: files, titles, montage,
    bizRange: cast.bizRange, kicker: COPY[lang].end.kicker,
  }
  console.log(`\nrendering ${lang.toUpperCase()} · ${total.toFixed(1)}s`)
  for (const key of Object.keys(SHAPES)) {
    if (ONLY.length && !ONLY.includes(key)) continue
    await renderShape(key, spec, photoDir, audioFile, lang)
  }
}
fs.rmSync(photoDir, { recursive: true, force: true })
fs.rmSync(audioFile, { force: true })
