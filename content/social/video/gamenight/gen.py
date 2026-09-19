#!/usr/bin/env python3
"""GAME NIGHT — Fri Sep 18 2026, Lompoc Braves (3-0) host Dublin, 7:00 PM, Huyck Stadium.
13.5 s, 9:16. Arthur read, new stadium bed, our own Big Game clip + Huyck photos. Frame 0 = cover.
  python3 gen.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
X = 0.22
SCENES = [("s1-tonight", 0.00, 4.35), ("s2-matchup", 4.15, 4.25), ("s3-end", 8.20, 5.30)]
TOTAL = 13.50
VO_START = 0.40; VO_DUR = 12.30
SUBS = [
    (0.40, 1.20, "Tonight."),
    (1.43, 2.55, "Seven o'clock."),
    (2.92, 4.05, "Huyck Stadium."),
    (4.49, 6.60, "The Lompoc Braves are 3-0."),
    (6.78, 8.20, "And Dublin's in town."),
    (8.49, 12.40, "Every score at lompoclocals.com/football"),
]
GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"; CREAM = "#f2ead9"

def css(cid):
    return f"""
      [data-composition-id="{cid}"] .stage {{ position:absolute; inset:0; opacity:0; will-change:opacity; }}
      [data-composition-id="{cid}"] .vig {{ position:absolute; inset:0; z-index:30; pointer-events:none; background:radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 62%, rgba(10,6,12,0.5) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position:absolute; inset:0; pointer-events:none; opacity:0.08; z-index:50; background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position:absolute; top:150px; right:84px; width:96px; height:auto; z-index:44; }}
      [data-composition-id="{cid}"] video, [data-composition-id="{cid}"] .cover {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }}
      [data-composition-id="{cid}"] .scrim {{ position:absolute; inset:0; z-index:31; pointer-events:none; background:linear-gradient(to top, rgba(20,10,23,0.95) 0%, rgba(20,10,23,0.62) 38%, rgba(20,10,23,0.12) 70%); }}
      [data-composition-id="{cid}"] .chip {{ display:inline-block; background:{GOLD}; color:{INK}; font-weight:800; font-size:34px; letter-spacing:4px; padding:14px 28px; border-radius:10px; text-transform:uppercase; }}
      [data-composition-id="{cid}"] .hero {{ display:block; color:#fff; font-weight:800; line-height:0.94; letter-spacing:-4px; text-shadow:0 8px 34px rgba(10,6,12,0.7); }}
    """

def wrap(cid, dur, inner, js, first=False):
    fade = (f'tl.set("#{cid}-stage", {{ autoAlpha:1 }}, 0);' if first
            else f'tl.fromTo("#{cid}-stage", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:{X}, ease:"power1.inOut" }}, 0);')
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{dur:.2f}" style="position:absolute; inset:0; overflow:hidden; background:{BG if first else 'transparent'}">
    <style>{css(cid)}
    </style>
    <div class="stage" id="{cid}-stage"{' style="opacity:1"' if first else ''}>
      {inner}
      <div class="vig"></div>
    </div>
    <img class="mark" src="public/mark-white.png" alt="" />
    <div class="grain"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused:true, defaults:{{ ease:"power4.out", duration:0.45 }} }});
        {fade}
        {js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def scene_html(cid, dur):
    if cid == "s1-tonight":
        inner = f'''<video id="{cid}-v" class="clip" src="public/n2-brave-ready.mp4" data-start="0" data-media-start="0.30" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="filter:brightness(0.72)"></video>
      <div class="scrim"></div>
      <div style="position:absolute; left:84px; top:300px; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:1">Friday night · Week 4</span></div>
      <div style="position:absolute; left:84px; right:84px; bottom:24%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:158px; opacity:1">TONIGHT</span>
        <span id="{cid}-h2" style="display:block; margin-top:26px; color:{GOLD}; font-weight:800; font-size:70px; letter-spacing:-1px; opacity:1">7:00 PM · Huyck Stadium</span>
      </div>'''
        js = (f'tl.fromTo("#{cid}-h1", {{ scale:1.06 }}, {{ scale:1, duration:1.4, ease:"power2.out" }}, 0);'
              f'tl.fromTo("#{cid}-h2", {{ autoAlpha:0, y:16 }}, {{ autoAlpha:1, y:0, duration:0.4 }}, 1.45);')
        return wrap(cid, dur, inner, js, first=True)
    if cid == "s2-matchup":
        inner = f'''<img class="cover" src="public/huyck-stadium.jpg" alt="" style="filter:brightness(0.5) saturate(0.95)" />
      <div class="scrim"></div>
      <div style="position:absolute; left:84px; right:84px; top:31%; z-index:36; text-align:center">
        <img id="{cid}-badge" src="public/badge-braves.png" alt="" style="width:270px; height:auto; opacity:0; filter:drop-shadow(0 10px 26px rgba(0,0,0,0.6))" />
        <span id="{cid}-rec" style="display:inline-block; margin-top:22px; background:{GOLD}; color:{INK}; font-weight:800; font-size:52px; padding:12px 30px; border-radius:12px; opacity:0">3–0</span>
        <span id="{cid}-vs" style="display:block; margin-top:34px; color:rgba(255,255,255,0.72); font-weight:800; font-size:36px; letter-spacing:8px; opacity:0">VS</span>
        <span id="{cid}-opp" style="display:block; margin-top:16px; color:#fff; font-weight:800; font-size:96px; letter-spacing:-3px; opacity:0">DUBLIN</span>
      </div>'''
        js = (f'tl.fromTo("#{cid}-badge", {{ autoAlpha:0, scale:1.5 }}, {{ autoAlpha:1, scale:1, duration:0.42, ease:"expo.out" }}, 0.15);'
              f'tl.fromTo("#{cid}-rec", {{ autoAlpha:0, y:14 }}, {{ autoAlpha:1, y:0, duration:0.35 }}, 0.60);'
              f'tl.fromTo("#{cid}-vs", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.3 }}, 1.85);'
              f'tl.fromTo("#{cid}-opp", {{ autoAlpha:0, scale:1.15 }}, {{ autoAlpha:1, scale:1, duration:0.4, ease:"expo.out" }}, 2.20);')
        return wrap(cid, dur, inner, js)
    if cid == "s3-end":
        inner = f'''<div style="position:absolute; inset:0; background:linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:28%; z-index:20; text-align:center">
        <img id="{cid}-b" src="public/badge-braves.png" alt="" style="width:200px; height:auto; opacity:0" />
        <span id="{cid}-t1" style="display:block; margin-top:34px; color:#fff; font-weight:800; font-size:92px; line-height:1.0; letter-spacing:-3px; opacity:0">Every score.<br />Every Friday.</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:44px; background:{GOLD}; color:{INK}; font-weight:800; font-size:44px; padding:20px 38px; border-radius:999px; opacity:0">lompoclocals.com/football</span>
        <span id="{cid}-t2" style="display:block; margin-top:30px; color:rgba(255,255,255,0.85); font-weight:600; font-size:32px; opacity:0">Both schools · schedules · scores · game stories</span>
      </div>'''
        js = (f'tl.fromTo("#{cid}-b", {{ autoAlpha:0, y:18 }}, {{ autoAlpha:1, y:0, duration:0.4 }}, 0.15);'
              f'tl.fromTo("#{cid}-t1", {{ autoAlpha:0, y:20, scale:1.05 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.45, ease:"expo.out" }}, 0.30);'
              f'tl.fromTo("#{cid}-pill", {{ autoAlpha:0, y:14, scale:0.95 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.45, ease:"back.out(1.4)" }}, 1.70);'
              f'tl.fromTo("#{cid}-t2", {{ autoAlpha:0, y:10 }}, {{ autoAlpha:1, y:0, duration:0.35 }}, 2.60);')
        return wrap(cid, dur, inner, js)
    raise ValueError(cid)

def subs_scene():
    cid = "subs"
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    js = ",\n          ".join(f"[{a:.2f}, {b:.2f}]" for a, b, _ in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position:absolute; left:60px; right:60px; bottom:310px; z-index:70; display:flex; justify-content:center; }}
      [data-composition-id="{cid}"] .sub {{ position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:center; opacity:0; }}
      [data-composition-id="{cid}"] .sub span {{ display:inline-block; max-width:920px; background:rgba(0,0,0,0.64); color:#fff; font-weight:600; font-size:42px; line-height:1.25; padding:14px 28px; border-radius:20px; text-align:center; }}
    </style>
    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>
    <script>
      (() => {{
        const S = [
          {js}
        ];
        const tl = gsap.timeline({{ paused:true }});
        S.forEach(([a,b], i) => {{
          tl.fromTo("#sub-"+i, {{ autoAlpha:0, y:10 }}, {{ autoAlpha:1, y:0, duration:0.12 }}, a);
          tl.to("#sub-"+i, {{ autoAlpha:0, duration:0.1 }}, b-0.1);
        }});
        tl.set({{}}, {{}}, {TOTAL:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def progress_scene():
    cid = "progress"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>[data-composition-id="{cid}"] .bar {{ position:absolute; left:0; right:0; bottom:0; height:8px; background:{GOLD}; transform-origin:0% 50%; transform:scaleX(0); z-index:70; box-shadow:0 0 12px rgba(239,198,24,0.6); }}</style>
    <div class="bar" id="prog-bar"></div>
    <script>
      (() => {{ const tl = gsap.timeline({{paused:true}});
        tl.fromTo("#prog-bar", {{scaleX:0}}, {{scaleX:1, duration:{TOTAL:.2f}, ease:"none"}}, 0);
        window.__timelines["{cid}"] = tl; }})();
    </script>
  </div>
</template>
'''

def index_html():
    rows = [f'      <div id="el-{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.2f}" data-duration="{d:.2f}" data-track-index="{i+1}"></div>' for i,(c,s,d) in enumerate(SCENES)]
    n = len(SCENES)
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="compositions/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="compositions/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+2}"></div>')
    a0 = n + 3
    auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.4, "v": 0.28}, {"t": %.2f, "v": 0.28}, {"t": %.2f, "v": 0}]}]}' % (TOTAL-1.2, TOTAL)
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      @font-face {{ font-family:"Plus Jakarta Sans"; src:url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight:200 800; font-style:normal; }}
      html, body {{ margin:0; width:1080px; height:1920px; overflow:hidden; background:{BG}; }}
      body {{ font-family:"Plus Jakarta Sans", sans-serif; }}
      #root {{ position:relative; width:1080px; height:1920px; overflow:hidden; }}
      #root > div[data-composition-src] {{ position:absolute; inset:0; }}
    </style>
  </head>
  <body>
    <!-- GAME NIGHT — Fri Sep 18 2026. Braves (3-0) vs Dublin, 7 PM, Huyck. Own clips + photos. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="1920">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="{a0}" data-volume="0.76" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{a0+1}" data-volume="0.28" data-fade-in="0.4" data-fade-out="1.2" data-automation='{auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
      <audio id="sfx-1" class="clip" data-audio-group="sfx" src="public/shield-hit.wav" data-start="4.15" data-media-start="0" data-duration="1.40" data-track-index="{a0+2}" data-volume="0.30" data-fade-out="0.4"></audio>
      <audio id="sfx-2" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="8.20" data-media-start="0" data-duration="1.20" data-track-index="{a0+2}" data-volume="0.26" data-fade-out="0.3"></audio>
    </div>
    <script>window.__timelines["main"] = gsap.timeline({{ paused:true }});</script>
  </body>
</html>
'''

os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)
for c, s, d in SCENES:
    open(os.path.join(HERE, f"compositions/{c}.html"), "w").write(scene_html(c, d))
open(os.path.join(HERE, "compositions/subs.html"), "w").write(subs_scene())
open(os.path.join(HERE, "compositions/progress.html"), "w").write(progress_scene())
open(os.path.join(HERE, "index.html"), "w").write(index_html())
print("wrote", [s[0] for s in SCENES])
