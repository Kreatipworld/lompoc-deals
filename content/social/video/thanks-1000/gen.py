#!/usr/bin/env python3
"""
1,000 TikTok followers — thank you, Lompoc. Sun Sep 13 2026. 27.0 s, 9:16.
Arthur (warm) read at 0.60, new celebration bed, only our own media (Big Game clips, Huyck, member photos,
news cover, Toro Loco storefront). Generated from this file:

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    # id,           start, dur
    ("s1-count",    0.00,  2.90),   # 0 → 1,000 count-up, confetti
    ("s2-stadium",  2.70,  3.20),   # Huyck · "A whole section of Huyck"
    ("s3-thanks",   5.70,  4.30),   # 3-cut montage · watching / sharing / showing up
    ("s4-every",    9.90,  3.70),   # every game · every business · every story
    ("s5-support",  13.50, 5.90),   # keep supporting your town · 3 chips
    ("s6-end",      19.30, 7.70),   # we're just getting started · wordmark · pill
]
TOTAL = 27.00
VO_START = 0.60
VO_DUR = 25.10

# burned-in captions (absolute seconds from ASR word times + 0.60)
SUBS = [
    (0.60, 2.40, "1,000 of you."),
    (2.84, 5.60, "In Lompoc, that's a whole section of Huyck Stadium."),
    (6.36, 10.00, "Thank you for watching, for sharing, and for showing up for this town."),
    (10.74, 13.30, "Every game, every business, every story."),
    (14.16, 15.20, "Keep supporting your town."),
    (15.86, 19.00, "Shop local, share the stories, show up on Friday nights."),
    (19.68, 21.00, "We're just getting started."),
    (21.02, 22.60, "Lompoc Locals."),
    (23.06, 25.40, "All of Lompoc, in one place."),
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"


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
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.08) saturate(1.05) brightness(0.72); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.94) 0%, rgba(20,10,23,0.72) 34%, rgba(20,10,23,0.15) 62%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.76) 0%, rgba(20,10,23,0.28) 22%, rgba(20,10,23,0.0) 38%); }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 34px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .hero {{ display: block; color: #fff; text-shadow: 0 6px 30px rgba(10,6,12,0.7); font-weight: 800; font-size: 118px; line-height: 0.96; letter-spacing: -5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .pill {{ display: inline-block; background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.35); color: #fff; font-weight: 700; font-size: 30px; letter-spacing: 2px; padding: 12px 26px; border-radius: 999px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .big {{ display: block; color: #fff; font-weight: 800; font-size: 118px; line-height: 0.96; letter-spacing: -5px; text-shadow: 0 8px 36px rgba(10,6,12,0.75); opacity: 0; will-change: transform, opacity; }}
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
    if cid == "s1-count":
        # abs: count 0.30→1.40 · gold landing 1.40 · sub 1.50
        inner = f'''<div style="position:absolute; inset:0; background: radial-gradient(ellipse 90% 70% at 50% 40%, {PURPLE} 0%, #2c0736 70%, #1a0520 100%)"></div>
      <video id="{cid}-fx" class="clip" src="public/fx-particles.mp4" data-start="0" data-media-start="0.20" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="mix-blend-mode: screen; opacity: 0.55; z-index: 5"></video>
      <div style="position:absolute; left:0; right:0; top:22%; z-index:36; text-align:center">
        <span class="pill" id="{cid}-pill">@lompoclocals · TikTok</span>
      </div>
      <div style="position:absolute; left:0; right:0; top:34%; z-index:36; text-align:center">
        <span id="{cid}-num" style="display:block; color:#fff; font-weight:800; font-size:300px; line-height:0.9; letter-spacing:-14px; font-variant-numeric: tabular-nums; text-shadow: 0 10px 50px rgba(10,6,12,0.7); opacity:0; will-change: transform, opacity, color">1,000</span>
        <span id="{cid}-sub" style="display:block; margin-top:80px; color:rgba(255,255,255,0.92); font-weight:700; font-size:44px; letter-spacing:1px; opacity:0; will-change: transform, opacity">followers · thank you, Lompoc</span>
      </div>'''
        # poster frame 0 = pill + gold "1,000" + sub (clean cover); at 0.30 the counter resets and spins 0 → 1,000
        js = f'''tl.set("#{cid}-pill", {{ autoAlpha: 1 }}, 0);
        tl.set("#{cid}-num", {{ autoAlpha: 1, color: "{GOLD}" }}, 0);
        tl.set("#{cid}-sub", {{ autoAlpha: 1 }}, 0);
        {{ const o = {{ v: 1000 }}; const el = document.querySelector("#{cid}-num");
          tl.set(o, {{ v: 0 }}, 0.30);
          tl.set("#{cid}-num", {{ color: "#ffffff" }}, 0.30);
          tl.to(o, {{ v: 1000, duration: 1.10, ease: "power3.out", onUpdate: () => {{ el.textContent = Math.round(o.v).toLocaleString("en-US"); }} }}, 0.30); }}
        tl.to("#{cid}-num", {{ color: "{GOLD}", scale: 1.04, duration: 0.18, ease: "power2.out" }}, 1.40);
        tl.to("#{cid}-num", {{ scale: 1.0, duration: 0.35, ease: "back.out(2)" }}, 1.58);'''
        return wrap(cid, dur, H, bar, inner, js, first=True)

    if cid == "s2-stadium":
        # abs 2.70 · chip at 3.6 → rel 0.9
        inner = f'''<video id="{cid}-v" class="clip" src="public/fly-dive.mp4" data-start="0" data-media-start="0.60" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="filter: brightness(0.78)"></video>
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; right:84px; bottom:24%; z-index:36">
        <span class="chip" id="{cid}-chip" style="font-size:40px; padding:18px 32px; white-space:normal; line-height:1.15">A whole section<br />of Huyck</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 22, rotation: -2 }}, {{ autoAlpha: 1, y: 0, rotation: -2, duration: 0.45, ease: "expo.out" }}, 0.90);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s3-thanks":
        # abs 5.70 · cuts at rel 0 / 1.45 / 2.90 · words: watching 6.94→1.24 · sharing 7.84→2.14 · showing up 9.02→3.32
        inner = f'''<video id="{cid}-a" class="clip" src="public/n2-brave-ready.mp4" data-start="0" data-media-start="0.60" data-duration="1.45" data-track-index="0" muted playsinline style="filter: brightness(0.7)"></video>
      <video id="{cid}-b" class="clip" src="public/fly-dive.mp4" data-start="1.45" data-media-start="4.20" data-duration="1.45" data-track-index="1" muted playsinline style="filter: brightness(0.75)"></video>
      <video id="{cid}-c" class="clip" src="public/clip-conq2-reveal.mp4" data-start="2.90" data-media-start="0.80" data-duration="1.40" data-track-index="2" muted playsinline style="filter: brightness(0.7)"></video>
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="chip" id="{cid}-pill" style="font-size:36px; padding:16px 30px">Thank you</span></div>
      <div style="position:absolute; left:84px; right:84px; bottom:26%; z-index:36" data-layout-allow-overlap>
        <span class="big" id="{cid}-w1" style="position:absolute; left:0; bottom:0">watching.</span>
        <span class="big" id="{cid}-w2" style="position:absolute; left:0; bottom:0">sharing.</span>
        <span class="big" id="{cid}-w3" style="position:absolute; left:0; bottom:0">showing up.</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: -10 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, 0.30);
        tl.fromTo("#{cid}-w1", {{ autoAlpha: 0, y: 30, scale: 1.1 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.36, ease: "expo.out" }}, 1.24);
        tl.to("#{cid}-w1", {{ autoAlpha: 0, duration: 0.15 }}, 2.00);
        tl.fromTo("#{cid}-w2", {{ autoAlpha: 0, y: 30, scale: 1.1 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.36, ease: "expo.out" }}, 2.14);
        tl.to("#{cid}-w2", {{ autoAlpha: 0, duration: 0.15 }}, 3.16);
        tl.fromTo("#{cid}-w3", {{ autoAlpha: 0, y: 30, scale: 1.1 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.36, ease: "expo.out" }}, 3.32);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s4-every":
        # abs 9.90 · game 10.74→0.84 · business 11.96→2.06 · story 13.0→3.10
        tile = "position:relative; overflow:hidden; border-radius:22px; background:#1a0a1f; height:560px; opacity:0; will-change: transform, opacity; box-shadow: 0 16px 40px rgba(10,6,12,0.5)"
        lab = "position:absolute; left:0; right:0; bottom:0; padding:18px 22px; background: linear-gradient(to top, rgba(20,10,23,0.92), rgba(20,10,23,0)); color:#fff; font-weight:800; font-size:34px; letter-spacing:1px; text-transform:uppercase"
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, #1a0a1f 0%, {PURPLE} 55%, #1a0a1f 100%)"></div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="chip" id="{cid}-pill" style="font-size:36px; padding:16px 30px">Every week</span></div>
      <div style="position:absolute; left:64px; right:64px; top:22%; z-index:35; display:grid; grid-template-columns: 1fr; gap:22px">
        <div id="{cid}-t1" style="{tile}; height:380px"><img src="public/huyck-goalposts.jpg" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 30%; filter: brightness(0.85)" /><div style="{lab}">Every game</div></div>
        <div id="{cid}-t2" style="{tile}; height:380px"><div style="position:absolute; inset:0; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:6px">
          <img src="public/m-clark-builders-inc.jpg" alt="" style="width:100%; height:100%; object-fit:cover" /><img src="public/m-hangar-7-social-house.jpg" alt="" style="width:100%; height:100%; object-fit:cover" /><img src="public/m-coastal-tint.jpg" alt="" style="width:100%; height:100%; object-fit:cover" /><img src="public/m-the-garden-shoppe.jpg" alt="" style="width:100%; height:100%; object-fit:cover" />
        </div><div style="{lab}">Every business</div></div>
        <div id="{cid}-t3" style="{tile}; height:380px"><img src="public/civic.jpg" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 40%; filter: brightness(0.85)" /><div style="{lab}">Every story</div></div>
      </div>'''
        js = f'''tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: -10 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, 0.10);
        tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 40, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 0.84);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 40, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 2.06);
        tl.fromTo("#{cid}-t3", {{ autoAlpha: 0, y: 40, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 3.10);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s5-support":
        # abs 13.50 · title 14.16→0.66 · chips 15.9→2.40 · 16.9→3.40 · 18.2→4.70
        inner = f'''<div class="wrap" id="{cid}-w0" data-layout-allow-overflow><img class="cover" src="public/store.jpg" alt="" style="object-position: 50% 55%" /></div>
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; right:84px; top:24%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:96px">Keep supporting<br />your town.</span>
      </div>
      <div style="position:absolute; left:84px; right:84px; bottom:24%; z-index:36; display:flex; flex-direction:column; align-items:flex-start; gap:16px">
        <span class="chip" id="{cid}-c1">Shop local</span>
        <span class="chip" id="{cid}-c2">Share the stories</span>
        <span class="chip" id="{cid}-c3">Show up Friday nights</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-w0", {{ scale: 1.06 }}, {{ scale: 1.0, duration: {dur:.2f}, ease: "none" }}, 0);
        tl.fromTo("#{cid}-h1", {{ autoAlpha: 0, y: 26, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 0.66);
        tl.fromTo("#{cid}-c1", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.38, ease: "expo.out" }}, 2.40);
        tl.fromTo("#{cid}-c2", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.38, ease: "expo.out" }}, 3.40);
        tl.fromTo("#{cid}-c3", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.38, ease: "expo.out" }}, 4.70);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s6-end":
        # abs 19.30 · t1 19.7→0.40 · wordmark 21.0→1.70 · tagline 23.1→3.80 · pill 24.6→5.30 · follow 25.4→6.10
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:24%; z-index:20; text-align:center">
        <span id="{cid}-t1" style="display:block; color:rgba(255,255,255,0.9); font-weight:700; font-size:50px; letter-spacing:-0.5px; opacity:0">We're just getting started.</span>
        <span id="{cid}-wm" style="display:block; margin-top:40px; color:#fff; font-weight:800; font-size:112px; line-height:0.94; letter-spacing:-4px; opacity:0">LOMPOC<br />LOCALS</span>
        <span id="{cid}-t2" style="display:block; margin-top:30px; color:{GOLD}; font-weight:700; font-size:40px; letter-spacing:0.5px; opacity:0">All of Lompoc, in one place.</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:44px; background:{GOLD}; color:{INK}; font-weight:800; font-size:44px; letter-spacing:0.5px; padding:20px 40px; border-radius:999px; opacity:0">lompoclocals.com</span>
        <span id="{cid}-t3" style="display:block; margin-top:30px; color:rgba(255,255,255,0.8); font-weight:600; font-size:32px; letter-spacing:1px; opacity:0">Follow @lompoclocals</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 16 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 0.40);
        tl.fromTo("#{cid}-wm", {{ autoAlpha: 0, y: 24, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, 1.70);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 3.80);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 5.30);
        tl.fromTo("#{cid}-t3", {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 6.10);'''
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


VO_VOL = 0.78
BED_VOL = 0.28


def index_html(H, folder):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="8"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.6, "v": %.2f}, {"t": %.2f, "v": %.2f}, {"t": %.2f, "v": 0}]}]}' % (BED_VOL, TOTAL - 1.4, BED_VOL, TOTAL)
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
    <!-- 1,000 TIKTOK FOLLOWERS — thank you, Lompoc. Sun Sep 13 2026. {TOTAL:.2f}s. Own clips, own photos, Arthur read, new bed. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="{VO_VOL:.2f}" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="{BED_VOL:.2f}" data-fade-in="0.6" data-fade-out="1.4" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
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
