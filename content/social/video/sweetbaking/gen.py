#!/usr/bin/env python3
"""
Sweet Baking Co. — Member Spotlight.
Generates index.html (9:16), index-4x5.tmpl (4:5) and both compositions folders
from one source of truth. Photos are the business's own (their listing), logo is theirs.

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ─── timeline (absolute seconds) — timed to Arthur's read (VO at 0.60) ───────────
X = 0.25  # crossfade overlap
SCENES = [
    # id,            start,  dur  — beats (absolute): word time + 0.60 (read v2, no macarons)
    ("s1-open",      0.00,   4.00),   # counter · cover held from frame 0 (pill + name + sub)
    ("s2-batch",     3.80,   3.90),   # cupcakes · SMALL BATCH 3.9 · MENU CHANGES DAILY 5.5
    ("s3-menu",      7.50,   5.40),   # marbled cookies → palm cookies (cut 10.4) · CUPCAKES 7.95 … LEMONADE 11.5
    ("s4-vegan",     12.70,  3.10),   # cookie-dough cups · VEGAN & DAIRY-FREE 13.2
    ("s5-custom",    15.60,  5.40),   # treats → cupcakes (cut 18.2) · CUSTOM 15.9 · WEDDINGS 17.4 · hours 19.0
    ("s6-end",       20.80,  7.70),   # end card, cream
]
TOTAL = 28.50
VO_START = 0.60
VO_DUR = 26.93

SUBTITLES = False  # spotlights: the letters are the show (owner, Sep 11)
SUBS = []

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"; DARK = "#1a1030"; BG = "#140a17"
CREAM = "#fff8f2"


def common_css(cid, H, bar, safe_bottom, mark_top, head_top=None):
    logo_w = 170 if H == 1920 else 136
    head_top = mark_top if head_top is None else head_top
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 66%, rgba(10,6,12,0.38) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05) saturate(1.08); }}
      [data-composition-id="{cid}"] .blur {{ position: absolute; inset: -6%; background-size: cover; background-position: 50% 50%; filter: blur(30px) brightness(0.5) saturate(1.2); }}
      [data-composition-id="{cid}"] .whole {{ display: block; position: absolute; left: 0; width: 1080px; height: auto; top: 50%; transform: translateY(-50%); box-shadow: 0 30px 80px rgba(0,0,0,0.55); filter: contrast(1.05) saturate(1.08); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.88) 0%, rgba(20,10,23,0.55) 24%, rgba(20,10,23,0.0) 46%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.80) 0%, rgba(20,10,23,0.35) 22%, rgba(20,10,23,0.0) 40%); }}
      [data-composition-id="{cid}"] .chips {{ position: absolute; left: 84px; right: 84px; bottom: {safe_bottom}; z-index: 35; display: flex; flex-wrap: wrap; gap: 14px; }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 30px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      [data-composition-id="{cid}"] .line {{ display: block; width: 100%; color: {GOLD}; font-weight: 700; font-size: 30px; letter-spacing: 1px; text-shadow: 0 3px 16px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .head {{ position: absolute; left: 84px; right: 300px; top: {head_top}px; z-index: 36; }}
      [data-composition-id="{cid}"] .pill {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 10px 22px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .name {{ display: block; margin-top: 18px; color: #fff; text-shadow: 0 4px 24px rgba(10,6,12,0.7); font-weight: 800; font-size: 74px; line-height: 1.0; letter-spacing: -1px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .sub {{ display: block; margin-top: 14px; color: {GOLD}; font-weight: 700; font-size: 28px; letter-spacing: 2px; text-shadow: 0 3px 14px rgba(10,6,12,0.85); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .head.panel {{ left: 60px; right: 60px; padding: 28px 32px 30px; background: rgba(20,10,23,0.62); border-radius: 26px; backdrop-filter: blur(6px); }}
      [data-composition-id="{cid}"] .logocard {{ position: absolute; top: {mark_top}px; right: 84px; width: {logo_w}px; padding: 10px 14px; background: #ffffff; border-radius: 16px; z-index: 37; box-shadow: 0 10px 28px rgba(0,0,0,0.45); }}
      [data-composition-id="{cid}"] .logocard img {{ display: block; width: 100%; height: auto; }}
    """


def photo_scene(cid, dur, H, bar, img, mode, kb, chips, header=None, cut=None, whole_y="-50%", chip_times=None, line=None, head_top=None):
    """mode: cover | whole; kb: ('scale', a, b[, pos[, origin]]) | ('drift', xa, xb[, pos]) | ('tilt', ya, yb[, pos])
    cut: (img, t_rel, mode[, pos]) hard cut inside the scene. header: (pill, name, sub) — name/sub may be None.
    line: (text, t_rel) — gold sentence under the chips."""
    safe_bottom = "21%" if H == 1920 else "22%"
    mark_top = 190 if H == 1920 else 130
    css = common_css(cid, H, bar, safe_bottom, mark_top, head_top=head_top)

    def media(src, m, pos):
        if m == "cover":
            return f'<img class="cover" src="public/{src}" alt="" style="object-position: {pos}" />'
        return f'<div class="blur" style="background-image: url(public/{src})"></div><img class="whole" src="public/{src}" alt="" style="transform: translateY({whole_y})" />'

    pos = kb[3] if len(kb) > 3 else "50% 50%"
    media_html = f'<div class="wrap" id="{cid}-w0" data-layout-allow-overflow>{media(img, mode, pos)}</div>'
    if cut:
        cpos = cut[3] if len(cut) > 3 else "50% 50%"
        media_html += f'<div class="wrap" id="{cid}-w1" style="opacity:0" data-layout-allow-overflow>{media(cut[0], cut[2], cpos)}</div>'
    chips_html = "".join(f'<span class="chip" id="{cid}-c{i}">{c}</span>' for i, c in enumerate(chips))
    if line:
        chips_html += f'<span class="line" id="{cid}-line">{line[0]}</span>'
    head_html = ""
    if header:
        pill, name, sub = header
        head_html = '<div class="head panel">' if cid == "s1-open" else '<div class="head">'
        if pill: head_html += f'<span class="pill" id="{cid}-pill">{pill}</span>'
        if name: head_html += f'<span class="name" id="{cid}-name">{name}</span>'
        if sub: head_html += f'<span class="sub" id="{cid}-sub">{sub}</span>'
        head_html += '</div>'
    origin = kb[4] if len(kb) > 4 else "50% 50%"
    if kb[0] == "scale":
        kbt = f'gsap.set("#{cid}-w0", {{ transformOrigin: "{origin}" }}); tl.fromTo("#{cid}-w0", {{ scale: {kb[1]} }}, {{ scale: {kb[2]}, duration: B.END, ease: "none" }}, 0);'
    elif kb[0] == "drift":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.10, xPercent: {kb[1]} }}, {{ scale: 1.10, xPercent: {kb[2]}, duration: B.END, ease: "none" }}, 0);'
    else:  # tilt
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.10, yPercent: {kb[1]} }}, {{ scale: 1.10, yPercent: {kb[2]}, duration: B.END, ease: "none" }}, 0);'
    cut_js = ""
    if cut:
        cut_js = f'''
        tl.set("#{cid}-w0", {{ autoAlpha: 0 }}, B.CUT); tl.set("#{cid}-w1", {{ autoAlpha: 1 }}, B.CUT);
        tl.fromTo("#{cid}-w1", {{ scale: 1.0, xPercent: 1.5 }}, {{ scale: 1.08, xPercent: -1.5, duration: B.END - B.CUT, ease: "none" }}, B.CUT);'''
    head_js = ""
    if header:
        pill, name, sub = header
        static_head = BEATS.get(cid, {}).get("STATIC", False)
        if pill:
            head_js += (f'''
        tl.set("#{cid}-pill", {{ autoAlpha: 1 }}, 0);''' if static_head else f'''
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, x: -20 }}, {{ autoAlpha: 1, x: 0, duration: 0.4 }}, B.PILL);''')
        if name:
            head_js += (f'''
        tl.set("#{cid}-name", {{ autoAlpha: 1 }}, 0);''' if static_head else f'''
        tl.fromTo("#{cid}-name", {{ autoAlpha: 0, y: 22, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, B.HEAD);''')
        if sub:
            head_js += (f'''
        tl.set("#{cid}-sub", {{ autoAlpha: 1 }}, 0);''' if static_head else f'''
        tl.fromTo("#{cid}-sub", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.SUB);''')
    chip_js = "".join(f'\n        tl.fromTo("#{cid}-c{i}", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, {chip_times[i]:.2f});' for i in range(len(chips)))
    line_js = f'\n        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, {line[1]:.2f});' if line else ""
    beats = BEATS.get(cid, {})
    beats_js = f'const B = {{ PILL: {beats.get("PILL", 0.45):.2f}, HEAD: {beats.get("HEAD", 0.45):.2f}, SUB: {beats.get("SUB", 0.9):.2f}, CUT: {cut[1] if cut else 0:.2f}, END: {dur:.2f} }};'
    root_bg = BG if cid == "s1-open" else "transparent"
    fade_js = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if cid == "s1-open"
               else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {root_bg}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      {media_html}
      <div class="scrim"></div><div class="topscrim"></div>
      {head_html}
      <div class="logocard"><img src="public/logo.png" alt="" /></div>
      <div class="chips">{chips_html}</div>
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        // BEATS (relative to scene start). PILL/HEAD/SUB move with the read; END = scene duration.
        {beats_js}
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        {fade_js}
        {kbt}{cut_js}{head_js}{chip_js}{line_js}
        tl.set({{}}, {{}}, B.END);
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def end_scene(cid, dur, H, bar):
    top = "15%" if H == 1920 else "9%"
    logo_w = 620 if H == 1920 else 500
    css = common_css(cid, H, bar, "21%", 190) + f"""
      [data-composition-id="{cid}"] .field {{ position: absolute; inset: 0; background: linear-gradient(180deg, {CREAM} 0%, #fbeee3 100%); }}
      [data-composition-id="{cid}"] .bloom {{ position: absolute; left: 90px; top: 6%; width: 900px; height: 900px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.22), rgba(239,198,24,0) 62%); }}
      [data-composition-id="{cid}"] .col {{ position: absolute; left: 0; right: 0; top: {top}; z-index: 20; text-align: center; }}
      [data-composition-id="{cid}"] .biglogo {{ display: block; width: {logo_w}px; height: auto; margin: 0 auto; will-change: transform, opacity; opacity: 0; }}
      [data-composition-id="{cid}"] .ename {{ display: block; margin: 30px auto 0; color: {INK}; font-weight: 800; font-size: 68px; line-height: 1.0; letter-spacing: -1px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .addr {{ display: block; margin: 22px auto 0; color: #4a3a50; font-weight: 600; font-size: 34px; letter-spacing: 0.5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .menu {{ display: block; margin: 12px auto 0; color: #7a6a80; font-weight: 500; font-size: 30px; letter-spacing: 1px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .epill {{ display: inline-block; margin-top: 36px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 12px 26px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .url {{ display: block; margin: 30px auto 0; color: {PURPLE}; font-weight: 800; font-size: 50px; letter-spacing: 0.5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .rule {{ display: block; margin: 16px auto 0; width: 120px; height: 6px; background: {GOLD}; border-radius: 3px; opacity: 0; transform-origin: 50% 50%; }}
    """
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      <div class="field"></div>
      <div id="{cid}-bloom" class="bloom" data-layout-allow-overflow></div>
      <div class="col">
        <img id="{cid}-logo" class="biglogo" src="public/logo-big.png" alt="Sweet Baking Co." />
        <span id="{cid}-name" class="ename">Sweet Baking Co.</span>
        <span id="{cid}-addr" class="addr">322 N H St, Suite C · Lompoc</span>
        <span id="{cid}-menu" class="menu">(805) 865-6013 · sweetbakingcompany.com</span>
        <span id="{cid}-pill" class="epill">Lompoc Locals Partner</span>
        <span id="{cid}-url" class="url">lompoclocals.com</span>
        <span id="{cid}-rule" class="rule"></span>
      </div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        // BEATS (relative to scene start 22.40): LOGO 22.6, NAME 22.9, ADDR 23.6, MENU 24.1, PILL 24.8, URL 26.6
        const B = {{ LOGO: 0.20, NAME: 0.50, ADDR: 1.20, MENU: 1.70, PILL: 2.40, URL: 4.20, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" }}, B.LOGO);
        tl.fromTo("#{cid}-logo", {{ autoAlpha: 0, scale: 0.78, rotation: -6 }}, {{ autoAlpha: 1, scale: 1.0, rotation: 0, duration: 0.7, ease: "back.out(1.5)" }}, B.LOGO + 0.05);
        tl.fromTo("#{cid}-name", {{ autoAlpha: 0, y: 18, scale: 1.04 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, B.NAME);
        tl.fromTo("#{cid}-addr", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.ADDR);
        tl.fromTo("#{cid}-menu", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.MENU);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 12, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, B.PILL);
        tl.fromTo("#{cid}-url", {{ autoAlpha: 0, y: 16, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, B.URL);
        tl.fromTo("#{cid}-rule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }}, B.URL + 0.2);
        tl.set({{}}, {{}}, B.END);
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def progress_scene(H, bar):
    cid = "progress"
    mark_h = 60 if H == 1920 else 44
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .bar {{ position: absolute; left: 0; right: 0; bottom: {bar}px; height: 6px; background: {GOLD}; transform-origin: 0% 50%; transform: scaleX(0); z-index: 70; box-shadow: 0 0 12px rgba(239,198,24,0.6); }}
      [data-composition-id="{cid}"] .mark {{ position: absolute; bottom: {(bar - mark_h) // 2}px; right: 84px; height: {mark_h}px; width: auto; z-index: 72; opacity: 0.9; }}
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


# beats relative to scene start (absolute − start)
BEATS = {
    "s1-open":  {"STATIC": True},   # designed cover: pill + name + sub visible from frame 0
    "s2-batch": {"STATIC": True},   # name/sub carry over from s1 without re-animating
}


def scene_html(cid, dur, H, bar):
    wide = H == 1920
    if cid == "s1-open":
        # landscape counter photo framed on 9:16 (blur fill), shifted low so the cover text sits above it inside the grid-safe zone
        return photo_scene(cid, dur, H, bar, "p0.jpg", "whole", ("scale", 1.0, 1.10, "50% 50%", "24% 68%"), [],
                           header=("Member Spotlight", "Sweet Baking Co.", "322 N H St · Lompoc"),
                           whole_y="-36%" if wide else "-40%", head_top=(470 if wide else 150))
    if cid == "s2-batch":
        return photo_scene(cid, dur, H, bar, "p1.jpg", "cover", ("drift", 1.5, -1.5, "50% 45%"),
                           ["Small batch", "Menu changes daily"], chip_times=[0.10, 1.70])
    if cid == "s3-menu":
        return photo_scene(cid, dur, H, bar, "p3.jpg", "cover", ("scale", 1.0, 1.08, "50% 50%"),
                           ["Cupcakes", "Sugar cookies", "Stuffed crepes", "Cotton candy lemonade"],
                           chip_times=[0.45, 1.35, 2.30, 4.00], cut=("p4.jpg", 2.90, "cover", "50% 50%"))
    if cid == "s4-vegan":
        return photo_scene(cid, dur, H, bar, "p5.jpg", "cover", ("tilt", 1.5, -1.5, "50% 50%"),
                           ["Vegan &amp; dairy-free, always"], chip_times=[0.50])
    if cid == "s5-custom":
        return photo_scene(cid, dur, H, bar, "p6.jpg", "cover", ("scale", 1.0, 1.07, "50% 50%"),
                           ["Custom cakes &amp; cookies", "Weddings by order"], chip_times=[0.30, 1.80],
                           cut=("p2.jpg", 2.60, "cover", "50% 45%"), line=("Tue–Fri 9:30–4:30 · Sat 11–3", 3.40))
    if cid == "s6-end":
        return end_scene(cid, dur, H, bar)
    raise ValueError(cid)


def index_html(H, folder, name):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.6, "v": 0.26}, {"t": %.2f, "v": 0.26}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.4, TOTAL)
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
    <!-- SWEET BAKING CO. — Member Spotlight. {TOTAL:.2f}s. Their own photos + logo, Ken Burns, gold chips, no captions, progress line, cream partner end card.
         Scenes on rising tracks (1..6) so each new scene fades in on top ({X}s). Generated by gen.py — edit there. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.80" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.26" data-fade-in="0.6" data-fade-out="1.4" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
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
