#!/usr/bin/env python3
"""
FOOTBALL HUB — "Lompoc football. One page." (Wed Sep 16 2026). Sells lompoclocals.com/football:
phone dead-center showing CURATED captures of the live page (own asset), Arthur announcer read,
brand-new bed, own SFX, own Big Game clip inside the Watch tile. 28.0 s, 9:16. Frame 0 = poster cover.
  python3 gen.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
X = 0.25
SCENES = [
    ("s1-open",    0.00, 3.50),
    ("s2-week",    3.30, 5.30),
    ("s3-scores",  8.40, 4.40),
    ("s4-sched",  12.60, 2.80),
    ("s5-news",   15.20, 1.30),
    ("s5b-watch", 16.30, 2.60),
    ("s6-connect",18.70, 2.80),
    ("s7-end",    21.30, 6.70),
]
TOTAL = 28.00
VO_START = 0.60; VO_DUR = 20.62
CLOSER_START = 21.40; CLOSER_DUR = 6.46
SUBS = [
    (0.60, 3.20, "Lompoc. Kickoff is Thursday."),
    (3.50, 5.55, "Two home games at Huyck Stadium this week."),
    (5.98, 8.20, "Conqs Thursday. Braves Friday."),
    (8.68, 11.10, "Every final score. Both schools."),
    (11.44, 12.35, "The morning after."),
    (12.78, 14.80, "The whole season, next game marked."),
    (15.32, 18.45, "Game stories, our videos, and where to be on Friday night."),
    (18.88, 19.55, "Get alerts."),
    (19.82, 21.00, "Send it to the group chat."),
    (21.40, 24.20, "Lompoc football. One page."),
    (24.58, 27.70, "lompoclocals.com/football"),
]
GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"; BG = "#140a17"
K = 3 * 800 / 1179  # css px on the phone -> canvas px (capture @3x, screen 800 wide)
PH_LEFT, PH_TOP = 140, 250  # phone screen, dead-center (computed left)

def css(cid):
    return f"""
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 120% 70% at 50% 28%, #16c247 0%, {GREEN} 32%, #0a5a20 70%, #052e12 100%); }}
      [data-composition-id="{cid}"] .yards {{ position: absolute; inset: 0; background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.11) 0 5px, transparent 5px 150px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.25)); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.25)); }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(5,20,10,0) 62%, rgba(5,20,10,0.45) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.07; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position: absolute; top: 150px; right: 84px; width: 96px; height: auto; z-index: 40; }}
      [data-composition-id="{cid}"] .chip {{ position: absolute; left: 84px; top: 156px; z-index: 40; display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 32px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .phone {{ position: absolute; left: {PH_LEFT-22}px; top: {PH_TOP-22}px; width: 844px; height: 1804px; border-radius: 92px; background: #0c0810; box-shadow: 0 40px 90px rgba(0,0,0,0.55), inset 0 0 0 3px rgba(255,255,255,0.10); z-index: 20; will-change: transform; }}
      [data-composition-id="{cid}"] .screen {{ position: absolute; left: 22px; top: 22px; width: 800px; height: 1760px; overflow: hidden; border-radius: 70px; background: #fff; }}
      [data-composition-id="{cid}"] .strip {{ position: absolute; left: 0; top: 0; width: 800px; will-change: transform; }}
      [data-composition-id="{cid}"] .strip img {{ display: block; width: 800px; height: auto; }}
      [data-composition-id="{cid}"] .ring {{ position: absolute; border: 6px solid {GOLD}; border-radius: 22px; box-shadow: 0 0 0 8px rgba(239,198,24,0.28), 0 0 40px rgba(239,198,24,0.45); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .badge {{ position: absolute; width: 190px; height: auto; z-index: 36; filter: drop-shadow(0 10px 24px rgba(0,0,0,0.5)); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; left: 0; right: 0; bottom: 0; height: 720px; z-index: 25; pointer-events: none; background: linear-gradient(to top, rgba(5,20,10,0.96) 0%, rgba(5,20,10,0.80) 35%, rgba(5,20,10,0) 100%); }}
    """

def wrap(cid, dur, inner, js, first=False, root_bg=None, chip=None):
    fade = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if first
            else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    chip_html = f'<span class="chip" id="{cid}-chip">{chip}</span>' if chip else ""
    chip_js = f'tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: -12 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, {X + 0.05:.2f});' if chip else ""
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {root_bg or 'transparent'}">
    <style>{css(cid)}
    </style>
    <div class="stage" id="{cid}-stage"{' style="opacity:1"' if first else ''}>
      {inner}
      <div class="vig"></div>
    </div>
    {chip_html}
    <img class="mark" src="public/mark-white.png" alt="" />
    <div class="grain"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power4.out", duration: 0.5 }} }});
        {fade}
        {chip_js}
        {js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def ring(cid, i, x, y, w, h, pad=12):
    return f'<div class="ring" id="{cid}-ring{i}" style="left:{x-pad}px; top:{y-pad}px; width:{w+2*pad}px; height:{h+2*pad}px"></div>'

def ring_js(cid, i, at):
    return (f'tl.fromTo("#{cid}-ring{i}", {{ autoAlpha: 0, scale: 1.25 }}, {{ autoAlpha: 1, scale: 1, duration: 0.38, ease: "expo.out" }}, {at:.2f});'
            f'tl.to("#{cid}-ring{i}", {{ scale: 1.03, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3 }}, {at+0.4:.2f});')

def phone_scene(cid, dur, strip, hold_css, lead_css=110, extras="", extra_js="", chip=None, first=False, phone_top=PH_TOP):
    hold = -hold_css * K
    lead = -(hold_css - lead_css) * K
    inner = f'''<div class="field"></div><div class="yards"></div>
      <div class="phone" id="{cid}-phone" style="top:{phone_top-22}px">
        <div class="screen"><div class="strip" id="{cid}-strip" data-layout-allow-overflow><img src="public/{strip}" alt="" />{extras}</div></div>
      </div>
      <div class="scrim"></div>'''
    js = (f'tl.fromTo("#{cid}-strip", {{ y: {lead:.1f} }}, {{ y: {hold:.1f}, duration: 0.75, ease: "expo.out" }}, 0.05);' if lead_css else f'tl.set("#{cid}-strip", {{ y: {hold:.1f} }}, 0);') + extra_js
    return wrap(cid, dur, inner, js, first=first, root_bg=(BG if first else None), chip=chip)

def scene_html(cid, dur):
    if cid == "s1-open":
        # COVER (frame 0): green field, lockup, phone lower. At 0.6 the lockup exits and the phone rises to PH_TOP.
        rise = PH_TOP - 560
        inner = f'''<div class="field"></div><div class="yards"></div>
      <div id="{cid}-lock" style="position:absolute; left:84px; right:84px; top:150px; z-index:36; text-align:center">
        <span style="display:inline-block; background:{GOLD}; color:{INK}; font-weight:800; font-size:32px; letter-spacing:4px; padding:14px 28px; border-radius:10px; text-transform:uppercase">New page</span>
        <span style="display:block; margin-top:34px; color:#fff; font-weight:800; font-size:142px; line-height:0.92; letter-spacing:-6px; text-shadow:0 10px 40px rgba(0,0,0,0.4)">LOMPOC<br /><span style="color:{GOLD}">FOOTBALL</span></span>
      </div>
      <div class="phone" id="{cid}-phone" style="top:{560-22}px">
        <div class="screen"><div class="strip" id="{cid}-strip" data-layout-allow-overflow><img src="public/strip-hero.png" alt="" /></div></div>
      </div>
      <div class="scrim"></div>'''
        js = f'''tl.set("#{cid}-strip", {{ y: 0 }}, 0);
        tl.to("#{cid}-lock", {{ autoAlpha: 0, y: -60, duration: 0.45, ease: "power3.in" }}, 0.62);
        tl.to("#{cid}-phone", {{ y: {rise}, duration: 0.9, ease: "expo.inOut" }}, 0.70);
        tl.to("#{cid}-strip", {{ y: {-60*K:.1f}, duration: 1.6, ease: "power2.inOut" }}, 1.60);'''
        return wrap(cid, dur, inner, js, first=True, root_bg=BG)
    if cid == "s2-week":
        # hold scroll 120: both cards whole. Conqs pill (y743) rings at "Conqs Thursday" (5.98 abs -> 2.68 rel); Braves pill (y487) at 7.20 abs -> 3.90 rel
        ex = ring(cid, 1, 37*K, 743*K, 162*K, 24*K) + ring(cid, 2, 37*K, 487*K, 162*K, 24*K)
        bad = f'<img class="badge" id="{cid}-b1" src="public/badge-conqs.png" alt="" style="left:-20px; top:{PH_TOP + (548-190)*K + 40:.0f}px" /><img class="badge" id="{cid}-b2" src="public/badge-braves.png" alt="" style="right:-20px; top:{PH_TOP + (292-190)*K + 40:.0f}px" />'
        js = ring_js(cid, 1, 2.68) + ring_js(cid, 2, 3.90) + \
             f'tl.fromTo("#{cid}-b1", {{ autoAlpha: 0, x: -60, rotation: -8 }}, {{ autoAlpha: 1, x: 0, rotation: -8, duration: 0.45, ease: "back.out(1.6)" }}, 2.68);' + \
             f'tl.fromTo("#{cid}-b2", {{ autoAlpha: 0, x: 60, rotation: 8 }}, {{ autoAlpha: 1, x: 0, rotation: 8, duration: 0.45, ease: "back.out(1.6)" }}, 3.90);'
        html = phone_scene(cid, dur, "strip-hero.png", 190, lead_css=70, extras=ex, extra_js=js, chip="Thu 9/17 · Fri 9/18")
        return html.replace('<div class="scrim"></div>', bad + '<div class="scrim"></div>')
    if cid == "s3-scores":
        ex = "".join(ring(cid, i+1, 16*K, (y-1440)*K, 361*K, 111*K, pad=6) for i, y in enumerate([1589, 1712]))
        js = ring_js(cid, 1, 0.55) + ring_js(cid, 2, 2.15)
        return phone_scene(cid, dur, "strip-scores.png", 0, lead_css=110, extras=ex, extra_js=js, chip="Updated after every game")
    if cid == "s4-sched":
        ex = ring(cid, 1, 17*K, (2471-2080)*K, 361*K, 53*K, pad=8)
        return phone_scene(cid, dur, "strip-sched.png", 0, lead_css=110, extras=ex, extra_js=ring_js(cid, 1, 0.95), chip="Full season · both schools")
    if cid == "s5-news":
        return phone_scene(cid, dur, "strip-news.png", 0, lead_css=110, chip="From the news desk")
    if cid == "s5b-watch":
        x, y, w, h = 17*K, (6169-6030)*K, 359*K, 638*K
        ex = f'<video id="{cid}-clip" class="clip" src="public/watch-clip.mp4" data-start="0" data-media-start="0" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="position:absolute; left:{x:.0f}px; top:{y:.0f}px; width:{w:.0f}px; height:{h:.0f}px; object-fit:cover; border-radius:40px; display:block"></video>'
        return phone_scene(cid, dur, "strip-watch.png", 70, lead_css=90, extras=ex, chip="Big Game · Week 3 · more")
    if cid == "s6-connect":
        ex = ring(cid, 1, 16*K, (1062-840)*K, 175*K, 176*K, pad=6)
        return phone_scene(cid, dur, "strip-connect.png", 0, lead_css=110, extras=ex, extra_js=ring_js(cid, 1, 1.15), chip="No app needed")
    if cid == "s7-end":
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:22%; z-index:20; text-align:center">
        <div id="{cid}-badges" style="display:flex; justify-content:center; gap:40px; opacity:0"><img src="public/badge-braves.png" alt="" style="width:170px; height:auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55))" /><img src="public/badge-conqs.png" alt="" style="width:170px; height:auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55))" /></div>
        <span id="{cid}-t1" style="display:block; margin-top:50px; color:#fff; font-weight:800; font-size:96px; line-height:1.0; letter-spacing:-3px; opacity:0">Lompoc football.<br />One page.</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:48px; background:{GOLD}; color:{INK}; font-weight:800; font-size:44px; letter-spacing:0.5px; padding:20px 40px; border-radius:999px; opacity:0">lompoclocals.com/football</span>
        <span id="{cid}-t2" style="display:block; margin-top:34px; color:rgba(255,255,255,0.85); font-weight:600; font-size:32px; letter-spacing:1px; opacity:0">Braves · Conqs · kickoffs · scores · schedules · stories · videos</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-badges", {{ autoAlpha: 0, y: 20 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 0.20);
        tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 20, scale: 1.05 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, 0.35);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 3.25);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 4.40);'''
        return wrap(cid, dur, inner, js)
    raise ValueError(cid)

def subs_scene():
    cid = "subs"
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: 310px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      [data-composition-id="{cid}"] .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      [data-composition-id="{cid}"] .sub span {{ display: inline-block; max-width: 920px; background: rgba(0,0,0,0.62); color: #fff; font-weight: 600; font-size: 42px; line-height: 1.25; padding: 14px 28px; border-radius: 20px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
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

def progress_scene():
    cid = "progress"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .bar {{ position: absolute; left: 0; right: 0; bottom: 0; height: 8px; background: {GOLD}; transform-origin: 0% 50%; transform: scaleX(0); z-index: 70; box-shadow: 0 0 12px rgba(239,198,24,0.6); }}
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

def index_html():
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="compositions/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{len(SCENES)+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="compositions/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{len(SCENES)+2}"></div>')
    a0 = len(SCENES) + 3
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.5, "v": 0.26}, {"t": %.2f, "v": 0.26}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.4, TOTAL)
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      @font-face {{ font-family: "Plus Jakarta Sans"; src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-style: normal; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: {BG}; }}
      body {{ font-family: "Plus Jakarta Sans", sans-serif; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <!-- FOOTBALL HUB — Sep 16 2026. Live-page captures (own), Arthur read, new bed, own SFX, own Big Game clip. {TOTAL:.2f}s. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="1920">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo-body.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="{a0}" data-volume="0.72" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="vo2" class="clip" data-audio-group="voiceover" src="public/vo-closer.wav" data-start="{CLOSER_START:.2f}" data-media-start="0" data-duration="{CLOSER_DUR:.2f}" data-track-index="{a0}" data-volume="0.72" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed28.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{a0+1}" data-volume="0.26" data-fade-in="0.5" data-fade-out="1.4" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
      <audio id="sfx-1" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="0.66" data-media-start="0" data-duration="1.20" data-track-index="{a0+2}" data-volume="0.28" data-fade-out="0.3"></audio>
      <audio id="sfx-2" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="8.40" data-media-start="0" data-duration="1.20" data-track-index="{a0+2}" data-volume="0.22" data-fade-out="0.3"></audio>
      <audio id="sfx-3" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="15.20" data-media-start="0" data-duration="1.20" data-track-index="{a0+2}" data-volume="0.22" data-fade-out="0.3"></audio>
      <audio id="sfx-4" class="clip" data-audio-group="sfx" src="public/shield-hit.wav" data-start="21.30" data-media-start="0" data-duration="1.40" data-track-index="{a0+2}" data-volume="0.30" data-fade-out="0.4"></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''

def write(path, s):
    with open(os.path.join(HERE, path), "w") as f: f.write(s)

os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)
for cid, start, dur in SCENES: write(f"compositions/{cid}.html", scene_html(cid, dur))
write("compositions/subs.html", subs_scene()); write("compositions/progress.html", progress_scene()); write("index.html", index_html())
print("wrote", [s[0] for s in SCENES], "+ subs, progress, index.html")
