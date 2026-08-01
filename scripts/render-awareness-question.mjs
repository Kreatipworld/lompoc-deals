#!/usr/bin/env node
/**
 * "Know your town" — treatment C, the QUESTION cut.
 *
 * An awareness film built on one device: ask the viewer something about the place they live,
 * leave the question hanging long enough that they answer it in their head, then show the real
 * number. The gap between the two is the whole argument for a town hub.
 *
 * Two typefaces carry the device, and nothing else has to:
 *   • the QUESTION is Georgia italic — a person asking, a neighbour leaning over the fence
 *   • the ANSWER is Plus Jakarta Sans 800 — the record, flat and factual
 * A gold rule draws in between them at the moment of the reveal. Once you've seen it twice you
 * know which voice is speaking before you've read the words, which is what lets the film work
 * with the sound off.
 *
 * Tone is the risk, not the craft. This is the rebrand of a beloved years-old community account,
 * so the film never says "you don't know your town". It says "nobody can name forty — we
 * couldn't either." The absolution beat is load-bearing; don't cut it.
 *
 * Every number is queried from Neon at render time. Nothing here is hardcoded or estimated.
 *
 * Same two headless-Chrome facts the other renderers work around (see lib/video-frames.mjs):
 * MediaRecorder returns empty video in headless, and requestAnimationFrame never fires — so
 * frames are painted on a step loop, POSTed out as JPEGs, and encoded by ffmpeg.
 *
 * Usage:
 *   node scripts/render-awareness-question.mjs             # both shapes, with audio
 *   node scripts/render-awareness-question.mjs --only=tt   # 9:16 only
 *   node scripts/render-awareness-question.mjs --no-audio
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
const HERE = path.dirname(fileURLToPath(import.meta.url))
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

/** Seam wipe length, in seconds. Subtracted from every beat's readable window. */
const WIPE = 0.24

const SHAPES = {
  tt: { w: 1080, h: 1920, name: "awareness-question-9x16.mp4" },
  ig: { w: 1080, h: 1350, name: "awareness-question-4x5.mp4" },
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

/**
 * The four live numbers the film answers with, plus the two photographs it uses as punctuation.
 *
 * Photos are picked by slug, not by position in an ordered pool: the launch beat needs a launch
 * photograph specifically, and an md5-ordered pool would eventually hand it a plate of food.
 */
async function gather() {
  const [[b], [e], [l]] = await Promise.all([
    sql`select count(*)::int n from businesses where status='approved'`,
    sql`select count(*)::int n from events where status='approved' and starts_at > now()`,
    sql`select count(*)::int n from events
        where status='approved' and starts_at > now() and title ilike '%launch%'`,
  ])

  const shots = await sql`select slug, photos_json from activities
    where slug in ('vandenberg-launches','harris-grade-road','lompoc-flower-fields')`
  const bySlug = Object.fromEntries(
    shots.map((r) => [r.slug, (r.photos_json || []).map(photoUrl).filter(Boolean)])
  )

  return {
    n: { businesses: b.n, events: e.n, launches: l.n },
    // The launch beat wants the sky over the base; the driveway beat wants somewhere in the
    // valley you'd plausibly be standing when it goes up.
    shots: {
      launch: bySlug["vandenberg-launches"] || [],
      valley: [...(bySlug["harris-grade-road"] || []), ...(bySlug["lompoc-flower-fields"] || [])],
    },
  }
}

/** Downloads each photo once so the player can load it same-origin (toBlob throws on a tainted canvas). */
async function cachePhotos(urls, dir) {
  fs.mkdirSync(dir, { recursive: true })
  const kept = []
  await Promise.all(
    urls.map(async (u, i) => {
      try {
        const res = await fetch(u)
        if (!res.ok) return
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 4000) return
        fs.writeFileSync(path.join(dir, `${i}.jpg`), buf)
        kept[i] = `${i}.jpg`
      } catch {
        /* a dead photo url just means we fall back to the next candidate */
      }
    })
  )
  return kept
}

/* ------------------------------------------------------------------ the film */

/**
 * Six beats. Every one of them asks something, and the last one is answered by the logo.
 *
 * The copy is this short because assertReadable() below wouldn't pass anything longer inside a
 * 25-second film. That constraint improved it: the first cut answered "473" with "local
 * businesses. And we're still counting." and the honest reading budget said no, so it became
 * "and counting." — which is better anyway, because the question already said "businesses".
 *
 * `aAt` is when the answer lands, in seconds from the top of the beat. Absolute rather than a
 * fraction of the duration, because the thing that has to be right is how many seconds a viewer
 * gets to read, and a fraction hides that.
 */
const beats = (n) => [
  {
    bg: "purple",
    q: "How many businesses are in Lompoc?",
    stat: n.businesses.toLocaleString(),
    label: "and counting.",
    aAt: 2.3,
    dur: 4.0,
  },
  {
    // The absolution beat. The film is allowed to catch the viewer out exactly once, and only if
    // it immediately stands next to them — "we couldn't either" is what keeps this a neighbour
    // pointing something out instead of a brand scoring a point. Do not cut it.
    bg: "gold",
    q: "Now name forty.",
    a: "Nobody can.",
    sub: "We couldn't either.",
    aAt: 1.5,
    dur: 3.6,
  },
  {
    // The photograph says "over the base", so the question doesn't have to — which buys most of a
    // second back, and a four-word question hangs harder than a seven-word one.
    bg: "purple",
    photo: "launch",
    q: "When's the next launch?",
    stat: String(n.launches),
    label: "already on the calendar.",
    aAt: 1.7,
    dur: 3.9,
  },
  {
    bg: "purple",
    photo: "valley",
    q: "The last one?",
    a: "You could've watched it from your driveway.",
    aAt: 1.45,
    dur: 4.2,
  },
  {
    bg: "green",
    q: "¿Y en español?",
    a: "Sí. Todo el sitio.",
    aAt: 1.45,
    dur: 3.3,
  },
  {
    // The end card is the last question's answer. Nothing has to say "one place" out loud when
    // the mark and the address arrive in the pause where the answer belongs.
    kind: "end",
    bg: "purple",
    q: "So where do you look?",
    a: "lompoclocals.com",
    label: `${n.businesses} businesses · ${n.events} events · ${n.launches} launches`,
    markAt: 1.75,
    aAt: 2.4,
    labelAt: 3.0,
    dur: 5.4,
  },
]

/* ------------------------------------------------- the readability guard */

/**
 * The failure mode of every kinetic-type film is text that's gone before it's read, so the holds
 * are checked rather than eyeballed.
 *
 * Reading a short display line silently runs about 2.9 words/second once the eye has landed, plus
 * roughly 0.4s to land at all. Line wrapping is estimated here from average glyph widths — the
 * browser does the real wrap — which is close enough to catch a beat that's a second too short.
 */
const REVEAL = 0.3 // seconds for one line to fade up
const STAGGER = 0.14 // seconds between lines
const LAND = 0.35 // eye landing on a new block of type
const WPS = 4.2 // words/second, silent, large isolated display type
const SACCADE = 0.15 // extra per wrapped line

// How long after the answer the smaller lines follow it in. Shared with the player so the guard
// below is checking the timings the film is actually painted with.
const LABEL_LAG = 0.22
const SUB_LAG = 0.42

/**
 * Seconds a viewer needs to read one block.
 *
 * Not the subtitle standard (~3 words/sec): subtitles are read while something else is happening
 * on screen and while dialogue competes for attention. Here the type is the only content, it's set
 * at 85px+, and it stays put — a fluent reader takes a short display line in one or two fixations.
 * The floor stops a two-word line from being modelled as instantaneous.
 */
const needed = (text, lines) =>
  Math.max(0.9, LAND + text.trim().split(/\s+/).length / WPS + SACCADE * ((lines || 1) - 1))

/** Rough line count at a given point size in a 1080-wide column; the browser does the real wrap. */
function estLines(text, px, italicSerif) {
  if (!text) return 1
  const em = italicSerif ? 0.44 : 0.53 // Georgia italic runs narrower than Jakarta 800
  const maxW = 1080 - Math.round(1080 * 0.088) * 2
  return Math.max(1, Math.ceil((text.length * px * em) / maxW))
}

/**
 * The guard that makes this film work: every question has to hang, and every answer has to survive.
 *
 * Three things get checked per beat.
 *   read     — the question is on screen long enough to be read at all
 *   hang     — there is a deliberate silence after it's been read, before the answer lands.
 *              That pause IS the treatment; without it the film is just statements.
 *   survive  — the answer is on screen long enough to be read before the beat cuts away
 */
function assertReadable(list) {
  const rows = []
  let bad = 0
  list.forEach((b, i) => {
    const last = i === list.length - 1
    const eff = b.dur - (last ? 0 : WIPE)
    const flag = (ok) => { if (!ok) bad++; return ok }

    const qNeed = b.q ? needed(b.q, estLines(b.q, 85, true)) : 0
    const qDone = 0.1 + qNeed

    if (b.q) {
      rows.push({ beat: i + 1, part: "question", text: b.q,
        need: qNeed, got: eff - 0.1, ok: flag(eff - 0.1 >= qNeed) })
      rows.push({ beat: i + 1, part: "hang", text: "(silence before the answer)",
        need: 0.25, got: b.aAt - qDone, ok: flag(b.aAt - qDone >= 0.25) })
    }

    // A bare numeral is taken in at a glance, so it counts as one word rather than three digits.
    const words = [b.stat && "000", b.a, b.label, b.sub].filter(Boolean).join(" ")
    if (words) {
      const lines =
        (b.stat ? 1 : 0) +
        estLines(b.a, 88) * (b.a ? 1 : 0) +
        (b.label ? estLines(b.label, 40) : 0) +
        (b.sub ? estLines(b.sub, 52) : 0)
      const req = needed(words, lines)
      rows.push({ beat: i + 1, part: "answer", text: [b.stat, b.a, b.label, b.sub].filter(Boolean).join(" / "),
        need: req, got: eff - b.aAt - 0.1, ok: flag(eff - b.aAt - 0.1 >= req) })

      // The last thing to arrive still has to be readable on its own — the sub-line is the piece
      // most likely to be cut off, because it lands last and nothing after it is holding the beat.
      const tail = b.sub
        ? { text: b.sub, at: b.aAt + SUB_LAG, px: 52 }
        : b.label
          ? { text: b.label, at: b.labelAt ?? b.aAt + LABEL_LAG, px: 40 }
          : null
      if (tail) {
        const tNeed = needed(tail.text, estLines(tail.text, tail.px))
        rows.push({ beat: i + 1, part: "tail", text: tail.text,
          need: tNeed, got: eff - tail.at - 0.1, ok: flag(eff - tail.at - 0.1 >= tNeed) })
      }
    }
  })

  console.log("\n  reading holds — seconds on screen vs. seconds needed")
  for (const r of rows) {
    console.log(
      `   ${r.ok ? "✓" : "✗"} beat ${r.beat} ${r.part.padEnd(8)} ` +
        `need ${r.need.toFixed(2)}s  got ${r.got.toFixed(2)}s   ${r.text.slice(0, 46)}`
    )
  }
  if (bad) throw new Error(`${bad} check(s) failed — the film reads faster than it plays`)
  const total = list.reduce((a, b) => a + b.dur, 0)
  console.log(`  total ${total.toFixed(1)}s\n`)
  return total
}

/* ------------------------------------------------------------------ player */

const PLAYER = (W, H, spec) => /* html */ `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#650C75;overflow:hidden}canvas{display:block}</style>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W=${W}, H=${H}, FPS=${FPS}, WIPE=${WIPE};
const REVEAL=${REVEAL}, STAGGER=${STAGGER}, LABEL_LAG=${LABEL_LAG}, SUB_LAG=${SUB_LAG};
const spec = ${JSON.stringify(spec)};
const cv = document.getElementById('c'), g = cv.getContext('2d');

const CREAM='#FAF5EC', INK='#241629', PURPLE='#650C75', GOLD='#EFC618', GREEN='#0B992F';
const C = {cream:CREAM, ink:INK, purple:PURPLE, gold:GOLD, green:GREEN, white:'#ffffff'};

const easeOut   = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
const clamp01   = t => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp = (a,b,t) => a + (b-a)*t;

const PAD = Math.round(W * 0.088);
const MAXW = W - PAD*2;
const GRAIN_ALPHA = 0.03;
const MARK_ASPECT = 314 / 402;   // the SVG has a viewBox but no width/height

// The two voices. Georgia italic asks; Jakarta answers.
const ASK  = px => 'italic ' + px + 'px Georgia, "Times New Roman", serif';
const SAY  = (px,w) => (w||800) + ' ' + px + 'px "Plus Jakarta Sans", sans-serif';

let MARK_W, PHOTOS = {}, GRAIN;

const load = src => new Promise(res => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

/** Film grain, painted once offscreen — the same texture the brand's other films carry. */
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

/** object-fit: cover. */
function cover(img,x,y,w,h){
  if(!img) return;
  const s=Math.max(w/img.width,h/img.height);
  const dw=img.width*s, dh=img.height*s;
  g.drawImage(img, x+(w-dw)/2, y+(h-dh)/2, dw, dh);
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

/**
 * The type sizes for one beat, shrunk until the whole composition fits.
 *
 * Both shapes are 1080 wide but 4:5 is 570px shorter, so a block that breathes on 9:16 can run off
 * the bottom of the feed cut. Rather than two hand-tuned size tables, one scale is searched for
 * until the measured block clears the frame — the words never change size mid-beat, so nothing
 * reflows while it's being read.
 */
function metrics(b, s){
  const gap = Math.round(W*0.045*s);
  const stat = Math.round(W*0.185*s);
  return {
    // How far the cursor drops past a stat: the numeral's own depth plus real air beneath it. The
    // first cut used a third of a gap and the label sat on the numeral's baseline, touching it.
    statDrop: stat*0.76 + gap*0.86,
    q:     Math.round(W*0.079*s),
    a:     Math.round(W*0.082*s),
    label: Math.round(W*0.040*s),
    sub:   Math.round(W*0.048*s),
    rule:  Math.round(W*0.155*s),
    stat, gap,
  };
}

/** Measures a beat at a given scale: line arrays plus the total block height. */
function layout(b, s){
  const m = metrics(b, s);
  const L = {m, q:[], a:[], label:[], sub:[], h:0};
  let h = 0;
  if(b.q){
    L.q = wrapWords(b.q, ASK(m.q), MAXW);
    h += L.q.length * m.q * 1.16;
  }
  const hasAnswer = b.a || b.stat;
  if(b.q && hasAnswer){ L.ruleY = h + m.gap*0.62; h += m.gap*1.30; }
  // m.statDrop has to be identical here and in paintBeat, or the measured block height stops
  // matching the painted one and the composition drifts off its anchor.
  if(b.stat){ h += m.statDrop; }
  if(b.a){
    L.a = wrapWords(b.a, SAY(m.a), MAXW);
    h += L.a.length * m.a * 1.12;
  }
  if(b.label){
    L.label = wrapWords(b.label, SAY(m.label,600), MAXW);
    h += m.gap*0.44 + L.label.length * m.label * 1.30;
  }
  if(b.sub){
    L.sub = wrapWords(b.sub, SAY(m.sub,700), MAXW);
    h += m.gap*0.42 + L.sub.length * m.sub * 1.22;
  }
  L.h = h;
  return L;
}

function fitLayout(b){
  const cap = b.photo ? H*0.62 : H*0.70;
  for(const s of [1, .96, .92, .87, .82, .77, .72]){
    const L = layout(b, s);
    if(L.h <= cap) return L;
  }
  return layout(b, .68);
}

/**
 * One block of lines fading up in sequence.
 *
 * A line is either in its final colour or it isn't on screen — no ghosting, no per-word crawl.
 * Half-drawn type reads as a rendering fault, and this film is asking the viewer to read.
 */
function drawLines(lines,{x,y,font,size,colour,local,start,align,lh}){
  g.font=font; g.textBaseline='alphabetic'; g.textAlign='left';
  let yy=y;
  lines.forEach((str,i)=>{
    const t=clamp01((local - start - i*STAGGER)/REVEAL);
    if(t>0){
      const xx = align==='center' ? x-g.measureText(str).width/2 : x;
      g.save();
      g.globalAlpha=easeOut(t);
      g.fillStyle=colour;
      g.fillText(str,xx,yy+(1-easeOut(t))*size*0.18);
      g.restore();
    }
    yy += size*(lh||1.16);
  });
  return yy-y;
}

function paintBeat(b, local){
  const dark = b.bg!=='cream' && b.bg!=='gold';
  g.fillStyle=C[b.bg]||PURPLE; g.fillRect(0,0,W,H);

  if(b.photo){
    const img = PHOTOS[b.photo];
    // Slow push-in so a still photograph doesn't read as a slide.
    const s=lerp(1.0,1.07,easeInOut(local/b.dur));
    g.save();
    g.translate(W/2,H/2); g.scale(s,s); g.translate(-W/2,-H/2);
    cover(img,0,0,W,H);
    g.restore();
    // A neutral scrim, not a brand wash: the photographs are the argument that this is a real
    // town, so they keep their own colour. Only the strip the type sits on gets darkened.
    // Reaches full strength well before the bottom of the frame, because the type does too. The
    // launch photograph's lower third is bright concrete, and a gradient that only got dark at
    // the very bottom left the small line under the number sitting on it barely legible.
    const grd=g.createLinearGradient(0,H*0.14,0,H);
    grd.addColorStop(0,'rgba(16,8,20,0)');
    grd.addColorStop(0.45,'rgba(16,8,20,0.55)');
    grd.addColorStop(0.72,'rgba(16,8,20,0.84)');
    grd.addColorStop(1,'rgba(16,8,20,0.92)');
    g.fillStyle=grd; g.fillRect(0,H*0.14,W,H*0.86);
  }

  /**
   * The end card is the last question's answer, so it's built like every other beat: the question
   * in Georgia italic, the gold rule at the hinge, then the answer — which here is the mark and
   * the address rather than words. Centred rather than left-aligned, because a sign-off is a
   * different kind of statement from a question, and the change of axis says the film is over.
   */
  if(b.kind==='end'){
    const qs=Math.round(W*0.072);
    const qLines=wrapWords(b.q, ASK(qs), MAXW);
    drawLines(qLines,{x:W/2,y:H*0.30,font:ASK(qs),size:qs,colour:CREAM,
      local,start:0,align:'center',lh:1.16});

    // drawLines centres by measuring and shifting x, and leaves textAlign on 'left'. Everything
    // below centres with textAlign instead, so it has to be set back here — the first cut of this
    // card set it once at the top and the URL rendered from the centre off the right-hand edge.
    g.textAlign='center';

    // The hinge rule, drawing outward from the centre at the moment the answer starts to arrive.
    const ra=clamp01((local-b.markAt+0.30)/0.38);
    if(ra>0){
      const w=Math.round(W*0.16)*easeOut(ra);
      g.fillStyle=GOLD;
      g.fillRect(W/2-w/2, H*0.355, w, Math.max(5,Math.round(W*0.0072)));
    }

    const ma=clamp01((local-b.markAt)/0.45);
    if(ma>0){
      g.save(); g.globalAlpha=easeOut(ma);
      const h=Math.round(W*0.205);
      const scale=lerp(0.94,1,easeOut(ma));
      g.translate(W/2, H*0.42);
      g.scale(scale,scale);
      // Drawn from its own aspect ratio, never stretched to a box: the mark's SVG carries a
      // viewBox but no width/height, so a naive drawImage into a fixed square would squash it.
      g.drawImage(MARK_W, -h*MARK_ASPECT/2, 0, h*MARK_ASPECT, h);
      g.restore();
    }

    const ua=clamp01((local-b.aAt)/0.42);
    if(ua>0){
      g.save(); g.globalAlpha=easeOut(ua);
      g.fillStyle=GOLD; g.font=SAY(Math.round(W*0.076));
      g.fillText(b.a, W/2, H*0.655+(1-easeOut(ua))*14);
      g.restore();
    }

    const la=clamp01((local-b.labelAt)/0.42);
    if(la>0){
      g.save(); g.globalAlpha=easeOut(la);
      g.fillStyle='rgba(250,245,236,0.86)';
      g.font=SAY(Math.round(W*0.0335),600);
      g.fillText(b.label, W/2, H*0.706);
      g.restore();
    }

    g.textAlign='left';
    grain(GRAIN_ALPHA);
    return;
  }

  const L = b._L, m = L.m;
  const qColour = dark ? CREAM : INK;
  const aColour = dark ? GOLD  : PURPLE;
  const statCol = dark ? GOLD  : PURPLE;
  const ruleCol = dark ? GOLD  : PURPLE;
  const dimCol  = dark ? 'rgba(250,245,236,0.82)' : 'rgba(36,22,41,0.66)';

  // Photo beats anchor low so the picture stays visible, but stop at 88% of the height rather
  // than a flat pixel padding: the bottom eighth of a feed video is under the platform's own
  // caption and button furniture, and the first cut put the small line under the number there.
  const top = b.photo
    ? H*0.88 - L.h + m.q*0.78
    : Math.max(H*0.16, (H - L.h)/2 - H*0.012) + m.q*0.78;

  let y = top;
  const aAt = b.aAt;

  if(L.q.length){
    y += drawLines(L.q,{x:PAD,y,font:ASK(m.q),size:m.q,colour:qColour,
      local,start:0,lh:1.16});
  }

  // The gold rule is the hinge of the whole film: it draws in at the instant the question stops
  // being a question. It sweeps rather than fades so the eye is pulled down to the answer.
  if(L.ruleY !== undefined){
    const t=clamp01((local-aAt+0.12)/0.34);
    if(t>0){
      g.fillStyle=ruleCol;
      g.fillRect(PAD, top - m.q*0.78 + L.ruleY, m.rule*easeOut(t), Math.max(5,Math.round(W*0.0072)));
    }
    y += m.gap*1.30;
  }

  if(b.stat){
    const t=clamp01((local-aAt)/0.34);
    if(t>0){
      const sc=lerp(0.90,1,easeOut(t));
      g.save(); g.globalAlpha=easeOut(t);
      g.translate(PAD, y + m.stat*0.76);
      g.scale(sc,sc);
      g.fillStyle=statCol; g.font=SAY(m.stat);
      g.fillText(b.stat,0,0);
      g.restore();
    }
    y += m.statDrop;
  }

  if(L.a.length){
    y += drawLines(L.a,{x:PAD,y:y+m.a*0.0,font:SAY(m.a),size:m.a,
      colour:aColour,local,start:aAt,lh:1.12});
  }

  if(L.label.length){
    y += m.gap*0.44;
    y += drawLines(L.label,{x:PAD,y,font:SAY(m.label,600),size:m.label,
      colour:dimCol,local,start:aAt+LABEL_LAG,lh:1.30});
  }

  if(L.sub.length){
    y += m.gap*0.42;
    y += drawLines(L.sub,{x:PAD,y,font:SAY(m.sub,700),size:m.sub,
      colour:dark?'rgba(250,245,236,0.9)':INK,local,start:aAt+SUB_LAG,lh:1.22});
  }

  grain(GRAIN_ALPHA);
}

const toBlob = () => new Promise(r => cv.toBlob(r,'image/jpeg',0.94));

(async () => {
  MARK_W = await load('/brand/lompoc-locals-mark-white.svg');
  for(const k of Object.keys(spec.photos)) PHOTOS[k] = await load('/p/'+spec.photos[k]);
  GRAIN = makeGrain();
  await document.fonts.load('800 200px "Plus Jakarta Sans"');
  await document.fonts.load('600 40px "Plus Jakarta Sans"');
  await document.fonts.ready;

  // Measure every beat once, up front. Nothing about a beat's layout depends on time, so a line
  // can never reflow while somebody is reading it.
  for(const b of spec.beats) if(b.kind!=='end') b._L = fitLayout(b);

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
    paintBeat(beat,local);

    // Seam: the next beat's field sweeps across, so a cut lands as a change of colour rather than
    // a dissolve. Direction alternates — every seam sweeping the same way turns deliberate cuts
    // into one repeating slideshow gesture that the eye starts predicting by the third beat.
    const next=spec.beats[idx+1];
    const toEnd=beat.dur-local;
    if(next && toEnd<WIPE){
      const w=easeInOut(1-toEnd/WIPE);
      g.fillStyle=C[next.bg]||PURPLE;
      if(idx%2===0) g.fillRect(0,0,W*w+2,H);          // in from the left
      else          g.fillRect(W-W*w,0,W*w+2,H);      // in from the right
    }

    // A short fade up from ink at the very top, so the film starts rather than jump-cuts in.
    if(t<0.32){ g.fillStyle='rgba(36,22,41,'+(1-easeOut(t/0.32))+')'; g.fillRect(0,0,W,H); }

    const blob=await toBlob();
    await fetch('/frame?n='+String(i).padStart(5,'0'),{method:'POST',body:await blob.arrayBuffer()});
  }
  await fetch('/done',{method:'POST'});
  document.title='DONE';
})();
</script>`

/* ------------------------------------------------------------------ render */

function run(bin, args) {
  return new Promise((resolve) => {
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, err }))
  })
}

async function renderShape(key, spec, photoDir, musicFile) {
  const { w: W, h: H, name } = SHAPES[key]
  const seconds = spec.beats.reduce((a, b) => a + b.dur, 0)
  const expected = Math.round(seconds * FPS)
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), `aq-${key}-`))
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

  // Video and audio in one pass. The bed comes out of make-music-bed.mjs at -20 LUFS; the master
  // bus lands it at -14 LUFS / -1 dBTP, which is what the social platforms normalise to anyway.
  const args = ["-y", "-framerate", String(FPS), "-i", path.join(frameDir, "f-%05d.jpg")]
  if (musicFile) {
    args.push("-i", musicFile,
      "-filter_complex", `[1:a]atrim=0:${seconds.toFixed(2)},asetpts=N/SR/TB,` +
        `afade=t=out:st=${(seconds - 1.6).toFixed(2)}:d=1.6,loudnorm=I=-14:TP=-1:LRA=9[a]`,
      "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest")
  }
  args.push("-c:v", "libx264", "-preset", "slow", "-crf", "19",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile)

  const { code, err } = await run(ffmpegPath, args)
  fs.rmSync(frameDir, { recursive: true, force: true })
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${outFile}\n${err.split("\n").slice(-12).join("\n")}`)

  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1)
  console.log(`  ✓ ${name.padEnd(30)} ${W}x${H}  ${seconds.toFixed(1)}s  ${mb} MB`)
}

/* -------------------------------------------------------------------- main */

const { n, shots } = await gather()
console.log("live numbers:", n)

const list = beats(n)
const seconds = assertReadable(list)

// Cache the photo candidates and take the first that actually downloaded, per beat. A dead URL in
// the first slot shouldn't cost the beat its picture.
const photoDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-photos-"))
const flat = [...shots.launch.map((u) => ["launch", u]), ...shots.valley.map((u) => ["valley", u])]
const kept = await cachePhotos(flat.map(([, u]) => u), photoDir)
const photos = {}
flat.forEach(([slot], i) => {
  if (kept[i] && !photos[slot]) photos[slot] = kept[i]
})
for (const slot of ["launch", "valley"]) {
  if (!photos[slot]) throw new Error(`no usable photograph for the "${slot}" beat`)
}
console.log(`photos: launch=${photos.launch} valley=${photos.valley}`)

let musicFile = null
if (!NO_AUDIO) {
  musicFile = path.join(photoDir, "bed.wav")
  const { code } = await run(process.execPath, [
    path.join(HERE, "make-music-bed.mjs"), musicFile, String(Math.ceil(seconds) + 2),
  ])
  if (code !== 0) throw new Error("music bed failed")
}

const spec = { beats: list, photos }
for (const key of Object.keys(SHAPES)) {
  if (ONLY.length && !ONLY.includes(key)) continue
  await renderShape(key, spec, photoDir, musicFile)
}
fs.rmSync(photoDir, { recursive: true, force: true })
