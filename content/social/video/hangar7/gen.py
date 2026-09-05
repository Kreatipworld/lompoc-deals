#!/usr/bin/env python3
"""
Hangar 7 Social House — Member Spotlight (Eye on I style).
Generates index.html (9:16), index-4x5.tmpl (4:5) and both compositions folders
from one source of truth. Photos are the business's own (public/p1..p8.jpg).

  python3 gen.py            # writes everything
  (audio slots are commented in index.html until the read + bed exist)
"""
import os, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))

# ─── timeline (seconds) — retime here; VO beats later ─────────────────────────
X = 0.25  # crossfade overlap
SCENES = [
    # id,        start,  dur   — timed to Dylan's read (VO at 0.60): road 5.46 · name 6.14 · pizza/wings/beer 8.04 · lounge 10.12
    #                            · back room 12.20 · live music 13.90 · Hangar 7 15.76 · since 2025 17.56 · partner 19.22 · menu/hours 21.56 · .com 23.46
    ("s1-front", 0.00,  8.00),
    ("s3-pizza", 7.75,  2.55),
    ("s2-lounge", 10.05, 2.35),
    ("s6-bar",   12.15, 3.75),
    ("s5-bites", 15.65, 3.80),
    ("s7-end",   19.20, 5.80),
]
TOTAL = 25.00
VO_START = 0.60
VO_DUR = 23.68

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"; DARK = "#1a1030"; BG = "#140a17"

def common_css(cid, H, bar, safe_bottom, mark_top):
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 66%, rgba(10,6,12,0.38) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.06) saturate(1.1); }}
      [data-composition-id="{cid}"] .blur {{ position: absolute; inset: -6%; background-size: cover; background-position: 50% 50%; filter: blur(30px) brightness(0.5) saturate(1.2); }}
      [data-composition-id="{cid}"] .whole {{ display: block; position: absolute; left: 0; width: 1080px; height: auto; top: 50%; transform: translateY(-50%); box-shadow: 0 30px 80px rgba(0,0,0,0.55); filter: contrast(1.06) saturate(1.1); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.88) 0%, rgba(20,10,23,0.55) 24%, rgba(20,10,23,0.0) 46%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.80) 0%, rgba(20,10,23,0.35) 22%, rgba(20,10,23,0.0) 40%); }}
      [data-composition-id="{cid}"] .chips {{ position: absolute; left: 84px; right: 84px; bottom: {safe_bottom}; z-index: 35; display: flex; flex-wrap: wrap; gap: 14px; }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 30px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      [data-composition-id="{cid}"] .head {{ position: absolute; left: 84px; right: 84px; top: {mark_top}px; z-index: 36; }}
      [data-composition-id="{cid}"] .pill {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 10px 22px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .name {{ display: block; margin-top: 18px; color: #fff; text-shadow: 0 4px 24px rgba(10,6,12,0.7); font-weight: 800; font-size: 74px; line-height: 1.0; letter-spacing: -1px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .sub {{ display: block; margin-top: 14px; color: {GOLD}; font-weight: 700; font-size: 28px; letter-spacing: 2px; opacity: 0; will-change: transform, opacity; }}
    """

def photo_scene(cid, dur, H, bar, img, mode, kb, chips, header=None, cut=None, whole_y="-50%", chip_times=None):
    """mode: cover | whole; kb: ('scale', a, b) or ('drift', xa, xb) or ('tilt', ya, yb)"""
    safe_bottom = "21%" if H == 1920 else "19%"
    mark_top = 190 if H == 1920 else 130
    css = common_css(cid, H, bar, safe_bottom, mark_top)
    def media(src, pos):
        if mode == "cover":
            return f'<img class="cover" src="public/{src}" alt="" style="object-position: {pos}" />'
        return f'<div class="blur" style="background-image: url(public/{src})"></div><img class="whole" src="public/{src}" alt="" style="transform: translateY({whole_y})" />'
    pos = kb[3] if len(kb) > 3 else "50% 50%"
    media_html = f'<div class="wrap" id="{cid}-w0" data-layout-allow-overflow>{media(img, pos)}</div>'
    if cut:
        media_html += f'<div class="wrap" id="{cid}-w1" style="opacity:0" data-layout-allow-overflow>{media(cut[0], cut[2] if len(cut) > 2 else "50% 50%")}</div>'
    chips_html = "".join(f'<span class="chip" id="{cid}-c{i}">{c}</span>' for i, c in enumerate(chips))
    head_html = ""
    if header:
        head_html = f'''<div class="head"><span class="pill" id="{cid}-pill">Official Partner</span><span class="name" id="{cid}-name">{header[0]}</span><span class="sub" id="{cid}-sub">{header[1]}</span></div>'''
    # ken burns tween
    if kb[0] == "scale":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: {kb[1]} }}, {{ scale: {kb[2]}, duration: B.END, ease: "none" }}, 0);'
    elif kb[0] == "drift":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.10, xPercent: {kb[1]} }}, {{ scale: 1.10, xPercent: {kb[2]}, duration: B.END, ease: "none" }}, 0);'
    else:  # tilt
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.10, yPercent: {kb[1]} }}, {{ scale: 1.10, yPercent: {kb[2]}, duration: B.END, ease: "none" }}, 0);'
    cut_js = ""
    if cut:
        cut_js = f'''
        tl.set("#{cid}-w0", {{ autoAlpha: 0 }}, B.CUT); tl.set("#{cid}-w1", {{ autoAlpha: 1 }}, B.CUT);
        tl.fromTo("#{cid}-w1", {{ scale: 1.0 }}, {{ scale: 1.07, duration: B.END - B.CUT, ease: "none" }}, B.CUT);'''
    head_js = ""
    if header:
        head_js = f'''
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, x: -20 }}, {{ autoAlpha: 1, x: 0, duration: 0.4 }}, B.HEAD);
        tl.fromTo("#{cid}-name", {{ autoAlpha: 0, y: 18, scale: 1.04 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, B.HEAD + 0.12);
        tl.fromTo("#{cid}-sub", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.HEAD + 0.30);'''
    chip_js = "".join(f'\n        tl.fromTo("#{cid}-c{i}", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, {(chip_times[i] if chip_times else f"B.CHIP + {i} * 0.45")});' for i in range(len(chips)))
    beats = f'const B = {{ HEAD: 0.45, CHIP: 0.55, CUT: {cut[1] if cut else 0}, END: {dur:.2f} }};'
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {BG}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      {media_html}
      <div class="scrim"></div>{'<div class="topscrim"></div>' if header else ''}
      {head_html}
      <div class="chips">{chips_html}</div>
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        // BEATS (relative to scene start). HEAD/CHIP move with the read; END = scene duration.
        {beats}
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        {kbt}{cut_js}{head_js}{chip_js}
        tl.set({{}}, {{}}, B.END);
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def end_scene(cid, dur, H, bar):
    top = "17%" if H == 1920 else "11%"
    credit_bottom = "16%" if H == 1920 else "10%"
    css = common_css(cid, H, bar, "21%", 190) + f"""
      [data-composition-id="{cid}"] .bloom {{ position: absolute; left: 90px; top: 12%; width: 900px; height: 900px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.16), rgba(239,198,24,0) 62%); }}
      [data-composition-id="{cid}"] .col {{ position: absolute; left: 0; right: 0; top: {top}; z-index: 20; text-align: center; }}
      [data-composition-id="{cid}"] .logocard {{ display: block; width: 62%; margin: 0 auto; background: #fff; border-radius: 40px; padding: 40px 44px; box-shadow: 0 30px 80px rgba(10,6,12,0.5); will-change: transform, opacity; opacity: 0; position: relative; overflow: hidden; }}
      [data-composition-id="{cid}"] .logocard img {{ display: block; width: 100%; height: auto; object-fit: contain; }}
      [data-composition-id="{cid}"] .sweep {{ position: absolute; top: -40%; bottom: -40%; left: 0; width: 34%; background: linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%); transform: translateX(-140%) skewX(-18deg); opacity: 0; pointer-events: none; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .epill {{ display: inline-block; margin-top: 44px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 10px 22px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .ename {{ display: block; margin: 18px auto 0; color: #fff; font-weight: 800; font-size: 76px; line-height: 1.0; letter-spacing: -1px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .addr {{ display: block; margin: 22px auto 0; color: rgba(255,255,255,0.88); font-weight: 600; font-size: 34px; letter-spacing: 0.5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .menu {{ display: block; margin: 14px auto 0; color: rgba(255,255,255,0.62); font-weight: 500; font-size: 30px; letter-spacing: 2px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .url {{ display: block; margin: 34px auto 0; color: {GOLD}; font-weight: 800; font-size: 50px; letter-spacing: 0.5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .rule {{ display: block; margin: 16px auto 0; width: 120px; height: 6px; background: {GOLD}; border-radius: 3px; opacity: 0; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .credit {{ position: absolute; left: 84px; right: 84px; bottom: {credit_bottom}; text-align: center; color: rgba(250,245,236,0.55); font-size: 22px; font-weight: 500; z-index: 20; opacity: 0; }}
    """
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {DARK}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      <div id="{cid}-bloom" class="bloom" data-layout-allow-overflow></div>
      <div class="col">
        <div id="{cid}-logo" class="logocard"><img src="public/logo.png" alt="Hangar 7 Social House" /><div class="sweep" id="{cid}-sweep"></div></div>
        <span id="{cid}-pill" class="epill">Official Partner</span>
        <span id="{cid}-name" class="ename">Hangar 7 Social House</span>
        <span id="{cid}-addr" class="addr">107 W Ocean Ave · Downtown Lompoc</span>
        <span id="{cid}-menu" class="menu">menu · hours · what's new</span>
        <span id="{cid}-url" class="url">lompoclocals.com</span>
        <span id="{cid}-rule" class="rule"></span>
      </div>
      <div id="{cid}-credit" class="credit">photos courtesy of Hangar 7 Social House</div>
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        // BEATS (relative to scene start): LOGO, NAME ("Hangar 7"), URL ("lompoclocals.com"), END
        const B = {{ LOGO: 0.00, NAME: 0.35, ADDR: 0.95, URL: 3.00, CREDIT: 3.80, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" }}, B.LOGO);
        tl.fromTo("#{cid}-logo", {{ autoAlpha: 0, scale: 1.06 }}, {{ autoAlpha: 1, scale: 1.0, duration: 0.6, ease: "expo.out" }}, B.LOGO + 0.1);
        tl.fromTo("#{cid}-sweep", {{ autoAlpha: 1, xPercent: -140 }}, {{ xPercent: 380, duration: 0.6, ease: "power2.inOut" }}, B.LOGO + 0.7).set("#{cid}-sweep", {{ autoAlpha: 0 }}, B.LOGO + 1.3);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, B.NAME);
        tl.fromTo("#{cid}-name", {{ autoAlpha: 0, y: 18, scale: 1.04 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, B.NAME + 0.1);
        tl.fromTo("#{cid}-addr", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.ADDR);
        tl.fromTo("#{cid}-menu", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.ADDR + 0.15);
        tl.fromTo("#{cid}-url", {{ autoAlpha: 0, y: 16, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, B.URL);
        tl.fromTo("#{cid}-rule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }}, B.URL + 0.2);
        tl.fromTo("#{cid}-credit", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.4 }}, B.CREDIT);
        tl.set({{}}, {{}}, B.END);
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
      [data-composition-id="{cid}"] .mark {{ position: absolute; top: {190 if H == 1920 else 130}px; right: 84px; width: 96px; height: auto; z-index: 65; opacity: 0.92; }}
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
    wide = H == 1920
    if cid == "s1-front":
        return photo_scene(cid, dur, H, bar, "p8.jpg", "whole", ("scale", 1.0, 1.08, "50% 62%"), [],
                           header=("Hangar 7<br />Social House", "wine bar · wood-fired pizza · Ocean Ave · Lompoc"), whole_y="-50%" if wide else "-36%")
    if cid == "s2-lounge":
        return photo_scene(cid, dur, H, bar, "p1.jpg", "whole" if wide else "cover", ("drift", -3, 3, "35% 50%"), ["Downtown Lompoc"], chip_times=[0.35])
    if cid == "s3-pizza":
        return photo_scene(cid, dur, H, bar, "p2.jpg", "cover", ("tilt", 3, -3, "50% 50%"), ["Wood-fired pizza", "Local wine · Craft beer"], chip_times=[0.30, 1.05])
    if cid == "s5-bites":
        return photo_scene(cid, dur, H, bar, "p5.jpg", "cover", ("scale", 1.0, 1.06, "50% 45%"), ["Wings · Bar bites", "Since 2025"], cut=("p6.jpg", 1.75, "50% 55%"), chip_times=[0.30, 1.95])
    if cid == "s6-bar":
        return photo_scene(cid, dur, H, bar, "p3.jpg", "whole" if wide else "cover", ("scale", 1.0, 1.07, "50% 45%"), ["Live music · Saturdays 7 PM"], chip_times=[1.75])
    if cid == "s7-end":
        return end_scene(cid, dur, H, bar)
    raise ValueError(cid)

def index_html(H, folder, name):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    bed_row = (f'      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.30" data-fade-in="0.6" data-fade-out="1.4" data-fx-carve=\'{{"enabled":true,"sources":["voiceover"],"strength":0.55}}\'></audio>'
               if os.path.exists(os.path.join(HERE, "public", "bed.wav")) else "      <!-- bed.wav not present yet -->")
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
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
    <!-- HANGAR 7 SOCIAL HOUSE — Member Spotlight (Eye on I style). {TOTAL:.2f}s. Their own photos, Ken Burns, gold chips, progress line, partner end card.
         Scenes on rising tracks (1..7) so each new scene fades in on top ({X}s). Generated by gen.py — edit there. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo-dylan.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="1" data-fade-in="0.05" data-fade-out="0.10"></audio>
{bed_row}
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

for H, bar, folder, idx in ((1920, 115, "compositions", "index.html"), (1350, 80, "compositions-4x5", "index-4x5.tmpl")):
    os.makedirs(os.path.join(HERE, folder), exist_ok=True)
    for cid, start, dur in SCENES:
        write(f"{folder}/{cid}.html", scene_html(cid, dur, H, bar))
    write(f"{folder}/progress.html", progress_scene(H, bar))
    write(idx, index_html(H, folder, idx))
print("wrote", [s[0] for s in SCENES], "+ progress, index.html, index-4x5.tmpl")
