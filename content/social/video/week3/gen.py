#!/usr/bin/env python3
"""
Week 3 football — Friday Sep 11 2026. TikTok twin of the static card, built from OUR OWN
Big Game animation (flyover dive to Huyck, Brave/Conq character clips, badges).
18.0 s, 9:16. Arthur announcer read at 0.50, stadium bed, own SFX. Generated from this file:

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    # id,          start, dur
    ("s1-fly",     0.00,  3.00),   # flyover dive to Huyck · pill FRIDAY NIGHT · WEEK 3
    ("s2-brave",   2.80,  3.20),   # Brave ready + badge · title "Two games. One town." at 3.30 abs
    ("s3-match1",  5.80,  3.70),   # huyck-stadium · LOMPOC BRAVES / vs Pioneer Valley / 7 PM Huyck
    ("s4-match2",  9.30,  3.10),   # conq reveal · CABRILLO CONQUISTADORES / at Nipomo / 7 PM
    ("s5-pick",    12.30, 1.90),   # both badges · PICK YOUR SIDE
    ("s6-end",     14.00, 4.00),   # end card · lompoclocals.com/find/football
]
TOTAL = 18.00
VO_START = 0.50
VO_DUR = 16.37

# burned-in captions (absolute seconds from ASR word times + 0.50)
SUBS = [
    (0.50, 2.70, "Friday night in Lompoc. Week 3."),
    (3.75, 5.60, "Two games. One town."),
    (6.00, 9.30, "The Braves host Pioneer Valley at Huyck Stadium, 7 o'clock."),
    (9.85, 12.30, "The Conqs travel to Nipomo, 7 o'clock."),
    (12.90, 14.00, "Pick your side."),
    (14.20, 16.40, "Schedules at lompoclocals.com/find/football"),
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"; RED = "#d7263d"


def common_css(cid, H, bar):
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 68%, rgba(10,6,12,0.36) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position: absolute; top: 150px; right: 84px; width: 96px; height: auto; z-index: 40; }}
      [data-composition-id="{cid}"] video {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.08) saturate(1.12); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.92) 0%, rgba(20,10,23,0.62) 30%, rgba(20,10,23,0.0) 56%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.72) 0%, rgba(20,10,23,0.25) 22%, rgba(20,10,23,0.0) 38%); }}
      [data-composition-id="{cid}"] .lower {{ position: absolute; left: 84px; right: 84px; bottom: 21%; z-index: 35; }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 34px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .hero {{ display: block; color: #fff; text-shadow: 0 6px 30px rgba(10,6,12,0.7); font-weight: 800; font-size: 132px; line-height: 0.94; letter-spacing: -6px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .team {{ display: block; color: {GOLD}; font-weight: 800; font-size: 40px; letter-spacing: 4px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .opp {{ display: block; margin-top: 10px; color: #fff; font-weight: 800; font-size: 104px; line-height: 0.95; letter-spacing: -4px; text-shadow: 0 6px 30px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .when {{ display: inline-block; margin-top: 26px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 40px; letter-spacing: 1px; padding: 16px 28px; border-radius: 12px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .where {{ display: block; margin-top: 16px; color: #fff; font-weight: 700; font-size: 34px; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 4px 18px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .badge {{ position: absolute; top: 290px; left: 84px; width: 230px; height: auto; z-index: 36; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55)); opacity: 0; will-change: transform, opacity; }}
    """


def wrap(cid, dur, H, bar, inner, js, first=False, bg=None):
    css = common_css(cid, H, bar)
    root_bg = (bg or BG) if first else "transparent"
    fade_js = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if first
               else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {root_bg}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      {inner}
      <div class="vig"></div>
    </div>
    <img class="mark" src="public/mark-white.png" alt="" />
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power4.out", duration: 0.5 }} }});
        {fade_js}
        {js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def scene_html(cid, dur, H, bar):
    if cid == "s1-fly":
        inner = f'''<video id="{cid}-v" class="clip" src="public/fly-dive.mp4" data-start="0" data-media-start="2.40" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video>
      <div class="topscrim"></div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="chip" id="{cid}-pill" style="font-size:38px; padding:18px 32px">Friday night · Week 3</span></div>'''
        js = f'tl.set("#{cid}-pill", {{ autoAlpha: 1 }}, 0);'
        return wrap(cid, dur, H, bar, inner, js, first=True)
    if cid == "s2-brave":
        inner = f'''<video id="{cid}-v" class="clip" src="public/n2-brave-ready.mp4" data-start="0" data-media-start="0.30" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video>
      <div class="scrim"></div><div class="topscrim"></div>
      <img class="badge" id="{cid}-badge" src="public/badge-braves.png" alt="" />
      <div class="lower" data-layout-allow-overlap><span class="hero" id="{cid}-h1" data-layout-allow-overlap>Two games.</span><span class="hero" id="{cid}-h2" data-layout-allow-overlap>One town.</span></div>'''
        js = f'''tl.fromTo("#{cid}-badge", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.20);
        tl.fromTo("#{cid}-h1", {{ autoAlpha: 0, scale: 1.25, y: 20 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.32, ease: "expo.out" }}, 0.50);
        tl.fromTo("#{cid}-h2", {{ autoAlpha: 0, scale: 1.25, y: 20 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.32, ease: "expo.out" }}, 1.62);'''
        return wrap(cid, dur, H, bar, inner, js)
    if cid == "s3-match1":
        inner = f'''<div class="wrap" id="{cid}-w0" data-layout-allow-overflow><img class="cover" src="public/huyck-goalposts.jpg" alt="" style="object-position: 50% 38%" /></div>
      <div class="scrim"></div><div class="topscrim"></div>
      <img class="badge" id="{cid}-badge" src="public/badge-braves.png" alt="" />
      <div class="lower"><span class="team" id="{cid}-team">Lompoc Braves</span><span class="opp" id="{cid}-opp">vs Pioneer Valley</span><span class="when" id="{cid}-when">7:00 PM · Huyck Stadium</span><span class="where" id="{cid}-where">515 W College Ave · Lompoc</span></div>'''
        js = f'''tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.08, duration: {dur:.2f}, ease: "none" }}, 0);
        tl.fromTo("#{cid}-badge", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.05);
        tl.fromTo("#{cid}-team", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 0.10);
        tl.fromTo("#{cid}-opp", {{ autoAlpha: 0, y: 22, scale: 1.08 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 0.86);
        tl.fromTo("#{cid}-when", {{ autoAlpha: 0, scale: 0.85, y: 16 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }}, 1.86);
        tl.fromTo("#{cid}-where", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 2.30);'''
        return wrap(cid, dur, H, bar, inner, js)
    if cid == "s4-match2":
        inner = f'''<video id="{cid}-v" class="clip" src="public/clip-conq2-reveal.mp4" data-start="0" data-media-start="0.60" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video>
      <div class="scrim"></div><div class="topscrim"></div>
      <img class="badge" id="{cid}-badge" src="public/badge-conqs.png" alt="" />
      <div class="lower"><span class="team" id="{cid}-team">Cabrillo Conquistadores</span><span class="opp" id="{cid}-opp">at Nipomo</span><span class="when" id="{cid}-when">7:00 PM · Nipomo High School</span></div>'''
        js = f'''tl.fromTo("#{cid}-badge", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.05);
        tl.fromTo("#{cid}-team", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 0.10);
        tl.fromTo("#{cid}-opp", {{ autoAlpha: 0, y: 22, scale: 1.08 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 1.64);
        tl.fromTo("#{cid}-when", {{ autoAlpha: 0, scale: 0.85, y: 16 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }}, 2.56);'''
        return wrap(cid, dur, H, bar, inner, js)
    if cid == "s5-pick":
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, #1a0a1f 0%, {PURPLE} 55%, #1a0a1f 100%)"></div>
      <div id="{cid}-seam" data-layout-allow-overflow style="position:absolute; left:-10%; width:120%; top:50%; height:14px; margin-top:-7px; background:{GOLD}; z-index:34; transform-origin:center; transform: rotate(-6deg)"></div>
      <div id="{cid}-vs" style="position:absolute; left:50%; top:50%; width:260px; height:150px; margin:-75px 0 0 -130px; background:{RED}; color:#fff; font-weight:800; font-style:italic; font-size:96px; line-height:150px; text-align:center; letter-spacing:-2px; z-index:36; box-shadow:0 12px 36px rgba(10,6,12,0.55); opacity:0">VS</div>
      <div id="{cid}-b1" style="position:absolute; left:84px; top:22%; z-index:35; display:flex; align-items:center; gap:24px; opacity:0"><img src="public/badge-braves.png" alt="" style="width:230px; height:auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55))" /><div style="color:#fff; font-weight:800; font-size:62px; line-height:0.95; letter-spacing:-2px; text-transform:uppercase"><div>Lompoc</div><div>Braves</div></div></div>
      <div id="{cid}-b2" style="position:absolute; right:84px; top:calc(50% + 90px); z-index:35; display:flex; flex-direction:row-reverse; align-items:center; gap:24px; text-align:right; opacity:0"><img src="public/badge-conqs.png" alt="" style="width:200px; height:auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55))" /><div style="color:#fff; font-weight:800; font-size:62px; line-height:0.95; letter-spacing:-2px; text-transform:uppercase"><div>Cabrillo</div><div>Conqs</div></div></div>
      <div style="position:absolute; left:84px; right:84px; bottom:19%; z-index:37; text-align:center"><span class="chip" id="{cid}-pick" style="font-size:56px; padding:20px 40px; border-radius:14px">Pick your side</span></div>'''
        js = f'''tl.fromTo("#{cid}-seam", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.45, ease: "expo.out" }}, 0.05);
        tl.fromTo("#{cid}-vs", {{ autoAlpha: 0, scale: 1.8, rotation: -8 }}, {{ autoAlpha: 1, scale: 1, rotation: -8, duration: 0.4, ease: "expo.out" }}, 0.15);
        tl.fromTo("#{cid}-b1", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.20);
        tl.fromTo("#{cid}-b2", {{ autoAlpha: 0, x: 40 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.30);
        tl.fromTo("#{cid}-pick", {{ autoAlpha: 0, scale: 0.8, y: 20 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }}, 0.62);'''
        return wrap(cid, dur, H, bar, inner, js)
    if cid == "s6-end":
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:30%; z-index:20; text-align:center">
        <span id="{cid}-t1" style="display:block; color:#fff; font-weight:800; font-size:78px; line-height:1.0; letter-spacing:-2px; opacity:0">Schedules +<br />game stories</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:44px; background:{GOLD}; color:{INK}; font-weight:800; font-size:44px; letter-spacing:0.5px; padding:20px 40px; border-radius:999px; opacity:0">lompoclocals.com/find/football</span>
        <span id="{cid}-t2" style="display:block; margin-top:34px; color:rgba(255,255,255,0.85); font-weight:600; font-size:34px; letter-spacing:1px; opacity:0">Both schools · every Friday · updated</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 20, scale: 1.05 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, 0.10);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 0.80);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 1.40);'''
        return wrap(cid, dur, H, bar, inner, js)
    raise ValueError(cid)


def subs_scene(H, bar):
    cid = "subs"
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: 170px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      [data-composition-id="{cid}"] .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      [data-composition-id="{cid}"] .sub span {{ display: inline-block; max-width: 920px; background: rgba(0,0,0,0.58); color: #fff; font-weight: 600; font-size: 42px; line-height: 1.25; padding: 14px 28px; border-radius: 20px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
    </style>
    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>
    <script>
      (() => {{
        const SUBS = [
          {subs_js}
        ];
        const tl = gsap.timeline({{ paused: true }});
        SUBS.forEach(([a, b], i) => {{
          tl.fromTo("#sub-" + i, {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" }}, a);
          tl.to("#sub-" + i, {{ autoAlpha: 0, duration: 0.12, ease: "power1.in" }}, b - 0.12);
        }});
        tl.set({{}}, {{}}, {TOTAL:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def progress_scene(H, bar):
    cid = "progress"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .bar {{ position: absolute; left: 0; right: 0; bottom: {bar}px; height: 6px; background: {GOLD}; transform-origin: 0% 50%; transform: scaleX(0); z-index: 70; box-shadow: 0 0 12px rgba(239,198,24,0.6); }}
    </style>
    <div class="bar" id="prog-bar"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true }});
        tl.fromTo("#prog-bar", {{ scaleX: 0 }}, {{ scaleX: 1, duration: {TOTAL:.2f}, ease: "none" }}, 0);
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def index_html(H, folder):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="8"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.5, "v": 0.24}, {"t": %.2f, "v": 0.24}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.2, TOTAL)
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      @font-face {{ font-family: "Plus Jakarta Sans"; src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-style: normal; }}
      html, body {{ margin: 0; width: 1080px; height: {H}px; overflow: hidden; background: {BG}; }}
      body {{ font-family: "Plus Jakarta Sans", sans-serif; }}
      #root {{ position: relative; width: 1080px; height: {H}px; overflow: hidden; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <!-- WEEK 3 FOOTBALL — Fri Sep 11 2026. Braves host Pioneer Valley 7 PM at Huyck; Conqs at Nipomo 7 PM (MaxPreps, verified Sep 11). {TOTAL:.2f}s. Own flyover + character clips. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.70" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.24" data-fade-in="0.5" data-fade-out="1.2" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
      <audio id="sfx-1" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="3.10" data-media-start="0" data-duration="1.20" data-track-index="12" data-volume="0.35" data-fade-out="0.3"></audio>
      <audio id="sfx-2" class="clip" data-audio-group="sfx" src="public/shield-hit.wav" data-start="12.32" data-media-start="0" data-duration="1.60" data-track-index="12" data-volume="0.32" data-fade-out="0.4"></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''


def write(path, s):
    with open(os.path.join(HERE, path), "w") as f:
        f.write(s)


H, bar, folder = 1920, 115, "compositions"
os.makedirs(os.path.join(HERE, folder), exist_ok=True)
for cid, start, dur in SCENES:
    write(f"{folder}/{cid}.html", scene_html(cid, dur, H, bar))
write(f"{folder}/subs.html", subs_scene(H, bar))
write(f"{folder}/progress.html", progress_scene(H, bar))
write("index.html", index_html(H, folder))
print("wrote", [s[0] for s in SCENES], "+ subs, progress, index.html")
