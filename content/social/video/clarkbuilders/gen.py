#!/usr/bin/env python3
"""
Clark Builders, Inc. — Member Spotlight.
Generates index.html (9:16), index-4x5.tmpl (4:5) and both compositions folders
from one source of truth. Photos are the business's own (public/p0..p7.jpg), logo is theirs.

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ─── timeline (absolute seconds) — timed to Dylan's read (VO at 0.60) ───────────
X = 0.25  # crossfade overlap
SCENES = [
    # id,           start,  dur
    ("s1-open",     0.00,   5.10),   # p1 navy kitchen · pill MEMBER SPOTLIGHT
    ("s2-name",     4.90,   4.40),   # p3 island · name slam 5.10 · sub 5.6 · LOCAL 6.2 · FAMILY 6.9
    ("s3-remodel",  9.10,   3.00),   # p2 light-wood kitchen · HOME REMODELS 10.9
    ("s4-services", 11.95,  2.45),   # p7 exterior → cut 13.2 → p6 pantry · ADDITIONS 12.0 · ADUs 12.45 · GARAGE 13.30
    ("s5-quality",  14.25,  4.75),   # p5 white range → cut 16.7 → p4 dining · QUALITY 14.4 · COMMITTED 15.0 · line 16.9
    ("s6-end",      18.80,  7.20),   # end card
]
TOTAL = 26.00
VO_START = 0.60
VO_DUR = 25.04

# burned-in subtitles, absolute seconds (from ASR word times + 0.60)
SUBS = [
    (0.76, 4.40, "In Lompoc, some of the best kitchens in town started with one phone call."),
    (5.10, 8.45, "Clark Builders is a local, family-owned and operated company,"),
    (8.60, 9.90, "building right here since 2012."),
    (10.85, 13.60, "Home remodels. Additions. ADUs. Garage conversions."),
    (14.30, 15.90, "Quality work, committed to excellence,"),
    (15.92, 18.05, "from the first plan to the final finish."),
    (18.70, 20.60, "Clark Builders, Inc., on East Chestnut Court."),
    (21.25, 22.55, "A Lompoc Locals partner."),
    (23.00, 24.90, "Find them at lompoclocals.com."),
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"; DARK = "#1a1030"; BG = "#140a17"


def common_css(cid, H, bar, safe_bottom, mark_top):
    logo_w = 150 if H == 1920 else 120
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 66%, rgba(10,6,12,0.38) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.06) saturate(1.1); }}
      [data-composition-id="{cid}"] .blur {{ position: absolute; inset: -6%; background-size: cover; background-position: 50% 50%; filter: blur(30px) brightness(0.55) saturate(1.2); }}
      [data-composition-id="{cid}"] .whole {{ display: block; position: absolute; left: 0; width: 1080px; height: auto; top: 50%; transform: translateY(-50%); box-shadow: 0 30px 80px rgba(0,0,0,0.55); filter: contrast(1.06) saturate(1.1); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.88) 0%, rgba(20,10,23,0.55) 24%, rgba(20,10,23,0.0) 46%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.80) 0%, rgba(20,10,23,0.35) 22%, rgba(20,10,23,0.0) 40%); }}
      [data-composition-id="{cid}"] .chips {{ position: absolute; left: 84px; right: 84px; bottom: {safe_bottom}; z-index: 35; display: flex; flex-wrap: wrap; gap: 14px; }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 30px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      [data-composition-id="{cid}"] .line {{ display: block; width: 100%; color: {GOLD}; font-weight: 700; font-size: 30px; letter-spacing: 1px; text-shadow: 0 3px 16px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .head {{ position: absolute; left: 84px; right: 260px; top: {mark_top}px; z-index: 36; }}
      [data-composition-id="{cid}"] .pill {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 10px 22px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .name {{ display: block; margin-top: 18px; color: #fff; text-shadow: 0 4px 24px rgba(10,6,12,0.7); font-weight: 800; font-size: 74px; line-height: 1.0; letter-spacing: -1px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .sub {{ display: block; margin-top: 14px; color: {GOLD}; font-weight: 700; font-size: 28px; letter-spacing: 2px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .logo {{ position: absolute; top: {mark_top}px; right: 84px; width: {logo_w}px; height: auto; z-index: 37; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.6)); }}
    """


def photo_scene(cid, dur, H, bar, img, mode, kb, chips, header=None, cut=None, whole_y="-50%", chip_times=None, line=None):
    """mode: cover | whole; kb: ('scale', a, b[, pos]) | ('drift', xa, xb[, pos]) | ('tilt', ya, yb[, pos])
    cut: (img, t_rel, mode[, pos]) hard cut inside the scene. header: (pill, name, sub) — name/sub may be None.
    line: (text, t_rel) — gold sentence under the chips."""
    safe_bottom = "21%" if H == 1920 else "22%"
    mark_top = 190 if H == 1920 else 130
    css = common_css(cid, H, bar, safe_bottom, mark_top)

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
        head_html = '<div class="head">'
        if pill: head_html += f'<span class="pill" id="{cid}-pill">{pill}</span>'
        if name: head_html += f'<span class="name" id="{cid}-name">{name}</span>'
        if sub: head_html += f'<span class="sub" id="{cid}-sub">{sub}</span>'
        head_html += '</div>'
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
        tl.fromTo("#{cid}-w1", {{ scale: 1.0, xPercent: 1.5 }}, {{ scale: 1.08, xPercent: -1.5, duration: B.END - B.CUT, ease: "none" }}, B.CUT);'''
    head_js = ""
    if header:
        pill, name, sub = header
        if pill:
            head_js += (f'''
        tl.set("#{cid}-pill", {{ autoAlpha: 1 }}, 0);''' if cid == "s1-open" else f'''
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, x: -20 }}, {{ autoAlpha: 1, x: 0, duration: 0.4 }}, B.PILL);''')
        if name:
            head_js += f'''
        tl.fromTo("#{cid}-name", {{ autoAlpha: 0, y: 22, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, B.HEAD);'''
        if sub:
            head_js += f'''
        tl.fromTo("#{cid}-sub", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.SUB);'''
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
      <img class="logo" src="public/logo-big.png" alt="" />
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
    top = "14%" if H == 1920 else "9%"
    logo_w = 420 if H == 1920 else 330
    css = common_css(cid, H, bar, "21%", 190) + f"""
      [data-composition-id="{cid}"] .field {{ position: absolute; inset: 0; background: linear-gradient(180deg, {PURPLE} 0%, #3a0745 100%); }}
      [data-composition-id="{cid}"] .bloom {{ position: absolute; left: 90px; top: 8%; width: 900px; height: 900px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.18), rgba(239,198,24,0) 62%); }}
      [data-composition-id="{cid}"] .col {{ position: absolute; left: 0; right: 0; top: {top}; z-index: 20; text-align: center; }}
      [data-composition-id="{cid}"] .biglogo {{ display: block; width: {logo_w}px; height: auto; margin: 0 auto; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.55)); will-change: transform, opacity; opacity: 0; }}
      [data-composition-id="{cid}"] .ename {{ display: block; margin: 34px auto 0; color: #fff; font-weight: 800; font-size: 72px; line-height: 1.0; letter-spacing: -1px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .addr {{ display: block; margin: 22px auto 0; color: rgba(255,255,255,0.9); font-weight: 600; font-size: 34px; letter-spacing: 0.5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .menu {{ display: block; margin: 12px auto 0; color: rgba(255,255,255,0.68); font-weight: 500; font-size: 30px; letter-spacing: 1px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .epill {{ display: inline-block; margin-top: 36px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 26px; letter-spacing: 4px; padding: 12px 26px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .url {{ display: block; margin: 30px auto 0; color: #fff; font-weight: 800; font-size: 50px; letter-spacing: 0.5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .rule {{ display: block; margin: 16px auto 0; width: 120px; height: 6px; background: {GOLD}; border-radius: 3px; opacity: 0; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .emark {{ position: absolute; top: 150px; right: 84px; width: 84px; height: auto; z-index: 25; opacity: 0.92; }}
    """
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      <div class="field"></div>
      <div id="{cid}-bloom" class="bloom" data-layout-allow-overflow></div>
      <img class="emark" src="public/mark-white.png" alt="" />
      <div class="col">
        <img id="{cid}-logo" class="biglogo" src="public/logo-big.png" alt="Clark Builders, Inc." />
        <span id="{cid}-name" class="ename">Clark Builders, Inc.</span>
        <span id="{cid}-addr" class="addr">1501 E Chestnut Ct, Ste C · Lompoc</span>
        <span id="{cid}-menu" class="menu">(805) 736-9306 · clarkbuildersinc.com</span>
        <span id="{cid}-pill" class="epill">Lompoc Locals Partner</span>
        <span id="{cid}-url" class="url">lompoclocals.com</span>
        <span id="{cid}-rule" class="rule"></span>
      </div>
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        // BEATS (relative to scene start 18.80): LOGO 18.8, NAME 18.9, ADDR 19.9, MENU 20.5, PILL 21.4, URL 23.2
        const B = {{ LOGO: 0.00, NAME: 0.10, ADDR: 1.10, MENU: 1.70, PILL: 2.60, URL: 4.40, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" }}, B.LOGO);
        tl.fromTo("#{cid}-logo", {{ autoAlpha: 0, scale: 0.72, rotation: -14 }}, {{ autoAlpha: 1, scale: 1.0, rotation: 0, duration: 0.7, ease: "back.out(1.5)" }}, B.LOGO + 0.05);
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


def subs_scene(H, bar):
    cid = "subs"
    bottom = 170 if H == 1920 else 118
    fs = 44 if H == 1920 else 38
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: {bottom}px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      [data-composition-id="{cid}"] .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      [data-composition-id="{cid}"] .sub span {{ display: inline-block; max-width: 920px; background: rgba(0,0,0,0.58); color: #fff; font-weight: 600; font-size: {fs}px; line-height: 1.25; padding: 16px 30px; border-radius: 22px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
    </style>
    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>
    <script>
      (() => {{
        // SUBS = [[start, end, text], ...] absolute seconds from the ASR word times.
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


# beats relative to scene start (absolute − start)
BEATS = {
    "s1-open": {"PILL": 0.00},
    "s2-name": {"HEAD": 0.20, "SUB": 0.70},
}


def scene_html(cid, dur, H, bar):
    wide = H == 1920
    if cid == "s1-open":
        return photo_scene(cid, dur, H, bar, "p1.jpg", "whole" if wide else "cover", ("scale", 1.0, 1.08, "50% 55%"), [],
                           header=("Member Spotlight", None, None), whole_y="-50%")
    if cid == "s2-name":
        return photo_scene(cid, dur, H, bar, "p3.jpg", "cover", ("drift", 2.5, -2.5, "50% 50%"), ["Local", "Family-owned &amp; operated"],
                           header=(None, "Clark<br />Builders, Inc.", "Lompoc · Est. 2012"), chip_times=[1.30, 2.00])
    if cid == "s3-remodel":
        return photo_scene(cid, dur, H, bar, "p2.jpg", "whole" if wide else "cover", ("scale", 1.0, 1.07, "50% 50%"), ["Home remodels"], chip_times=[1.80])
    if cid == "s4-services":
        return photo_scene(cid, dur, H, bar, "p7.jpg", "whole" if wide else "cover", ("tilt", 2, -2, "50% 45%"), ["Additions", "ADUs", "Garage conversions"],
                           cut=("p6.jpg", 1.25, "cover", "50% 45%"), chip_times=[0.05, 0.50, 1.35])
    if cid == "s5-quality":
        return photo_scene(cid, dur, H, bar, "p5.jpg", "cover", ("tilt", 2.5, -2.5, "50% 50%"), ["Quality", "Committed to excellence"],
                           cut=("p4.jpg", 2.45, "cover", "50% 50%"), chip_times=[0.15, 0.75], line=("From the first plan to the final finish", 2.65))
    if cid == "s6-end":
        return end_scene(cid, dur, H, bar)
    raise ValueError(cid)


def index_html(H, folder, name):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="8"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.6, "v": 0.30}, {"t": %.2f, "v": 0.30}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.4, TOTAL)
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
    <!-- CLARK BUILDERS, INC. — Member Spotlight. {TOTAL:.2f}s. Their own photos + logo, Ken Burns, gold chips, subtitles, progress line, partner end card.
         Scenes on rising tracks (1..6) so each new scene fades in on top ({X}s). Generated by gen.py — edit there. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo-dylan.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.86" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.30" data-fade-in="0.6" data-fade-out="1.4" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
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
    write(f"{folder}/subs.html", subs_scene(H, bar))
    write(idx, index_html(H, folder, idx))
print("wrote", [s[0] for s in SCENES], "+ subs, progress, index.html, index-4x5.tmpl")
