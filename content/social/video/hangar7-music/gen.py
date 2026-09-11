#!/usr/bin/env python3
"""
Hangar 7 — Saturday live music (TikTok twin of the story card). 14.0 s, 9:16, no voice.
Their own photos (public/p*.jpg), their logo, our new bed. Generated from this file:

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    # id,          start, dur
    ("s1-open",    0.00,  3.60),   # p3 bar wall · pill SATURDAY NIGHT · title
    ("s2-menu",    3.35,  3.40),   # p2 pizza/wine/beer · DRINKS · DAMN GOOD PIZZA · A BAND
    ("s3-vibe",    6.50,  3.20),   # p1 lounge · NO COVER · ALL AGES
    ("s4-when",    9.45,  2.30),   # p5 wings · Saturday 7 PM · address
    ("s5-end",     11.50, 2.50),   # end card
]
TOTAL = 14.00

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"


def common_css(cid, H, bar):
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 66%, rgba(10,6,12,0.40) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.06) saturate(1.1); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.90) 0%, rgba(20,10,23,0.55) 28%, rgba(20,10,23,0.0) 50%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.75) 0%, rgba(20,10,23,0.30) 20%, rgba(20,10,23,0.0) 38%); }}
      [data-composition-id="{cid}"] .lower {{ position: absolute; left: 84px; right: 84px; bottom: 21%; z-index: 35; }}
      [data-composition-id="{cid}"] .pill {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 28px; letter-spacing: 4px; padding: 12px 24px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .title {{ display: block; margin-top: 22px; color: #fff; text-shadow: 0 4px 24px rgba(10,6,12,0.7); font-weight: 800; font-size: 112px; line-height: 0.96; letter-spacing: -4px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .chips {{ display: flex; flex-wrap: wrap; gap: 14px; margin-top: 8px; }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 34px; letter-spacing: 3px; padding: 16px 28px; border-radius: 12px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      [data-composition-id="{cid}"] .big {{ display: block; color: #fff; font-weight: 800; font-size: 84px; line-height: 1.0; letter-spacing: -2px; text-shadow: 0 4px 24px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .line {{ display: block; margin-top: 16px; color: {GOLD}; font-weight: 700; font-size: 38px; letter-spacing: 1px; text-shadow: 0 3px 16px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .logo {{ position: absolute; top: 190px; right: 84px; width: 180px; height: auto; z-index: 37; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.6)); }}
      [data-composition-id="{cid}"] .credit {{ position: absolute; top: 200px; left: 84px; z-index: 37; color: rgba(255,255,255,0.7); font-size: 22px; font-weight: 600; letter-spacing: 1px; }}
    """


def photo_scene(cid, dur, H, bar, img, kb, pos, body_html, body_js, first=False):
    css = common_css(cid, H, bar)
    if kb[0] == "scale":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: {kb[1]} }}, {{ scale: {kb[2]}, duration: {dur:.2f}, ease: "none" }}, 0);'
    elif kb[0] == "drift":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.12, xPercent: {kb[1]} }}, {{ scale: 1.12, xPercent: {kb[2]}, duration: {dur:.2f}, ease: "none" }}, 0);'
    else:
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.12, yPercent: {kb[1]} }}, {{ scale: 1.12, yPercent: {kb[2]}, duration: {dur:.2f}, ease: "none" }}, 0);'
    fade_js = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if first
               else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    root_bg = BG if first else "transparent"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {root_bg}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      <div class="wrap" id="{cid}-w0" data-layout-allow-overflow><img class="cover" src="public/{img}" alt="" style="object-position: {pos}" /></div>
      <div class="scrim"></div><div class="topscrim"></div>
      <span class="credit" data-layout-allow-overlap data-layout-allow-occlusion>Photo: Hangar 7 Social House</span>
      <img class="logo" src="public/logo.png" alt="" />
      <div class="lower">{body_html}</div>
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        {fade_js}
        {kbt}
        {body_js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def chips_html(cid, chips):
    return '<div class="chips">' + "".join(f'<span class="chip" id="{cid}-c{i}">{c}</span>' for i, c in enumerate(chips)) + '</div>'


def chips_js(cid, times):
    return "".join(f'\n        tl.fromTo("#{cid}-c{i}", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, {t:.2f});' for i, t in enumerate(times))


def end_scene(cid, dur, H, bar):
    css = common_css(cid, H, bar) + f"""
      [data-composition-id="{cid}"] .field {{ position: absolute; inset: 0; background: linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%); }}
      [data-composition-id="{cid}"] .col {{ position: absolute; left: 0; right: 0; top: 26%; z-index: 20; text-align: center; }}
      [data-composition-id="{cid}"] .biglogo {{ display: block; width: 560px; height: auto; margin: 0 auto; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.55)); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .when {{ display: block; margin: 40px auto 0; color: #fff; font-weight: 800; font-size: 64px; line-height: 1.0; letter-spacing: -1px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .addr {{ display: block; margin: 16px auto 0; color: rgba(255,255,255,0.88); font-weight: 600; font-size: 36px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .epill {{ display: inline-block; margin-top: 40px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 12px 26px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .url {{ display: block; margin: 26px auto 0; color: #fff; font-weight: 800; font-size: 50px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .emark {{ position: absolute; top: 150px; right: 84px; width: 84px; height: auto; z-index: 25; opacity: 0.92; }}
    """
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      <div class="field"></div>
      <img class="emark" src="public/mark-white.png" alt="" />
      <div class="col">
        <img id="{cid}-logo" class="biglogo" src="public/logo.png" alt="Hangar 7 Social House" />
        <span id="{cid}-when" class="when">Saturday · 7:00 PM</span>
        <span id="{cid}-addr" class="addr">107 W Ocean Ave · Old Town Lompoc</span>
        <span id="{cid}-pill" class="epill">Lompoc Locals Partner</span>
        <span id="{cid}-url" class="url">lompoclocals.com</span>
      </div>
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-logo", {{ autoAlpha: 0, scale: 0.78, rotation: -6 }}, {{ autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.5)" }}, 0.05);
        tl.fromTo("#{cid}-when", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 0.35);
        tl.fromTo("#{cid}-addr", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 0.55);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 12, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, 0.85);
        tl.fromTo("#{cid}-url", {{ autoAlpha: 0, y: 16, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 1.10);
        tl.set({{}}, {{}}, {dur:.2f});
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
      [data-composition-id="{cid}"] .mark {{ position: absolute; bottom: {(bar - 60) // 2}px; right: 84px; height: 60px; width: auto; z-index: 72; opacity: 0.9; }}
    </style>
    <div class="bar" id="prog-bar"></div>
    <img class="mark" src="public/mark-white.png" alt="" />
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


def scene_html(cid, dur, H, bar):
    if cid == "s1-open":
        body = f'<span class="pill" id="{cid}-pill">Saturday night</span><span class="title" id="{cid}-title">Live music<br />at Hangar 7.</span>'
        js = (f'tl.set("#{cid}-pill", {{ autoAlpha: 1 }}, 0);'
              f'\n        tl.fromTo("#{cid}-title", {{ autoAlpha: 0, y: 26, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, 0.45);')
        return photo_scene(cid, dur, H, bar, "p3.jpg", ("scale", 1.0, 1.10), "50% 45%", body, js, first=True)
    if cid == "s2-menu":
        chips = ["Drinks", "Damn good pizza", "A band"]
        return photo_scene(cid, dur, H, bar, "p2.jpg", ("tilt", 3, -3), "50% 55%", chips_html(cid, chips), chips_js(cid, [0.35, 0.95, 1.55]))
    if cid == "s3-vibe":
        chips = ["No cover", "All ages"]
        return photo_scene(cid, dur, H, bar, "p1.jpg", ("drift", 3, -3), "50% 50%", chips_html(cid, chips), chips_js(cid, [0.40, 1.05]))
    if cid == "s4-when":
        body = f'<span class="big" id="{cid}-big">Saturday · 7:00 PM</span><span class="line" id="{cid}-line">107 W Ocean Ave · Old Town</span>'
        js = (f'tl.fromTo("#{cid}-big", {{ autoAlpha: 0, y: 22, scale: 1.05 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, 0.30);'
              f'\n        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 0.80);')
        return photo_scene(cid, dur, H, bar, "p5.jpg", ("scale", 1.0, 1.09), "50% 50%", body, js)
    if cid == "s5-end":
        return end_scene(cid, dur, H, bar)
    raise ValueError(cid)


def index_html(H, folder):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.4, "v": 0.60}, {"t": %.2f, "v": 0.60}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.0, TOTAL)
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
    <!-- HANGAR 7 — Saturday live music, TikTok twin of the story card. {TOTAL:.2f}s, no voice, their photos + logo, our bed. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.60" data-fade-in="0.4" data-fade-out="1.0" data-automation='{bed_auto}'></audio>
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
write(f"{folder}/progress.html", progress_scene(H, bar))
write("index.html", index_html(H, folder))
print("wrote", [s[0] for s in SCENES], "+ progress, index.html")
