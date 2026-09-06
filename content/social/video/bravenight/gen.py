#!/usr/bin/env python3
"""
THE BRAVE'S NIGHT — Big Game saga, a victory story (Lompoc 38, Cabrillo 2 — Noozhawk, Sep 4 2026).
Single source of truth: `python3 gen.py` rewrites index.html, index-4x5.tmpl, compositions/, compositions-4x5/.
Retime by editing SCENES / BEATS / SUBS. VO is one clip at VO_START.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    # id,          start,  dur   (absolute seconds)
    ("s1-open",    0.00,   5.10),
    ("s2-night",   4.85,   4.45),
    ("s3-conq",    9.05,   3.85),
    ("s4-brave",   12.65,  3.55),
    ("s5-clash",   15.95,  4.80),
    ("s6-victory", 20.50,  6.80),
    ("s7-end",     27.05,  4.45),
]
TOTAL = 31.50
VO_START = 0.60
VO_DUR = 28.70

import sys
# `python3 gen.py 1` rebuilds v1 (kept reproducible); default is v2 (Sep 6: new opening from the lineup clips).
VERSION = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else int(os.environ.get("BRAVENIGHT_VERSION", "3"))
VO_SRC = "public/vo-arthur.wav"
VO_SEGS = None  # v2: list of (media_start, duration, placed_at) slices of VO_SRC

# In-scene beats (relative to scene start), timed to the ASR word times (+0.60).
BEATS = {
    "s1-open":    dict(CHIP=0.40, TITLE=1.40, LINE=2.20),
    "s2-night":   dict(CHIP=0.45),
    "s3-conq":    dict(CHIP=0.35, CUT=1.30, CARD=1.25),
    "s4-brave":   dict(CARD=0.25),
    "s5-clash":   dict(CUT=1.95, HIT=1.97),           # cut to the impact frame, white flash + shield-hit at HIT (18.03 abs)
    "s6-victory": dict(SCORE_L=1.22, SCORE_C=4.44, RAISE=3.30),   # "Lompoc 38" 21.72 · "Cabrillo 2" 24.94 · staff rises ≈23.8
    "s7-end":     dict(BADGES=0.35, LINE=0.55, RESPECT=1.95, FIND=2.35, SRC=3.00),
}
B4_RATE = 0.76  # b4-victory (5.04 s) slowed to fill the 6.8 s victory scene

SUBS = [
    [0.60,  3.40,  "One town raised two legends."],
    [4.60,  7.90,  "On Friday night, only one could carry it home."],
    [8.90,  11.40, "The Conquistador came down from the bluffs."],
    [12.30, 14.40, "The Brave rose from the fields."],
    [15.60, 17.80, "Under the lights at Huyck, they met."],
    [18.80, 21.30, "And when the dust settled, the Brave stood."],
    [21.70, 23.70, "Lompoc 38."],
    [24.90, 26.00, "Cabrillo 2."],
    [26.80, 29.20, "The Big Game goes to the Braves."],
]

if VERSION == 2:
    # ─── v2: no repeated openings. Lineups (n1/n2), advance (n3), clash (b3), victory (b4), end. ──
    SCENES = [
        ("s1-conq",        0.00,  4.60),   # n1 media 0: title over the Conquistador line
        ("s2-brave",       4.35,  4.45),   # n2 media 0: FRIDAY NIGHT · HUYCK STADIUM
        ("s3-conq-ready",  8.55,  2.45),   # n1 media 2.60: shields rise + Cabrillo card
        ("s4-brave-ready", 10.75, 2.45),   # n2 media 2.60: staffs rise + Lompoc card
        ("s5-advance",     12.95, 4.95),   # n3: both lines walk toward midfield
        ("s6-clash",       17.65, 2.25),   # b3 media 2.80: burst, flash, hold
        ("s7-victory",     19.65, 9.95),   # b4 at 0.50x: standing → staff rises under the score rows
        ("s8-end",         29.35, 4.65),   # the v1 end card
    ]
    TOTAL = 34.00
    VO_SRC = "public/vo-arthur-v2.wav"
    VO_SEGS = [
        (0.00, 3.30, 0.60),   # One town raised two legends.
        (3.40, 3.85, 4.60),   # On Friday night, they lined up under the lights at Huyck.
        (7.30, 2.00, 8.75),   # The Conquistadores, ready.
        (9.70, 1.30, 11.00),  # The Braves, ready.
        (11.70, 1.60, 13.30), # And then they went.
        (13.95, 2.60, 19.00), # When the dust settled, the Brave stood.
        (17.45, 2.80, 23.40), # Lompoc 38. Cabrillo 2.
        (20.65, 2.44, 29.80), # The Big Game goes to the Braves.
    ]
    BEATS = {
        "s1-conq":        dict(CHIP=0.35, TITLE=1.00, LINE=1.70),
        "s2-brave":       dict(CHIP=0.45),
        "s3-conq-ready":  dict(CARD=0.20),
        "s4-brave-ready": dict(CARD=0.25),
        "s5-advance":     dict(),
        "s6-clash":       dict(HIT=0.27),                              # 17.92 abs: white flash + shake + shield-hit
        "s7-victory":     dict(SCORE_L=4.05, SCORE_C=5.45, RAISE=4.95), # 23.70 · 25.10 · roar/flare 24.60
        "s8-end":         dict(BADGES=0.35, LINE=0.55, RESPECT=1.95, FIND=2.35, SRC=3.00),
    }
    B4_RATE = 0.50  # b4-victory (5.04 s) at half speed fills the 9.95 s victory scene; staff fully up ≈ 28.65
    SUBS = [
        [0.60,  3.60,  "One town raised two legends."],
        [4.60,  8.30,  "On Friday night, they lined up under the lights at Huyck."],
        [8.75,  10.60, "The Conquistadores, ready."],
        [11.00, 12.30, "The Braves, ready."],
        [13.30, 14.90, "And then they went."],
        [19.00, 21.60, "When the dust settled, the Brave stood."],
        [23.40, 24.90, "Lompoc 38."],
        [25.10, 26.30, "Cabrillo 2."],
        [29.80, 32.30, "The Big Game goes to the Braves."],
    ]

if VERSION == 3:
    # ─── v3: each lineup ONCE (title + card on n1, chip + card on n2), advance, NEW clash (b5, the Brave's own arms), victory, end. ──
    SCENES = [
        ("s1-conq",    0.00,  6.20),   # n1 at 0.80x: title → Cabrillo card
        ("s2-brave",   5.95,  6.05),   # n2 at 0.80x: FRIDAY NIGHT chip → Lompoc card
        ("s3-advance", 11.75, 4.95),   # n3: both lines walk toward midfield
        ("s4-clash",   16.45, 5.00),   # b5-clash2: lance + sun shield vs sword + red shield; impact at media 2.60
        ("s5-victory", 21.20, 6.90),   # b4 at 0.60x: standing → staff rises under the score rows
        ("s6-end",     27.85, 4.65),   # the end card
    ]
    TOTAL = 32.50
    VO_SRC = "public/vo-arthur-v2.wav"
    VO_SEGS = [
        (0.00, 3.30, 0.60),   # One town raised two legends.
        (7.30, 2.00, 4.50),   # The Conquistadores, ready.
        (3.40, 3.85, 6.60),   # On Friday night, they lined up under the lights at Huyck.
        (9.70, 1.30, 10.60),  # The Braves, ready.
        (11.70, 1.60, 12.20), # And then they went.
        (13.95, 2.60, 20.30), # When the dust settled, the Brave stood.
        (17.45, 2.80, 23.60), # Lompoc 38. Cabrillo 2.
        (20.65, 2.44, 28.30), # The Big Game goes to the Braves.
    ]
    BEATS = {
        "s1-conq":    dict(CHIP=0.35, TITLE=1.00, LINE=1.70, TITLE_OUT=3.55, CARD=4.40),
        "s2-brave":   dict(CHIP=0.45, CARD=4.55),
        "s3-advance": dict(),
        "s4-clash":   dict(HIT=2.60),                                   # 19.05 abs: sparks first visible in b5-clash2
        "s5-victory": dict(SCORE_L=2.70, SCORE_C=4.10, RAISE=3.60),     # 23.90 · 25.30 · roar/flare 24.80
        "s6-end":     dict(BADGES=0.35, LINE=0.55, RESPECT=1.95, FIND=2.35, SRC=3.00),
    }
    LINE_RATE = 0.80  # n1/n2 (5.04 s) at 0.80x cover 6.30 s — enough for their 6.20/6.05 s scenes
    B4_RATE = 0.615   # v3: 6.90 s x 0.615 = 4.24 s = the clip from media 0.80 to its end (render gate needs >=95% of the clip used); staff up ~27.2
    B4_MS = 0.80
    SUBS = [
        [0.60,  3.60,  "One town raised two legends."],
        [4.50,  6.30,  "The Conquistadores, ready."],
        [6.60,  10.30, "On Friday night, they lined up under the lights at Huyck."],
        [10.60, 11.90, "The Braves, ready."],
        [12.20, 13.80, "And then they went."],
        [20.30, 22.90, "When the dust settled, the Brave stood."],
        [23.60, 25.10, "Lompoc 38."],
        [25.30, 26.50, "Cabrillo 2."],
        [28.30, 30.80, "The Big Game goes to the Braves."],
    ]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"; DARK = "#1a1030"; BG = "#050308"

GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E\")"


def A_of(H):
    """Aspect params: 9:16 vs 4:5."""
    if H == 1920:
        return dict(H=1920, BAR=115, MT=150, LB="21%", HERO=104, KICK=40, SUB=44, SUBBOT=170, BADGE=150, COL_TOP=300)
    return dict(H=1350, BAR=80, MT=100, LB="19%", HERO=84, KICK=34, SUB=38, SUBBOT=112, BADGE=124, COL_TOP=190)


def common_css(cid, A):
    s = f'[data-composition-id="{cid}"]'
    return f"""
      {s} .cine-bar {{ position: absolute; left: 0; right: 0; height: {A['BAR']}px; background: {BG}; z-index: 60; }}
      {s} .cine-top {{ top: 0; }} {s} .cine-bot {{ bottom: 0; }}
      {s} .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 95% 80% at 50% 45%, rgba(5,3,8,0) 42%, rgba(5,3,8,0.72) 100%); }}
      {s} .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.10; z-index: 50; background-image: {GRAIN}; }}
      {s} .mark {{ position: absolute; top: {A['MT']}px; right: 84px; width: 96px; height: auto; z-index: 40; }}
      {s} .stage {{ position: absolute; inset: 0; will-change: opacity; }}
      {s} .vidwrap {{ position: absolute; inset: 0; will-change: transform; transform-origin: 50% 50%; }}
      {s} video, {s} img.key {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.12) saturate(0.92) brightness(0.92); }}
      {s} .scrim {{ position: absolute; inset: 0; z-index: 20; background: linear-gradient(to top, rgba(5,3,8,0.94) 0%, rgba(5,3,8,0.62) 32%, rgba(5,3,8,0.0) 60%); }}
      {s} .lower {{ position: absolute; left: 84px; right: 84px; bottom: {A['LB']}; z-index: 35; }}
      {s} .divider {{ display: block; width: 100%; height: 6px; background: {GOLD}; border-radius: 3px; transform-origin: left center; will-change: transform, opacity; box-shadow: 0 0 18px rgba(239,198,24,0.55); }}
      {s} .card {{ display: flex; align-items: center; gap: 30px; margin-top: 30px; will-change: transform, opacity; }}
      {s} .card img {{ display: block; width: {A['BADGE']}px; height: {A['BADGE']}px; object-fit: contain; flex: 0 0 auto; filter: drop-shadow(0 8px 22px rgba(0,0,0,0.6)); }}
      {s} .kicker {{ display: block; color: {GOLD}; font-weight: 800; font-size: {A['KICK']}px; letter-spacing: 7px; text-transform: uppercase; line-height: 1; margin-bottom: 14px; }}
      {s} .hero {{ color: #fff; text-shadow: 0 6px 30px rgba(0,0,0,0.7); font-weight: 800; font-size: {A['HERO']}px; line-height: 0.95; letter-spacing: -4px; text-transform: uppercase; }}
      {s} .wipe {{ position: absolute; top: 0; bottom: 0; left: -40px; width: 28px; background: {GOLD}; box-shadow: 0 0 40px rgba(239,198,24,0.8); z-index: 45; opacity: 0; will-change: transform, opacity; }}
      {s} .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 34px; letter-spacing: 4px; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; }}
"""


def wrap(cid, dur, bg, css, body, script, A, nomark=False):
    mark = "" if nomark else '<img class="mark" src="public/mark-white.png" alt="" />'
    return f"""<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{A['H']}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {bg}">
    <style>{common_css(cid, A)}{css}
    </style>
{body}
    {mark}
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
{script}
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
"""



# ─── s1 open ──────────────────────────────────────────────────────────────────────
def s1_open(A, dur):
    cid = "s1-open"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} img.key {{ filter: brightness(0.5) contrast(1.1) saturate(0.85); }}
      {s} .col {{ position: absolute; left: 60px; right: 60px; top: {A['COL_TOP'] + 30}px; z-index: 35; text-align: center; }}
      {s} .chip {{ font-size: 36px; padding: 16px 34px; opacity: 0; }}
      {s} .title {{ display: block; margin-top: 34px; color: #fff; font-weight: 800; font-size: {A['HERO'] + 22}px; line-height: 0.92; letter-spacing: -5px; text-transform: uppercase; text-shadow: 0 10px 40px rgba(0,0,0,0.8); opacity: 0; will-change: transform, opacity; }}
      {s} .title em {{ font-style: normal; color: {GOLD}; }}
      {s} .line {{ display: block; margin-top: 26px; color: rgba(255,255,255,0.82); font-weight: 700; font-size: 30px; letter-spacing: 6px; text-transform: uppercase; opacity: 0; }}
      {s} .dark {{ position: absolute; inset: 0; z-index: 25; background: rgba(5,3,8,0.35); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="vidwrap" id="{cid}-wrap" data-layout-allow-overflow><img class="key" src="public/faceoff-key.png" alt="" /></div>
      <div class="dark"></div>
      <div class="vig"></div>
      <div class="col">
        <span class="chip" id="{cid}-chip">The Big Game</span>
        <span class="title" id="{cid}-title">The <em>Brave's</em><br />Night</span>
        <span class="line" id="{cid}-line">A Lompoc story</span>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CHIP, TITLE, LINE. END = scene duration.
        const B = {{ CHIP: {B['CHIP']}, TITLE: {B['TITLE']}, LINE: {B['LINE']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.7, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wrap", {{ scale: 1.0 }}, {{ scale: 1.07, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.CHIP);
        tl.fromTo("#{cid}-title", {{ autoAlpha: 0, scale: 1.22 }}, {{ autoAlpha: 1, scale: 1, duration: 0.6, ease: "expo.out" }}, B.TITLE);
        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.LINE);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── s2 night (fields, graded to dusk) ─────────────────────────────────────────────
def s2_night(A, dur):
    cid = "s2-night"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: brightness(0.42) contrast(1.2) saturate(0.55) sepia(0.25) hue-rotate(190deg); }}
      {s} .lower .chip {{ opacity: 0; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .glow {{ position: absolute; left: 20%; right: 20%; top: 18%; height: 30%; z-index: 21; background: radial-gradient(ellipse at 50% 100%, rgba(239,198,24,0.22), rgba(239,198,24,0) 70%); pointer-events: none; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/land-lompoc.mp4" data-start="0" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video></div>
      <div class="glow"></div>
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="lower">
        <span class="divider" id="{cid}-div"></span>
        <div style="margin-top: 26px"><span class="chip" id="{cid}-chip">Friday night · Huyck Stadium</span></div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CHIP. END = scene duration.
        const B = {{ CHIP: {B['CHIP']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.08, yPercent: 2 }}, {{ scale: 1.0, yPercent: -2, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, B.CHIP - 0.2);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, B.CHIP);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── s3 conquistador (land → descend) ─────────────────────────────────────────────
def s3_conq(A, dur):
    cid = "s3-conq"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    hp = A["HERO"] - 32
    css = f"""
      {s} .card > div {{ flex: 1 1 auto; min-width: 0; }}
      {s} .hero {{ font-size: {hp}px; letter-spacing: -3px; white-space: nowrap; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .card {{ opacity: 0; }}
      {s} #{cid}-w1 {{ opacity: 0; }}
      {s} .topchip {{ position: absolute; left: 84px; top: {A['MT'] + 4}px; z-index: 36; }}
      {s} .topchip .chip {{ opacity: 0; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid-land" class="clip" src="public/land-cabrillo.mp4" data-start="0" data-duration="{B['CUT']:.2f}" data-track-index="0" muted playsinline></video></div>
      <div class="vidwrap" id="{cid}-w1" data-layout-allow-overflow><video id="{cid}-vid-char" class="clip" src="public/b2-descend.mp4" data-start="{B['CUT']:.2f}" data-media-start="0.60" data-duration="{dur - B['CUT']:.2f}" data-track-index="1" muted playsinline></video></div>
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="topchip"><span class="chip" id="{cid}-chip">The challenger</span></div>
      <div class="lower">
        <span class="divider" id="{cid}-div"></span>
        <div class="card" id="{cid}-card">
          <img src="public/badge-conqs.png" alt="" />
          <div><span class="kicker">Cabrillo</span><div class="hero">Conquistadores</div></div>
        </div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CHIP "The challenger", CUT land → descend, CARD chapter card. END = scene duration.
        const B = {{ CHIP: {B['CHIP']}, CUT: {B['CUT']:.2f}, CARD: {B['CARD']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.06, duration: B.CUT, ease: "none" }}, 0);
        tl.set("#{cid}-w0", {{ autoAlpha: 0 }}, B.CUT);
        tl.set("#{cid}-w1", {{ autoAlpha: 1 }}, B.CUT);
        tl.fromTo("#{cid}-w1", {{ scale: 1.0 }}, {{ scale: 1.05, duration: B.END - B.CUT, ease: "none" }}, B.CUT);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, x: -16 }}, {{ autoAlpha: 1, x: 0, duration: 0.4 }}, B.CHIP);
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, B.CARD - 0.15);
        tl.fromTo("#{cid}-card", {{ autoAlpha: 0, y: 22 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, B.CARD);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── s4 brave ─────────────────────────────────────────────────────────────────────
def s4_brave(A, dur):
    cid = "s4-brave"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} .card > div {{ flex: 1 1 auto; min-width: 0; }}
      {s} .hero {{ white-space: nowrap; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .card {{ opacity: 0; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/b1-fields.mp4" data-start="0" data-media-start="0.40" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video></div>
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="lower">
        <span class="divider" id="{cid}-div"></span>
        <div class="card" id="{cid}-card">
          <img src="public/badge-braves.png" alt="" />
          <div><span class="kicker">Lompoc</span><div class="hero">Braves</div></div>
        </div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CARD chapter card. END = scene duration.
        const B = {{ CARD: {B['CARD']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.07, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, B.CARD - 0.15);
        tl.fromTo("#{cid}-card", {{ autoAlpha: 0, y: 22 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, B.CARD);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── s5 clash (face-off key → impact) ─────────────────────────────────────────────
def s5_clash(A, dur):
    cid = "s5-clash"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} img.key {{ filter: brightness(0.72) contrast(1.15) saturate(0.9); }}
      {s} #{cid}-w1 {{ opacity: 0; }}
      {s} #{cid}-w1 video {{ filter: contrast(1.1) saturate(1.0) brightness(0.98); }}
      {s} .fog {{ position: absolute; inset: -10%; z-index: 22; background: radial-gradient(ellipse 70% 40% at 50% 80%, rgba(180,200,255,0.18), rgba(180,200,255,0) 70%); pointer-events: none; }}
      {s} .flash {{ position: absolute; inset: 0; z-index: 58; background: #fff; opacity: 0; pointer-events: none; }}
      {s} .shake {{ position: absolute; inset: 0; will-change: transform; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      <div class="shake" id="{cid}-shake" data-layout-allow-overflow>
        <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><img class="key" src="public/faceoff-key.png" alt="" /></div>
        <div class="vidwrap" id="{cid}-w1" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/b3-clash.mp4" data-start="{B['CUT']:.2f}" data-media-start="2.80" data-duration="{min(dur - B['CUT'], 5.04 - 2.80):.2f}" data-track-index="1" muted playsinline></video></div>
      </div>
      <div class="fog"></div>
      <div class="vig"></div>
      <div class="flash" id="{cid}-flash"></div>
    </div>"""
    script = f"""        // BEATS (relative): CUT face-off key → impact clip, HIT white flash + shake (shield-hit SFX placed at the same absolute time in index). END = scene duration.
        const B = {{ CUT: {B['CUT']:.2f}, HIT: {B['HIT']:.2f}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.12, duration: B.CUT, ease: "power1.in" }}, 0);
        tl.set("#{cid}-w0", {{ autoAlpha: 0 }}, B.CUT);
        tl.set("#{cid}-w1", {{ autoAlpha: 1 }}, B.CUT);
        tl.fromTo("#{cid}-w1", {{ scale: 1.04 }}, {{ scale: 1.0, duration: B.END - B.CUT, ease: "none" }}, B.CUT);
        tl.fromTo("#{cid}-flash", {{ autoAlpha: 0 }}, {{ autoAlpha: 0.95, duration: 0.05, ease: "none" }}, B.HIT).to("#{cid}-flash", {{ autoAlpha: 0, duration: 0.22, ease: "power2.out" }}, B.HIT + 0.05);
        tl.fromTo("#{cid}-shake", {{ x: 0, y: 0 }}, {{ x: -14, y: 9, duration: 0.05, ease: "none" }}, B.HIT).to("#{cid}-shake", {{ x: 11, y: -7, duration: 0.06 }}, B.HIT + 0.05).to("#{cid}-shake", {{ x: -6, y: 4, duration: 0.06 }}, B.HIT + 0.11).to("#{cid}-shake", {{ x: 0, y: 0, duration: 0.12 }}, B.HIT + 0.17);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── s6 victory (Brave stands, staff rises; score lower-third) ────────────────────
def s6_victory(A, dur):
    cid = "s6-victory"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: contrast(1.12) saturate(0.95) brightness(0.95); }}
      {s} .lower {{ bottom: {A['LB']}; }}
      {s} .score {{ display: flex; flex-direction: column; gap: 14px; }}
      {s} .srow {{ display: flex; align-items: center; gap: 22px; background: rgba(26,16,48,0.82); border: 2px solid rgba(239,198,24,0.28); border-radius: 22px; padding: 16px 26px; opacity: 0; will-change: transform, opacity; position: relative; overflow: hidden; }}
      {s} .srow img {{ display: block; width: {A['BADGE'] - 40}px; height: {A['BADGE'] - 40}px; object-fit: contain; flex: 0 0 auto; }}
      {s} .srow .name {{ flex: 1 1 auto; color: #fff; font-weight: 800; font-size: 44px; letter-spacing: 0; text-transform: uppercase; line-height: 1.0; text-align: left; }}
      {s} .srow .name small {{ display: block; font-size: 22px; letter-spacing: 4px; font-weight: 700; opacity: 0.75; margin-bottom: 4px; }}
      {s} .srow .num {{ flex: 0 0 auto; min-width: 150px; text-align: right; color: #fff; font-weight: 800; font-size: 104px; line-height: 0.9; letter-spacing: -5px; font-variant-numeric: tabular-nums; }}
      {s} .srow.win .num {{ color: {GOLD}; }}
      {s} .winrule {{ position: absolute; left: 26px; right: 26px; bottom: 6px; height: 8px; background: {GOLD}; border-radius: 4px; transform-origin: left center; opacity: 0; box-shadow: 0 0 16px rgba(239,198,24,0.6); }}
      {s} .flare {{ position: absolute; left: -20%; right: -20%; top: -10%; height: 60%; z-index: 23; background: radial-gradient(ellipse 45% 55% at 50% 30%, rgba(200,220,255,0.35), rgba(200,220,255,0) 70%); opacity: 0; pointer-events: none; mix-blend-mode: screen; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/b4-victory.mp4" data-start="0" data-media-start="0" data-duration="{dur:.2f}" data-playback-rate="{B4_RATE}" data-track-index="0" muted playsinline></video></div>
      <div class="flare" id="{cid}-flare"></div>
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="lower">
        <div class="score">
          <div class="srow win" id="{cid}-row-l"><img src="public/badge-braves.png" alt="" /><div class="name"><small>Lompoc High</small>Braves</div><div class="num" id="{cid}-n-l">38</div><span class="winrule" id="{cid}-winrule"></span></div>
          <div class="srow" id="{cid}-row-c"><img src="public/badge-conqs.png" alt="" /><div class="name"><small>Cabrillo High</small>Conquistadores</div><div class="num" id="{cid}-n-c">2</div></div>
        </div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): SCORE_L "Lompoc 38" row, SCORE_C "Cabrillo 2" row, RAISE light flare as the staff goes up. END = scene duration.
        const B = {{ SCORE_L: {B['SCORE_L']}, SCORE_C: {B['SCORE_C']}, RAISE: {B['RAISE']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.18, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.08, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-row-l", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out" }}, B.SCORE_L);
        tl.fromTo("#{cid}-winrule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.5 }}, B.SCORE_L + 0.35);
        tl.fromTo("#{cid}-row-c", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out" }}, B.SCORE_C);
        tl.fromTo("#{cid}-flare", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 1.2, ease: "power2.out" }}, B.RAISE);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── s7 end ───────────────────────────────────────────────────────────────────────
def s7_end(A, dur, cid="s7-end"):
    B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    top = A['COL_TOP'] + 10
    css = f"""
      {s} .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 90% 70% at 50% 40%, #7a1690 0%, {PURPLE} 45%, #2a0533 100%); }}
      {s} .col {{ position: absolute; left: 70px; right: 70px; top: {top}px; z-index: 35; text-align: center; }}
      {s} .badges {{ display: flex; align-items: center; justify-content: center; gap: 60px; }}
      {s} .badges .bw {{ position: relative; width: {A['BADGE'] + 70}px; height: {A['BADGE'] + 70}px; opacity: 0; will-change: transform, opacity; }}
      {s} .badges img {{ display: block; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 12px 30px rgba(0,0,0,0.55)); position: relative; z-index: 2; }}
      {s} .ring {{ position: absolute; inset: -22px; border-radius: 50%; border: 6px solid {GOLD}; box-shadow: 0 0 40px rgba(239,198,24,0.7), inset 0 0 30px rgba(239,198,24,0.35); opacity: 0; z-index: 1; }}
      {s} .badges .x {{ color: {GOLD}; font-weight: 800; font-size: 44px; letter-spacing: 4px; opacity: 0; }}
      {s} .l1 {{ display: block; margin-top: 58px; color: #fff; font-weight: 800; font-size: {A['HERO'] - 26}px; line-height: 1.0; letter-spacing: -3px; text-transform: uppercase; text-shadow: 0 8px 30px rgba(0,0,0,0.6); opacity: 0; will-change: transform, opacity; }}
      {s} .l1 em {{ font-style: normal; color: {GOLD}; }}
      {s} .respect {{ display: block; margin-top: 18px; color: rgba(255,255,255,0.8); font-weight: 700; font-size: 30px; letter-spacing: 5px; text-transform: uppercase; opacity: 0; }}
      {s} .find {{ display: block; margin-top: 50px; opacity: 0; will-change: transform, opacity; }}
      {s} .find img {{ display: block; width: 110px; height: auto; margin: 0 auto; }}
      {s} .pill {{ display: inline-block; margin-top: 22px; background: {INK}; color: {GOLD}; font-weight: 800; font-size: 40px; letter-spacing: 1px; padding: 20px 40px; border-radius: 16px; }}
      {s} .pill small {{ display: block; color: rgba(255,255,255,0.7); font-size: 24px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }}
      {s} .src {{ position: absolute; left: 0; right: 0; bottom: {A['BAR'] + 22}px; text-align: center; color: rgba(255,255,255,0.5); font-size: 22px; font-weight: 600; letter-spacing: 2px; z-index: 36; opacity: 0; }}
      {s} .bloom {{ position: absolute; top: 12%; left: 140px; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.20), rgba(239,198,24,0) 62%); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="vig"></div>
      <div class="col">
        <div class="badges">
          <div class="bw" id="{cid}-b1"><span class="ring" id="{cid}-ring" data-layout-allow-overflow></span><img src="public/badge-braves.png" alt="" /></div>
          <span class="x" id="{cid}-x">&amp;</span>
          <div class="bw" id="{cid}-b2"><img src="public/badge-conqs.png" alt="" /></div>
        </div>
        <span class="l1" id="{cid}-l1">The Big Game<br />goes to the <em>Braves</em></span>
        <span class="respect" id="{cid}-respect">Respect to both sides</span>
        <div class="find" id="{cid}-find"><img src="public/mark-white.png" alt="" /><div class="pill"><small>Full story</small>lompoclocals.com/news</div></div>
      </div>
      <div class="src" id="{cid}-src">Score: Noozhawk · Week 2</div>
    </div>"""
    script = f"""        // BEATS (relative): BADGES both crests (Braves gets the gold ring), LINE, RESPECT, FIND pill, SRC. END = scene duration.
        const B = {{ BADGES: {B['BADGES']}, LINE: {B['LINE']}, RESPECT: {B['RESPECT']}, FIND: {B['FIND']}, SRC: {B['SRC']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.8 }}, 0);
        tl.fromTo("#{cid}-b1", {{ autoAlpha: 0, x: -40, scale: 0.8 }}, {{ autoAlpha: 1, x: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, B.BADGES);
        tl.fromTo("#{cid}-b2", {{ autoAlpha: 0, x: 40, scale: 0.8 }}, {{ autoAlpha: 1, x: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, B.BADGES);
        tl.fromTo("#{cid}-x", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.3 }}, B.BADGES + 0.3);
        tl.fromTo("#{cid}-ring", {{ autoAlpha: 0, scale: 0.7 }}, {{ autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }}, B.BADGES + 0.25);
        tl.to("#{cid}-ring", {{ scale: 1.04, duration: 0.6, yoyo: true, repeat: 3, ease: "sine.inOut" }}, B.BADGES + 0.9);
        tl.fromTo("#{cid}-l1", {{ autoAlpha: 0, scale: 1.12 }}, {{ autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out" }}, B.LINE);
        tl.fromTo("#{cid}-respect", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.RESPECT);
        tl.fromTo("#{cid}-find", {{ autoAlpha: 0, y: 28, scale: 0.92 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.3)" }}, B.FIND);
        tl.fromTo("#{cid}-src", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.4 }}, B.SRC);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, "transparent" if cid in ("s8-end", "s6-end") else "#2a0533", css, body, script, A, nomark=True)


# ─── subtitles overlay ────────────────────────────────────────────────────────────
def subs(A):
    cid = "subs"; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: {A['SUBBOT']}px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      {s} .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      {s} .sub span {{ display: inline-block; max-width: 900px; background: rgba(0,0,0,0.55); color: #fff; font-weight: 600; font-size: {A['SUB']}px; line-height: 1.25; padding: 16px 30px; border-radius: 22px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
"""
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    body = f"""    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>"""
    script = f"""        // SUBS = [[start, end, text], ...] absolute seconds — fill from the ASR word times. Text lives in the DOM above; times drive show/hide.
        const SUBS = [
          {subs_js}
        ];
        const tl = gsap.timeline({{ paused: true }});
        SUBS.forEach(([a, b], i) => {{
          tl.fromTo("#sub-" + i, {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" }}, a);
          tl.to("#sub-" + i, {{ autoAlpha: 0, duration: 0.12, ease: "power1.in" }}, b - 0.12);
        }});
        tl.set({{}}, {{}}, {TOTAL:.2f});"""
    html = f"""<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{A['H']}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>{css}
    </style>
{body}
    <script>
      (() => {{
{script}
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
"""
    return html


# ═══ v2 scene builders ═══════════════════════════════════════════════════════════
def _vid(cid, src, ms, dur, extra=""):
    return f'<div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/{src}" data-start="0" data-media-start="{ms:.2f}" data-duration="{dur:.2f}" data-track-index="0" {extra} muted playsinline></video></div>'


def v2_open(A, dur):
    """s1-conq: the Conquistador line under the title."""
    cid = "s1-conq"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: brightness(0.62) contrast(1.15) saturate(0.85); }}
      {s} .col {{ position: absolute; left: 60px; right: 60px; top: {A['COL_TOP'] + 10}px; z-index: 35; text-align: center; }}
      {s} .chip {{ font-size: 36px; padding: 16px 34px; opacity: 0; }}
      {s} .title {{ display: block; margin-top: 34px; color: #fff; font-weight: 800; font-size: {A['HERO'] + 22}px; line-height: 0.92; letter-spacing: -5px; text-transform: uppercase; text-shadow: 0 10px 40px rgba(0,0,0,0.8); opacity: 0; will-change: transform, opacity; }}
      {s} .title em {{ font-style: normal; color: {GOLD}; }}
      {s} .line {{ display: block; margin-top: 26px; color: rgba(255,255,255,0.82); font-weight: 700; font-size: 30px; letter-spacing: 6px; text-transform: uppercase; opacity: 0; }}
      {s} .top {{ position: absolute; left: 0; right: 0; top: 0; height: 58%; z-index: 21; background: linear-gradient(to bottom, rgba(5,3,8,0.78) 0%, rgba(5,3,8,0.45) 55%, rgba(5,3,8,0) 100%); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      {_vid(cid, "n1-conq-ready.mp4", 0.0, dur)}
      <div class="top"></div>
      <div class="vig"></div>
      <div class="col">
        <span class="chip" id="{cid}-chip">The Big Game</span>
        <span class="title" id="{cid}-title">The <em>Brave's</em><br />Night</span>
        <span class="line" id="{cid}-line">A Lompoc story</span>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CHIP, TITLE, LINE. END = scene duration.
        const B = {{ CHIP: {B['CHIP']}, TITLE: {B['TITLE']}, LINE: {B['LINE']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.7, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.06, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.CHIP);
        tl.fromTo("#{cid}-title", {{ autoAlpha: 0, scale: 1.22 }}, {{ autoAlpha: 1, scale: 1, duration: 0.6, ease: "expo.out" }}, B.TITLE);
        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.LINE);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v2_chip_scene(A, dur, cid, src, ms, chip_text, lift=0):
    """s2-brave: a lineup with a gold divider + chip."""
    B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} .lower .chip {{ opacity: 0; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .scrim {{ background: linear-gradient(to top, rgba(5,3,8,0.80) 0%, rgba(5,3,8,0.30) 26%, rgba(5,3,8,0.0) 48%); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      {_vid(cid, src, ms, dur)}
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="lower">
        <span class="divider" id="{cid}-div"></span>
        <div style="margin-top: 26px"><span class="chip" id="{cid}-chip">{chip_text}</span></div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CHIP. END = scene duration.
        const B = {{ CHIP: {B['CHIP']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: {1.0 + (0.14 if lift else 0)}, yPercent: {-lift} }}, {{ scale: {1.06 + (0.14 if lift else 0)}, yPercent: {-lift}, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, B.CHIP - 0.2);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, B.CHIP);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v2_card_scene(A, dur, cid, src, ms, badge, kicker, hero, hero_px, lift=0):
    """s3/s4: lineup with the gold divider + chapter card (identical treatment both schools)."""
    B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} .card > div {{ flex: 1 1 auto; min-width: 0; }}
      {s} .hero {{ font-size: {hero_px}px; letter-spacing: -3px; white-space: nowrap; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .card {{ opacity: 0; }}
      {s} .scrim {{ background: linear-gradient(to top, rgba(5,3,8,0.86) 0%, rgba(5,3,8,0.40) 28%, rgba(5,3,8,0.0) 50%); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      {_vid(cid, src, ms, dur)}
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="lower">
        <span class="divider" id="{cid}-div"></span>
        <div class="card" id="{cid}-card">
          <img src="public/{badge}" alt="" />
          <div><span class="kicker">{kicker}</span><div class="hero">{hero}</div></div>
        </div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): CARD chapter card. END = scene duration.
        const B = {{ CARD: {B['CARD']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: {1.04 + (0.14 if lift else 0)}, yPercent: {-lift} }}, {{ scale: {1.10 + (0.14 if lift else 0)}, yPercent: {-lift}, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, B.CARD - 0.15);
        tl.fromTo("#{cid}-card", {{ autoAlpha: 0, y: 22 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, B.CARD);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v2_advance(A, dur, cid="s5-advance"):
    """advance: both lines walk toward midfield. No card — the drums carry it."""
    s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: contrast(1.14) saturate(0.9) brightness(0.9); }}
      {s} .scrim {{ background: linear-gradient(to top, rgba(5,3,8,0.7) 0%, rgba(5,3,8,0.25) 30%, rgba(5,3,8,0) 55%); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      {_vid(cid, "n3-advance.mp4", 0.0, dur)}
      <div class="scrim"></div>
      <div class="vig"></div>
    </div>"""
    script = f"""        // No text beats; END = scene duration.
        const B = {{ END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.08, duration: B.END, ease: "power1.in" }}, 0);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v2_clash(A, dur):
    """s6-clash: the burst frame of b3 (media 2.80) with flash + shake + hold."""
    cid = "s6-clash"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: contrast(1.1) saturate(1.0) brightness(0.98); }}
      {s} .fog {{ position: absolute; inset: -10%; z-index: 22; background: radial-gradient(ellipse 70% 40% at 50% 80%, rgba(180,200,255,0.18), rgba(180,200,255,0) 70%); pointer-events: none; }}
      {s} .flash {{ position: absolute; inset: 0; z-index: 58; background: #fff; opacity: 0; pointer-events: none; }}
      {s} .shake {{ position: absolute; inset: 0; will-change: transform; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="shake" id="{cid}-shake" data-layout-allow-overflow>
        {_vid(cid, "b3-clash.mp4", 2.80, min(dur, 5.04 - 2.80))}
      </div>
      <div class="fog"></div>
      <div class="vig"></div>
      <div class="flash" id="{cid}-flash"></div>
    </div>"""
    script = f"""        // BEATS (relative): HIT white flash + shake (shield-hit SFX at the same absolute time in index). END = scene duration.
        const B = {{ HIT: {B['HIT']:.2f}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.12, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-w0", {{ scale: 1.06 }}, {{ scale: 1.0, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-flash", {{ autoAlpha: 0 }}, {{ autoAlpha: 0.95, duration: 0.05, ease: "none" }}, B.HIT).to("#{cid}-flash", {{ autoAlpha: 0, duration: 0.22, ease: "power2.out" }}, B.HIT + 0.05);
        tl.fromTo("#{cid}-shake", {{ x: 0, y: 0 }}, {{ x: -14, y: 9, duration: 0.05, ease: "none" }}, B.HIT).to("#{cid}-shake", {{ x: 11, y: -7, duration: 0.06 }}, B.HIT + 0.05).to("#{cid}-shake", {{ x: -6, y: 4, duration: 0.06 }}, B.HIT + 0.11).to("#{cid}-shake", {{ x: 0, y: 0, duration: 0.12 }}, B.HIT + 0.17);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v2_victory(A, dur, cid="s7-victory"):
    """victory: b4 slowed — standing through 'the Brave stood', staff rises under the score rows."""
    B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: contrast(1.12) saturate(0.95) brightness(0.95); }}
      {s} .lower {{ bottom: {A['LB']}; }}
      {s} .score {{ display: flex; flex-direction: column; gap: 14px; }}
      {s} .srow {{ display: flex; align-items: center; gap: 22px; background: rgba(26,16,48,0.82); border: 2px solid rgba(239,198,24,0.28); border-radius: 22px; padding: 16px 26px; opacity: 0; will-change: transform, opacity; position: relative; overflow: hidden; }}
      {s} .srow img {{ display: block; width: {A['BADGE'] - 40}px; height: {A['BADGE'] - 40}px; object-fit: contain; flex: 0 0 auto; }}
      {s} .srow .name {{ flex: 1 1 auto; color: #fff; font-weight: 800; font-size: 44px; letter-spacing: 0; text-transform: uppercase; line-height: 1.0; text-align: left; }}
      {s} .srow .name small {{ display: block; font-size: 22px; letter-spacing: 4px; font-weight: 700; opacity: 0.75; margin-bottom: 4px; }}
      {s} .srow .num {{ flex: 0 0 auto; min-width: 150px; text-align: right; color: #fff; font-weight: 800; font-size: 104px; line-height: 0.9; letter-spacing: -5px; font-variant-numeric: tabular-nums; }}
      {s} .srow.win .num {{ color: {GOLD}; }}
      {s} .winrule {{ position: absolute; left: 26px; right: 26px; bottom: 6px; height: 8px; background: {GOLD}; border-radius: 4px; transform-origin: left center; opacity: 0; box-shadow: 0 0 16px rgba(239,198,24,0.6); }}
      {s} .flare {{ position: absolute; left: -20%; right: -20%; top: -10%; height: 60%; z-index: 23; background: radial-gradient(ellipse 45% 55% at 50% 30%, rgba(200,220,255,0.35), rgba(200,220,255,0) 70%); opacity: 0; pointer-events: none; mix-blend-mode: screen; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      {_vid(cid, "b4-victory.mp4", globals().get("B4_MS", 0.0), dur, f'data-playback-rate="{B4_RATE}"')}
      <div class="flare" id="{cid}-flare"></div>
      <div class="scrim"></div>
      <div class="vig"></div>
      <div class="lower">
        <div class="score">
          <div class="srow win" id="{cid}-row-l"><img src="public/badge-braves.png" alt="" /><div class="name"><small>Lompoc High</small>Braves</div><div class="num" id="{cid}-n-l">38</div><span class="winrule" id="{cid}-winrule"></span></div>
          <div class="srow" id="{cid}-row-c"><img src="public/badge-conqs.png" alt="" /><div class="name"><small>Cabrillo High</small>Conquistadores</div><div class="num" id="{cid}-n-c">2</div></div>
        </div>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): SCORE_L "Lompoc 38" row, SCORE_C "Cabrillo 2" row, RAISE light flare (crowd-roar at the same abs time). END = scene duration.
        const B = {{ SCORE_L: {B['SCORE_L']}, SCORE_C: {B['SCORE_C']}, RAISE: {B['RAISE']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.08, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-row-l", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out" }}, B.SCORE_L);
        tl.fromTo("#{cid}-winrule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.5 }}, B.SCORE_L + 0.35);
        tl.fromTo("#{cid}-row-c", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out" }}, B.SCORE_C);
        tl.fromTo("#{cid}-flare", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 1.2, ease: "power2.out" }}, B.RAISE);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v2_scene_html(cid, dur, A):
    if cid == "s1-conq": return v2_open(A, dur)
    if cid == "s2-brave": return v2_chip_scene(A, dur, cid, "n2-brave-ready.mp4", 0.0, "Friday night · Huyck Stadium", lift=9)
    if cid == "s3-conq-ready": return v2_card_scene(A, dur, cid, "n1-conq-ready.mp4", 2.60, "badge-conqs.png", "Cabrillo", "Conquistadores", A["HERO"] - 32)
    if cid == "s4-brave-ready": return v2_card_scene(A, dur, cid, "n2-brave-ready.mp4", 2.60, "badge-braves.png", "Lompoc", "Braves", A["HERO"], lift=9)
    if cid == "s5-advance": return v2_advance(A, dur)
    if cid == "s6-clash": return v2_clash(A, dur)
    if cid == "s7-victory": return v2_victory(A, dur)
    if cid == "s8-end": return s7_end(A, dur, cid="s8-end")
    raise ValueError(cid)


def v2_sfx_rows():
    import json
    carve = 'data-fx-carve=\'{"enabled":true,"sources":["voiceover"],"strength":0.35}\''
    def a(id_, src, start, dur, vol, pts, track, cv=True):
        pts_json = json.dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in pts]}]})
        return f'      <audio id="{id_}" class="clip" data-audio-group="sfx" src="public/sfx/{src}" data-start="{start:.2f}" data-media-start="0" data-duration="{dur:.2f}" data-track-index="{track}" data-volume="{vol}" data-automation=\'{pts_json}\' {carve if cv else ""}></audio>'
    ST = {cid: start for cid, start, _ in SCENES}
    s2 = ST["s2-brave"]; s3 = ST["s3-conq-ready"]; s4 = ST["s4-brave-ready"]; s5 = ST["s5-advance"]; s6 = ST["s6-clash"]; s7 = ST["s7-victory"]; s8 = ST["s8-end"]
    hit = s6 + BEATS["s6-clash"]["HIT"]
    raise_ = s7 + BEATS["s7-victory"]["RAISE"]
    rows = [
        a("sfx-drone", "low-drone.wav", 0.00, 4.80, 0.45, [(0, 0), (0.5, 0.45), (4.2, 0.45), (4.8, 0)], 13),
        a("sfx-murmur1", "stadium-murmur.wav", s2, 4.45, 0.45, [(0, 0), (0.5, 0.45), (4.0, 0.45), (4.45, 0)], 12),
        a("sfx-whoosh1", "whoosh.wav", s3, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur2", "stadium-murmur.wav", s3, 2.45, 0.4, [(0, 0), (0.3, 0.4), (2.1, 0.4), (2.45, 0)], 16),
        a("sfx-whoosh2", "whoosh.wav", s4, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur3", "stadium-murmur.wav", s4, 2.45, 0.4, [(0, 0), (0.3, 0.4), (2.1, 0.4), (2.45, 0)], 13),
        a("sfx-whoosh3", "whoosh.wav", s5, 2.00, 0.5, [(0, 0.5), (1.2, 0.5), (2.0, 0)], 15, False),
        a("sfx-murmur4", "stadium-murmur.wav", s5, 4.95, 0.5, [(0, 0), (0.4, 0.5), (4.5, 0.5), (4.95, 0)], 12),
        a("sfx-hit", "shield-hit.wav", hit, 3.00, 0.7, [(0, 0.7), (2.5, 0.7), (3.0, 0)], 14, False),
        a("sfx-murmur5", "stadium-murmur.wav", hit + 0.3, 4.00, 0.35, [(0, 0), (0.6, 0.35), (3.5, 0.35), (4.0, 0)], 16),
        a("sfx-roar", "crowd-roar.wav", raise_, 6.00, 0.45, [(0, 0), (0.6, 0.45), (2.4, 0.45), (3.0, 0.25), (5.4, 0.25), (6.0, 0)], 14),
        a("sfx-drone2", "low-drone.wav", s8, 4.65, 0.4, [(0, 0), (0.6, 0.4), (4.0, 0.4), (4.65, 0)], 13),
    ]
    return "\n".join(rows)



# ─── v3 builders ──────────────────────────────────────────────────────────────────
def v3_lineup(A, dur, cid, src, badge, kicker, hero, hero_px, lift=0, title=False, chip_text=None, scale_add=0.0, lower_bottom=None):
    """One lineup clip, shown once: optional title block (fades out), optional chip, then the chapter card."""
    B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: brightness(0.66) contrast(1.15) saturate(0.85); }}
      {s} .col {{ position: absolute; left: 60px; right: 60px; top: {A['COL_TOP'] + 10}px; z-index: 35; text-align: center; }}
      {s} .col .chip {{ font-size: 36px; padding: 16px 34px; opacity: 0; }}
      {s} .title {{ display: block; margin-top: 34px; color: #fff; font-weight: 800; font-size: {A['HERO'] + 22}px; line-height: 0.92; letter-spacing: -5px; text-transform: uppercase; text-shadow: 0 10px 40px rgba(0,0,0,0.8); opacity: 0; will-change: transform, opacity; }}
      {s} .title em {{ font-style: normal; color: {GOLD}; }}
      {s} .line {{ display: block; margin-top: 26px; color: rgba(255,255,255,0.82); font-weight: 700; font-size: 30px; letter-spacing: 6px; text-transform: uppercase; opacity: 0; }}
      {s} .top {{ position: absolute; left: 0; right: 0; top: 0; height: 58%; z-index: 21; background: linear-gradient(to bottom, rgba(5,3,8,0.78) 0%, rgba(5,3,8,0.45) 55%, rgba(5,3,8,0) 100%); opacity: {1 if title else 0}; }}
      {s} .card > div {{ flex: 1 1 auto; min-width: 0; }}
      {s} .hero {{ font-size: {hero_px}px; letter-spacing: -3px; white-space: nowrap; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .lower .chip {{ opacity: 0; }}
      {s} .card {{ opacity: 0; }}
      {s} .scrim {{ background: linear-gradient(to top, rgba(5,3,8,0.86) 0%, rgba(5,3,8,0.40) 28%, rgba(5,3,8,0.0) 50%); }}
      {f"{s} .lower {{ bottom: {lower_bottom}; }} {s} .scrim {{ background: linear-gradient(to top, rgba(5,3,8,0.55) 0%, rgba(5,3,8,0.20) 30%, rgba(5,3,8,0.0) 52%); }}" if lower_bottom else ""}
"""
    title_html = f"""
      <div class="col" id="{cid}-col">
        <span class="chip" id="{cid}-tchip">The Big Game</span>
        <span class="title" id="{cid}-title">The <em>Brave's</em><br />Night</span>
        <span class="line" id="{cid}-line">A Lompoc story</span>
      </div>""" if title else ""
    chip_html = f'<div id="{cid}-chipwrap" style="margin-top: 26px"><span class="chip" id="{cid}-chip">{chip_text}</span></div>' if chip_text else ""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      {_vid(cid, src, 0.0, dur, f'data-playback-rate="{LINE_RATE}"')}
      <div class="top"></div>
      <div class="scrim"></div>
      <div class="vig"></div>{title_html}
      <div class="lower">
        <span class="divider" id="{cid}-div"></span>
        {chip_html}
        <div class="card" id="{cid}-card">
          <img src="public/{badge}" alt="" />
          <div><span class="kicker">{kicker}</span><div class="hero">{hero}</div></div>
        </div>
      </div>
    </div>"""
    beats = ", ".join(f"{k}: {v}" for k, v in B.items())
    title_js = f"""
        tl.fromTo("#{cid}-tchip", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.CHIP);
        tl.fromTo("#{cid}-title", {{ autoAlpha: 0, scale: 1.22 }}, {{ autoAlpha: 1, scale: 1, duration: 0.6, ease: "expo.out" }}, B.TITLE);
        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.LINE);
        tl.to("#{cid}-col", {{ autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.in" }}, B.TITLE_OUT);""" if title else ""
    chip_js = f"""
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, B.CHIP);
        tl.to("#{cid}-chipwrap", {{ autoAlpha: 0, y: -10, duration: 0.3, ease: "power2.in" }}, B.CARD - 0.3);
        tl.set("#{cid}-chipwrap", {{ display: "none" }}, B.CARD - 0.02);""" if chip_text else ""
    script = f"""        // BEATS (relative): {', '.join(B.keys())}. END = scene duration.
        const B = {{ {beats}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {0.7 if title else X}, ease: "power1.inOut" }}, 0);
        {'' if title else f'tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});'}
        tl.fromTo("#{cid}-w0", {{ scale: {1.0 + scale_add}, yPercent: {-lift} }}, {{ scale: {1.07 + scale_add}, yPercent: {-lift}, duration: B.END, ease: "none" }}, 0);{title_js}
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, {'B.CHIP - 0.2' if chip_text else 'B.CARD - 0.15'});{chip_js}
        tl.fromTo("#{cid}-card", {{ autoAlpha: 0, y: 22 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, B.CARD);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v3_clash(A, dur):
    """s4-clash: b5-clash2 (the Brave's own lance + sun shield) with a night grade; flash + shake at the impact."""
    cid = "s4-clash"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} video {{ filter: brightness(0.70) contrast(1.18) saturate(0.88) hue-rotate(-8deg); }}
      {s} .cool {{ position: absolute; inset: 0; z-index: 21; background: rgba(20,40,110,0.16); mix-blend-mode: multiply; pointer-events: none; }}
      {s} .sky {{ position: absolute; left: 0; right: 0; top: 0; height: 45%; z-index: 22; background: linear-gradient(to bottom, rgba(4,6,20,0.55) 0%, rgba(4,6,20,0.25) 60%, rgba(4,6,20,0) 100%); pointer-events: none; }}
      {s} .vig {{ background: radial-gradient(ellipse 100% 85% at 50% 50%, rgba(5,3,8,0) 50%, rgba(5,3,8,0.55) 100%); }}
      {s} .flash {{ position: absolute; inset: 0; z-index: 58; background: #fff; opacity: 0; pointer-events: none; }}
      {s} .shake {{ position: absolute; inset: 0; will-change: transform; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      <div class="shake" id="{cid}-shake" data-layout-allow-overflow>
        {_vid(cid, "b5-clash2.mp4", 0.0, dur)}
      </div>
      <div class="cool"></div>
      <div class="sky"></div>
      <div class="vig"></div>
      <div class="flash" id="{cid}-flash"></div>
    </div>"""
    script = f"""        // BEATS (relative): HIT white flash + shake (shield-hit SFX at the same absolute time in index). END = scene duration.
        const B = {{ HIT: {B['HIT']:.2f}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.08, duration: B.HIT, ease: "power1.in" }}, 0);
        tl.fromTo("#{cid}-w0", {{ scale: 1.08 }}, {{ scale: 1.03, duration: B.END - B.HIT, ease: "none" }}, B.HIT);
        tl.fromTo("#{cid}-flash", {{ autoAlpha: 0 }}, {{ autoAlpha: 0.95, duration: 0.05, ease: "none" }}, B.HIT).to("#{cid}-flash", {{ autoAlpha: 0, duration: 0.22, ease: "power2.out" }}, B.HIT + 0.05);
        tl.fromTo("#{cid}-shake", {{ x: 0, y: 0 }}, {{ x: -14, y: 9, duration: 0.05, ease: "none" }}, B.HIT).to("#{cid}-shake", {{ x: 11, y: -7, duration: 0.06 }}, B.HIT + 0.05).to("#{cid}-shake", {{ x: -6, y: 4, duration: 0.06 }}, B.HIT + 0.11).to("#{cid}-shake", {{ x: 0, y: 0, duration: 0.12 }}, B.HIT + 0.17);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


def v3_scene_html(cid, dur, A):
    if cid == "s1-conq": return v3_lineup(A, dur, cid, "n1-conq-ready.mp4", "badge-conqs.png", "Cabrillo", "Conquistadores", A["HERO"] - 32, title=True)
    if cid == "s2-brave": return v3_lineup(A, dur, cid, "n2-brave-ready.mp4", "badge-braves.png", "Lompoc", "Braves", A["HERO"], lift=40, scale_add=0.75, chip_text="Friday night · Huyck Stadium", lower_bottom="42%")
    if cid == "s3-advance": return v2_advance(A, dur, cid="s3-advance")
    if cid == "s4-clash": return v3_clash(A, dur)
    if cid == "s5-victory": return v2_victory(A, dur, cid="s5-victory")
    if cid == "s6-end": return s7_end(A, dur, cid="s6-end")
    raise ValueError(cid)


def v3_sfx_rows():
    import json
    carve = 'data-fx-carve=\'{"enabled":true,"sources":["voiceover"],"strength":0.35}\''
    def a(id_, src, start, dur, vol, pts, track, cv=True):
        pts_json = json.dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in pts]}]})
        return f'      <audio id="{id_}" class="clip" data-audio-group="sfx" src="public/sfx/{src}" data-start="{start:.2f}" data-media-start="0" data-duration="{dur:.2f}" data-track-index="{track}" data-volume="{vol}" data-automation=\'{pts_json}\' {carve if cv else ""}></audio>'
    ST = {cid: start for cid, start, _ in SCENES}
    s2 = ST["s2-brave"]; s3 = ST["s3-advance"]; s4 = ST["s4-clash"]; s5 = ST["s5-victory"]; s6 = ST["s6-end"]
    hit = s4 + BEATS["s4-clash"]["HIT"]
    raise_ = s5 + BEATS["s5-victory"]["RAISE"]
    rows = [
        a("sfx-drone", "low-drone.wav", 0.00, 6.20, 0.45, [(0, 0), (0.5, 0.45), (5.6, 0.45), (6.2, 0)], 13),
        a("sfx-whoosh1", "whoosh.wav", s2, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur1", "stadium-murmur.wav", s2, 6.05, 0.45, [(0, 0), (0.5, 0.45), (5.6, 0.45), (6.05, 0)], 12),
        a("sfx-whoosh2", "whoosh.wav", s3, 2.00, 0.5, [(0, 0.5), (1.2, 0.5), (2.0, 0)], 15, False),
        a("sfx-murmur2", "stadium-murmur.wav", s3, 4.95, 0.5, [(0, 0), (0.4, 0.5), (4.5, 0.5), (4.95, 0)], 16),
        a("sfx-whoosh3", "whoosh.wav", s4, 2.00, 0.5, [(0, 0.5), (1.2, 0.5), (2.0, 0)], 15, False),
        a("sfx-murmur3", "stadium-murmur.wav", s4, 2.60, 0.4, [(0, 0), (0.3, 0.4), (2.3, 0.4), (2.6, 0)], 12),
        a("sfx-hit", "shield-hit.wav", hit, 3.00, 0.7, [(0, 0.7), (2.5, 0.7), (3.0, 0)], 14, False),
        a("sfx-murmur4", "stadium-murmur.wav", hit + 0.3, 4.00, 0.35, [(0, 0), (0.6, 0.35), (3.5, 0.35), (4.0, 0)], 16),
        a("sfx-roar", "crowd-roar.wav", raise_, 6.00, 0.45, [(0, 0), (0.6, 0.45), (2.4, 0.45), (3.0, 0.25), (5.4, 0.25), (6.0, 0)], 14),
        a("sfx-drone2", "low-drone.wav", s6, 4.65, 0.4, [(0, 0), (0.6, 0.4), (4.0, 0.4), (4.65, 0)], 13),
    ]
    return "\n".join(rows)


def scene_html(cid, dur, A):
    if VERSION == 3:
        return v3_scene_html(cid, dur, A)
    if VERSION == 2:
        return v2_scene_html(cid, dur, A)
    return {"s1-open": s1_open, "s2-night": s2_night, "s3-conq": s3_conq, "s4-brave": s4_brave,
            "s5-clash": s5_clash, "s6-victory": s6_victory, "s7-end": s7_end}[cid](A, dur)


def sfx_rows():
    import json
    carve = 'data-fx-carve=\'{"enabled":true,"sources":["voiceover"],"strength":0.35}\''
    def a(id_, src, start, dur, vol, pts, track, cv=True):
        pts_json = json.dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in pts]}]})
        return f'      <audio id="{id_}" class="clip" data-audio-group="sfx" src="public/sfx/{src}" data-start="{start:.2f}" data-media-start="0" data-duration="{dur:.2f}" data-track-index="{track}" data-volume="{vol}" data-automation=\'{pts_json}\' {carve if cv else ""}></audio>'
    ST = {cid: start for cid, start, _ in SCENES}
    s2 = ST["s2-night"]; s3 = ST["s3-conq"]; s4 = ST["s4-brave"]; s5 = ST["s5-clash"]; s6 = ST["s6-victory"]; s7 = ST["s7-end"]
    hit = s5 + BEATS["s5-clash"]["HIT"]
    raise_ = s6 + BEATS["s6-victory"]["RAISE"]
    rows = [
        a("sfx-drone", "low-drone.wav", 0.00, 5.00, 0.45, [(0, 0), (0.5, 0.45), (4.4, 0.45), (5.0, 0)], 13),
        a("sfx-whoosh1", "whoosh.wav", s2, 2.00, 0.5, [(0, 0.5), (1.2, 0.5), (2.0, 0)], 15, False),
        a("sfx-murmur1", "stadium-murmur.wav", s2, 4.45, 0.45, [(0, 0), (0.5, 0.45), (4.0, 0.45), (4.45, 0)], 12),
        a("sfx-whoosh2", "whoosh.wav", s3, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur2", "stadium-murmur.wav", s3, 3.85, 0.4, [(0, 0), (0.4, 0.4), (3.4, 0.4), (3.85, 0)], 16),
        a("sfx-whoosh3", "whoosh.wav", s4, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur3", "stadium-murmur.wav", s4, 3.55, 0.4, [(0, 0), (0.4, 0.4), (3.1, 0.4), (3.55, 0)], 13),
        a("sfx-whoosh4", "whoosh.wav", s5, 2.00, 0.5, [(0, 0.5), (1.2, 0.5), (2.0, 0)], 15, False),
        a("sfx-hit", "shield-hit.wav", hit, 3.00, 0.7, [(0, 0.7), (2.5, 0.7), (3.0, 0)], 14, False),
        a("sfx-murmur4", "stadium-murmur.wav", hit + 0.3, 4.00, 0.35, [(0, 0), (0.6, 0.35), (3.5, 0.35), (4.0, 0)], 12),
        a("sfx-roar", "crowd-roar.wav", raise_, 6.00, 0.45, [(0, 0), (0.6, 0.45), (2.4, 0.45), (3.0, 0.25), (5.4, 0.25), (6.0, 0)], 14),
        a("sfx-drone2", "low-drone.wav", s7, 4.45, 0.4, [(0, 0), (0.6, 0.4), (3.8, 0.4), (4.45, 0)], 13),
    ]
    return "\n".join(rows)


def index(A, folder, H):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{1 + (i % 2)}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    if VO_SEGS:
        vo = "\n".join(f'      <audio id="vo{k}" class="clip" data-audio-group="voiceover" src="{VO_SRC}" data-start="{at:.2f}" data-media-start="{ms:.2f}" data-duration="{d:.2f}" data-track-index="10" data-volume="0.9" data-fade-in="0.05" data-fade-out="0.10"></audio>' for k, (ms, d, at) in enumerate(VO_SEGS))
    else:
        vo = f'      <audio id="vo" class="clip" data-audio-group="voiceover" src="{VO_SRC}" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.9" data-fade-in="0.05" data-fade-out="0.10"></audio>'
    bed = f'      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{min(TOTAL, 30.0):.2f}" data-track-index="11" data-volume="0.27" data-fade-in="0.8" data-fade-out="1.6" data-fx-carve=\'{{"enabled":true,"sources":["voiceover"],"strength":0.4}}\'></audio>'
    return f"""<!doctype html>
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
    <!-- THE BRAVE'S NIGHT v{VERSION} — Big Game saga, a victory story. Lompoc 38, Cabrillo 2 (Noozhawk, Sep 4 2026). {TOTAL:.2f}s.
         v3: each lineup once (title/card) → advance → clash (b5, the Brave's own lance + sun shield) → victory → end. Burned-in subtitles on track 9. Generated by gen.py — `python3 gen.py 1|2` for earlier versions. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

{vo}
{v3_sfx_rows() if VERSION == 3 else (v2_sfx_rows() if VERSION == 2 else sfx_rows())}
{bed}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""


def write(rel, text):
    p = os.path.join(HERE, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(text)



for H, folder, idx in [(1920, "compositions", "index.html"), (1350, "compositions-4x5", "index-4x5.tmpl")]:
    A = A_of(H)
    for cid, start, dur in SCENES:
        write(f"{folder}/{cid}.html", scene_html(cid, dur, A))
    write(f"{folder}/subs.html", subs(A))
    write(idx, index(A, folder, H))

print(f"v{VERSION} wrote", [s[0] for s in SCENES], "+ subs, index.html, index-4x5.tmpl")
