#!/usr/bin/env python3
"""
LOMPOC LOCALS NEWS — edition #1 (Sept 9, 2026). 22.50s news update for TikTok / IG / FB.
Generates index.html (9:16), index-4x5.tmpl (4:5) and both compositions folders from one source.
Photos are ours (public/civic.jpg, riverbend.jpg, shoes.jpg). VO = Dylan read (public/vo-dylan.wav),
bed = our own generated newsroom bed (public/bed.wav, no credit).

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ─── timeline (absolute seconds) ──────────────────────────────────────────────
X = 0.20  # crossfade
SCENES = [
    # id,          start,  dur
    ("s1-open",    0.00,  2.00),
    ("s2-mayor",   1.80,  3.50),
    ("s3-river",   5.10,  6.10),
    ("s4-shoes",  11.00,  7.60),
    ("s5-end",    18.40,  4.10),
]
TOTAL = 22.50
VO_START = 0.60
VO_DUR = 21.12
EDITION = "SEPT 9 · 2026"

# Burned-in subtitles: [start, end, text] absolute seconds (ASR word times + 0.60).
SUBS = [
    [0.60, 1.30, "What's new in Lompoc."],
    [2.05, 4.50, "Jim Mosby and Jeremy Ball are running for mayor in November."],
    [5.30, 10.35, "The city held its first workshop on a $7 million plan to expand the soccer fields at Riverbend Park."],
    [11.20, 18.55, "Sept. 19: True Vine Bible Fellowship on Avalon Street is giving away 1,000 pairs of shoes, with free haircuts and food."],
    [19.20, 21.10, "Full stories on lompoclocals.com"],
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"; DEEP = "#3a0743"


def A_for(H):
    if H == 1920:
        return dict(H=1920, BAR=115, MT=190, PANEL_B="22%", SUB=44, SUBBOT=170, HL=58, HSUB=30, WM=96, WM2=150, TAG=40, COL_TOP="31%", END_TOP="27%", PHOTO_TOP=400)
    return dict(H=1350, BAR=80, MT=130, PANEL_B="20.5%", SUB=38, SUBBOT=112, HL=52, HSUB=27, WM=84, WM2=128, TAG=36, COL_TOP="26%", END_TOP="22%", PHOTO_TOP=0)


def common_css(cid, A):
    s = f'[data-composition-id="{cid}"]'
    return f"""
      {s} .cine-bar {{ position: absolute; left: 0; right: 0; height: {A['BAR']}px; background: #0a060c; z-index: 60; }}
      {s} .cine-top {{ top: 0; }} {s} .cine-bot {{ bottom: 0; }}
      {s} .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      {s} .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 66%, rgba(10,6,12,0.40) 100%); }}
      {s} .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      {s} .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      {s} .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.06) saturate(1.08); }}
      {s} .blur {{ position: absolute; inset: -6%; background-size: cover; background-position: 50% 50%; filter: blur(34px) brightness(0.55) saturate(1.25); }}
      {s} .whole {{ display: block; position: absolute; left: 0; width: 1080px; height: auto; top: {A['PHOTO_TOP']}px; box-shadow: 0 30px 80px rgba(0,0,0,0.55); filter: contrast(1.06) saturate(1.08); }}
      {s} .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.90) 0%, rgba(20,10,23,0.62) 30%, rgba(20,10,23,0.0) 56%); }}
      {s} .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.70) 0%, rgba(20,10,23,0.25) 20%, rgba(20,10,23,0.0) 36%); }}
      {s} .chip {{ position: absolute; left: 84px; top: {A['MT']}px; z-index: 36; display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 28px; letter-spacing: 3px; padding: 12px 24px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      {s} .brand {{ position: absolute; left: 84px; top: {A['MT'] + 78}px; z-index: 36; color: rgba(255,255,255,0.86); font-weight: 800; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; opacity: 0; will-change: opacity; text-shadow: 0 2px 10px rgba(10,6,12,0.6); }}
      {s} .panel {{ position: absolute; left: 84px; right: 84px; bottom: {A['PANEL_B']}; z-index: 36; background: rgba(20,10,23,0.78); border-radius: 26px; padding: 30px 36px 32px; box-shadow: 0 24px 60px rgba(10,6,12,0.5); opacity: 0; will-change: transform, opacity; backdrop-filter: blur(6px); }}
      {s} .rule {{ display: block; width: 110px; height: 6px; background: {GOLD}; border-radius: 3px; margin-bottom: 18px; transform-origin: 0% 50%; }}
      {s} .hl {{ display: block; color: #fff; font-weight: 800; font-size: {A['HL']}px; line-height: 1.06; letter-spacing: -1px; opacity: 0; will-change: transform, opacity; }}
      {s} .hsub {{ display: block; margin-top: 14px; color: {GOLD}; font-weight: 700; font-size: {A['HSUB']}px; line-height: 1.3; letter-spacing: 0.3px; opacity: 0; will-change: transform, opacity; }}
    """


def frame(cid, dur, bg, css, body, script, A):
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{A['H']}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {bg}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
{body}
      <div class="vig"></div>
    </div>
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
{script}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


# ─── s1 open: LOMPOC LOCALS NEWS wordmark slam ───────────────────────────────
def s1_open(cid, dur, A):
    s = f'[data-composition-id="{cid}"]'
    css = common_css(cid, A) + f"""
      {s} .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 90% 70% at 50% 40%, #7d1590 0%, {PURPLE} 45%, {DEEP} 100%); }}
      {s} .bloom {{ position: absolute; left: 50%; top: 42%; width: 1100px; height: 1100px; margin-left: -550px; margin-top: -550px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.18), rgba(239,198,24,0) 60%); opacity: 0; }}
      {s} .col {{ position: absolute; left: 60px; right: 60px; top: {A['COL_TOP']}; z-index: 20; text-align: center; }}
      {s} .wm {{ display: block; color: #fff; font-weight: 800; font-size: {A['WM']}px; line-height: 0.98; letter-spacing: -3px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; text-shadow: 0 10px 40px rgba(10,6,12,0.45); }}
      {s} .wm2 {{ display: block; color: {GOLD}; font-weight: 800; font-size: {A['WM2']}px; line-height: 0.98; letter-spacing: -2px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; text-shadow: 0 10px 40px rgba(10,6,12,0.45); }}
      {s} .pill {{ display: inline-block; margin-top: 36px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 28px; letter-spacing: 4px; padding: 12px 26px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      {s} .tag {{ display: block; margin-top: 26px; color: rgba(255,255,255,0.92); font-weight: 600; font-size: {A['TAG']}px; letter-spacing: 0.2px; opacity: 0; will-change: transform, opacity; }}
    """
    body = f'''      <div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="col">
        <span class="wm" id="{cid}-wm">Lompoc Locals</span>
        <span class="wm2" id="{cid}-wm2">News</span>
        <span class="pill" id="{cid}-pill">{EDITION}</span>
        <span class="tag" id="{cid}-tag">Your source for Lompoc news.</span>
      </div>'''
    script = f'''        // BEATS: SLAM 0.15 (wordmark), PILL 0.45, TAG 0.70
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.9, ease: "power2.out" }}, 0.10);
        tl.fromTo("#{cid}-wm", {{ autoAlpha: 0, scale: 1.45, y: 10 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: "back.out(2.2)" }}, 0.15);
        tl.fromTo("#{cid}-wm2", {{ autoAlpha: 0, scale: 1.55, y: 14 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: "back.out(2.4)" }}, 0.24);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, 0.45);
        tl.fromTo("#{cid}-tag", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 0.70);'''
    return frame(cid, dur, PURPLE, css, body, script, A)


# ─── story scenes ─────────────────────────────────────────────────────────────
def story(cid, dur, A, img, pos, kb, chip, hl, sub, t_hl, t_sub):
    css = common_css(cid, A)
    if A["H"] == 1920:
        media = f'<div class="blur" style="background-image: url(public/{img})"></div><img class="whole" src="public/{img}" alt="" />'
    else:
        media = f'<img class="cover" src="public/{img}" alt="" style="object-position: {pos}" />'
    body = f'''      <div class="wrap" id="{cid}-w0" data-layout-allow-overflow>{media}</div>
      <div class="scrim"></div><div class="topscrim"></div>
      <span class="chip" id="{cid}-chip">{chip}</span>
      <span class="brand" id="{cid}-brand">Lompoc Locals News</span>
      <div class="panel" id="{cid}-panel">
        <span class="rule" id="{cid}-rule"></span>
        <span class="hl" id="{cid}-hl">{hl}</span>
        <span class="hsub" id="{cid}-sub">{sub}</span>
      </div>'''
    if kb[0] == "scale":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: {kb[1]} }}, {{ scale: {kb[2]}, duration: {dur:.2f}, ease: "none" }}, 0);'
    elif kb[0] == "drift":
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.10, xPercent: {kb[1]} }}, {{ scale: 1.10, xPercent: {kb[2]}, duration: {dur:.2f}, ease: "none" }}, 0);'
    else:
        kbt = f'tl.fromTo("#{cid}-w0", {{ scale: 1.10, yPercent: {kb[1]} }}, {{ scale: 1.10, yPercent: {kb[2]}, duration: {dur:.2f}, ease: "none" }}, 0);'
    script = f'''        // BEATS (relative): CHIP 0.15, HL {t_hl:.2f}, SUB {t_sub:.2f}
        {kbt}
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, 0.15);
        tl.fromTo("#{cid}-brand", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.4 }}, 0.30);
        tl.fromTo("#{cid}-panel", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, {t_hl:.2f});
        tl.fromTo("#{cid}-rule", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.4 }}, {t_hl:.2f} + 0.05);
        tl.fromTo("#{cid}-hl", {{ autoAlpha: 0, y: 16 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, {t_hl:.2f} + 0.08);
        tl.fromTo("#{cid}-sub", {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, {t_sub:.2f});'''
    return frame(cid, dur, BG, css, body, script, A)


# ─── s5 end ───────────────────────────────────────────────────────────────────
def s5_end(cid, dur, A):
    s = f'[data-composition-id="{cid}"]'
    css = common_css(cid, A) + f"""
      {s} .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 90% 70% at 50% 40%, #7d1590 0%, {PURPLE} 45%, {DEEP} 100%); }}
      {s} .bloom {{ position: absolute; left: 50%; top: 42%; width: 1100px; height: 1100px; margin-left: -550px; margin-top: -550px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.16), rgba(239,198,24,0) 60%); opacity: 0; }}
      {s} .col {{ position: absolute; left: 60px; right: 60px; top: {A['END_TOP']}; z-index: 20; text-align: center; }}
      {s} .swm {{ display: block; color: rgba(255,255,255,0.92); font-weight: 800; font-size: 34px; letter-spacing: 6px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      {s} .swm b {{ color: {GOLD}; font-weight: 800; }}
      {s} .srule {{ display: block; width: 110px; height: 6px; margin: 22px auto 0; background: {GOLD}; border-radius: 3px; opacity: 0; transform-origin: 50% 50%; }}
      {s} .line1 {{ display: block; margin-top: 40px; color: #fff; font-weight: 800; font-size: {A['WM'] - 10}px; line-height: 1.04; letter-spacing: -2px; opacity: 0; will-change: transform, opacity; text-shadow: 0 10px 40px rgba(10,6,12,0.45); }}
      {s} .url {{ display: inline-block; margin-top: 44px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 44px; letter-spacing: 0.5px; padding: 18px 40px; border-radius: 999px; opacity: 0; will-change: transform, opacity; box-shadow: 0 16px 40px rgba(10,6,12,0.4); }}
      {s} .daily {{ display: block; margin-top: 30px; color: rgba(255,255,255,0.72); font-weight: 600; font-size: 30px; letter-spacing: 1px; opacity: 0; will-change: transform, opacity; }}
    """
    body = f'''      <div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="col">
        <span class="swm" id="{cid}-swm">Lompoc Locals <b>News</b></span>
        <span class="srule" id="{cid}-srule"></span>
        <span class="line1" id="{cid}-l1">Informed Lompoc,<br />better Lompoc.</span>
        <span class="url" id="{cid}-url">lompoclocals.com/news</span>
        <span class="daily" id="{cid}-daily">The full stories, every day.</span>
      </div>'''
    # absolute 19.0 → 0.60 rel; 19.4 → 1.00 rel
    script = f'''        // BEATS (relative): WM 0.30, LINE1 0.60 (=19.0 abs), URL 1.00 (=19.4 abs), DAILY 1.60
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.9, ease: "power2.out" }}, 0.20);
        tl.fromTo("#{cid}-swm", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 0.30);
        tl.fromTo("#{cid}-srule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.4 }}, 0.42);
        tl.fromTo("#{cid}-l1", {{ autoAlpha: 0, y: 22, scale: 1.04 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, 0.60);
        tl.fromTo("#{cid}-url", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }}, 1.00);
        tl.fromTo("#{cid}-daily", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 1.60);'''
    return frame(cid, dur, PURPLE, css, body, script, A)


# ─── overlays ─────────────────────────────────────────────────────────────────
def progress_scene(A):
    cid = "progress"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{A['H']}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .bar {{ position: absolute; left: 0; right: 0; bottom: {A['BAR']}px; height: 6px; background: {GOLD}; transform-origin: 0% 50%; transform: scaleX(0); z-index: 70; box-shadow: 0 0 12px rgba(239,198,24,0.6); }}
      [data-composition-id="{cid}"] .mark {{ position: absolute; top: {A['MT']}px; right: 84px; width: 96px; height: auto; z-index: 65; opacity: 0.92; }}
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


def subs(A):
    cid = "subs"; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: {A['SUBBOT']}px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      {s} .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      {s} .sub span {{ display: inline-block; max-width: 920px; background: rgba(0,0,0,0.58); color: #fff; font-weight: 600; font-size: {A['SUB']}px; line-height: 1.25; padding: 16px 30px; border-radius: 22px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
"""
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{A['H']}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>{css}
    </style>
    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>
    <script>
      (() => {{
        // SUBS = [[start, end, text], ...] absolute seconds from the ASR word times. Text lives in the DOM above; times drive show/hide.
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


def scene_html(cid, start, dur, A):
    if cid == "s1-open":
        return s1_open(cid, dur, A)
    if cid == "s2-mayor":   # HL abs 2.1 → rel 0.30 · SUB abs 2.7 → rel 0.90
        return story(cid, dur, A, "civic.jpg", "50% 45%", ("scale", 1.0, 1.08), "City Hall",
                     "Mosby and Ball compete for mayor", "Incumbent Jim Mosby vs. Councilman Jeremy Ball · November", 0.30, 0.90)
    if cid == "s3-river":   # HL abs 5.4 → rel 0.30 · SUB abs 6.2 → rel 1.10
        return story(cid, dur, A, "riverbend.jpg", "50% 50%", ("drift", -3, 3), "Parks",
                     "Riverbend Park soccer field expansion", "First community workshop · roughly $7 million · turf fields, parking, walking path", 0.30, 1.10)
    if cid == "s4-shoes":   # HL abs 11.3 → rel 0.30 · SUB abs 12.4 → rel 1.40
        return story(cid, dur, A, "shoes.jpg", "50% 40%", ("scale", 1.08, 1.0), "Community",
                     "1,000 pairs of shoes · Sept. 19", "True Vine Bible Fellowship · 533 Avalon St · 10 AM–2 PM · free haircuts and food", 0.30, 1.40)
    if cid == "s5-end":
        return s5_end(cid, dur, A)
    raise ValueError(cid)


def index_html(A, folder):
    H = A["H"]
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="8"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.6, "v": 0.26}, {"t": 21.3, "v": 0.26}, {"t": 22.5, "v": 0}]}]}'
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
    <!-- LOMPOC LOCALS NEWS — edition #1 ({EDITION}). {TOTAL:.2f}s. Our own photos, headline panels, burned-in subtitles (track 9), progress line + mark (track 8).
         Scenes on rising tracks so each new scene fades in on top ({X}s). Generated by gen.py — edit there. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo-dylan.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.86" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.26" data-fade-in="0.6" data-fade-out="1.2" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
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


for H, folder, idx in ((1920, "compositions", "index.html"), (1350, "compositions-4x5", "index-4x5.tmpl")):
    A = A_for(H)
    os.makedirs(os.path.join(HERE, folder), exist_ok=True)
    for cid, start, dur in SCENES:
        write(f"{folder}/{cid}.html", scene_html(cid, start, dur, A))
    write(f"{folder}/progress.html", progress_scene(A))
    write(f"{folder}/subs.html", subs(A))
    write(idx, index_html(A, folder))
print("wrote", [s[0] for s in SCENES], "+ progress, subs, index.html, index-4x5.tmpl")
