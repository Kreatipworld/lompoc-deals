#!/usr/bin/env python3
"""
TWO LEGENDS, ONE FIELD — THE RESULT (chapter 3 of the Big Game saga).
Single source of truth: `python3 gen.py` rewrites index.html, index-4x5.tmpl,
compositions/ and compositions-4x5/. Retime by editing SCENES / BEATS / SUBS below.

Facts (Noozhawk, Sep 4 2026 "Week 2 Local Prep Football Scores"): Lompoc 38, Cabrillo 2.
Tone: professional, well separated chapters, respect both schools, the win clearly marked.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ─── timeline (seconds) — placeholder; retime to the Arthur read (VO at 0.60) ─────
X = 0.25  # crossfade / divider wipe
SCENES = [
    # id,           start,  dur   — timed to Arthur's read (six VO segments, see VO_SEGS)
    ("c0-open",     0.00,   5.25),
    ("c1-cabrillo", 5.00,   5.25),
    ("c2-lompoc",   10.00,  5.25),
    ("c3-score",    15.00,  6.75),
    ("c4-close",    21.50,  7.00),
]
TOTAL = 28.50
VO_START = 0.60
# (media_start, duration, placed_at) slices of public/vo-arthur.wav (21.17 s read)
VO_SEGS = [
    (0.00, 4.50, 0.60),   # Friday night. Huyck Stadium. Two schools. One town.
    (5.00, 1.90, 6.20),   # The Conquistadores came ready.
    (7.00, 1.40, 11.20),  # The Braves came home.
    (9.15, 5.40, 15.40),  # Final score: Lompoc 38, Cabrillo 2. The Big Game goes to the Braves.
    (14.75, 3.70, 21.60), # Two programs. One Lompoc. Respect to both sides.
    (18.95, 2.22, 25.40), # Full story on Lompoc Locals.
]

# In-scene beats (relative to scene start). Moved with the read.
BEATS = {
    "c0-open":     dict(TITLE=0.30, FINAL=1.00, LINE=1.40),
    "c1-cabrillo": dict(DIV=0.10, CARD=1.20, CUT=2.20),
    "c2-lompoc":   dict(DIV=0.10, CARD=1.20, CUT=2.20),
    "c3-score":    dict(BOARD=0.30, COUNT=0.90, RESULT=3.90),
    "c4-close":    dict(BADGES=0.05, LINE1=0.30, LINE2=2.10, SRC=3.90),
}

# Burned-in subtitles: [start, end, text] in absolute seconds, from the ASR word times.
SUBS = [
    [0.60,  2.90, "Friday night. Huyck Stadium."],
    [3.20,  5.10, "Two schools. One town."],
    [6.20,  8.20, "The Conquistadores came ready."],
    [11.20, 12.80, "The Braves came home."],
    [15.40, 18.60, "Final score: Lompoc 38, Cabrillo 2."],
    [18.90, 20.80, "The Big Game goes to the Braves."],
    [21.60, 23.40, "Two programs. One Lompoc."],
    [23.60, 25.40, "Respect to both sides."],
    [25.40, 27.60, "Full story on Lompoc Locals."],
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"; DARK = "#1a1030"; BG = "#050308"
CONQ_BLUE = "#9fb6ff"

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


# ─── c0 open ──────────────────────────────────────────────────────────────────────
def c0_open(A, dur):
    cid = "c0-open"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} img.key {{ filter: brightness(0.5) contrast(1.1) saturate(0.85); }}
      {s} .col {{ position: absolute; left: 70px; right: 70px; top: {A['COL_TOP'] + 40}px; z-index: 35; text-align: center; }}
      {s} .chip {{ font-size: 40px; padding: 18px 36px; opacity: 0; }}
      {s} .final {{ display: block; margin-top: 34px; color: #fff; font-weight: 800; font-size: {A['HERO'] + 56}px; line-height: 0.9; letter-spacing: -6px; text-transform: uppercase; text-shadow: 0 10px 40px rgba(0,0,0,0.8); opacity: 0; will-change: transform, opacity; }}
      {s} .line {{ display: block; margin-top: 26px; color: rgba(255,255,255,0.82); font-weight: 700; font-size: 30px; letter-spacing: 5px; text-transform: uppercase; opacity: 0; }}
      {s} .dark {{ position: absolute; inset: 0; z-index: 25; background: rgba(5,3,8,0.35); }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="vidwrap" id="{cid}-wrap" data-layout-allow-overflow><img class="key" src="public/faceoff-key.png" alt="" /></div>
      <div class="dark"></div>
      <div class="vig"></div>
      <div class="col">
        <span class="chip" id="{cid}-title">The Big Game</span>
        <span class="final" id="{cid}-final">Final</span>
        <span class="line" id="{cid}-line">Friday · Huyck Stadium · Lompoc</span>
      </div>
    </div>"""
    script = f"""        // BEATS (relative): TITLE chip, FINAL slam, LINE. END = scene duration.
        const B = {{ TITLE: {B['TITLE']}, FINAL: {B['FINAL']}, LINE: {B['LINE']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.6, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wrap", {{ scale: 1.0 }}, {{ scale: 1.06, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-title", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.TITLE);
        tl.fromTo("#{cid}-final", {{ autoAlpha: 0, scale: 1.25 }}, {{ autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out" }}, B.FINAL);
        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.LINE);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── chapters ─────────────────────────────────────────────────────────────────────
def chapter(cid, land, clip, badge, kicker, hero, A, dur, hero_px=None):
    B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    hp = hero_px or A["HERO"]
    css = f"""
      {s} .card > div {{ flex: 1 1 auto; min-width: 0; }}
      {s} .hero {{ font-size: {hp}px; letter-spacing: -3px; white-space: nowrap; }}
      {s} .lower .divider {{ opacity: 0; }}
      {s} .card {{ opacity: 0; }}
      {s} #{cid}-w1 {{ opacity: 0; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>
      <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid-land" class="clip" src="public/{land}" data-start="0" data-duration="{B['CUT']:.2f}" data-track-index="0" muted playsinline></video></div>
      <div class="vidwrap" id="{cid}-w1" data-layout-allow-overflow><video id="{cid}-vid-char" class="clip" src="public/{clip}" data-start="{B['CUT']:.2f}" data-duration="{dur - B['CUT']:.2f}" data-track-index="1" muted playsinline></video></div>
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
    script = f"""        // BEATS (relative): DIV gold divider draws, CARD chapter card, CUT land → character. END = scene duration.
        const B = {{ DIV: {B['DIV']}, CARD: {B['CARD']}, CUT: {B['CUT']:.2f}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-wipe", {{ autoAlpha: 1, x: 0 }}, {{ x: 1180, duration: {X + 0.05}, ease: "power2.inOut" }}, 0).set("#{cid}-wipe", {{ autoAlpha: 0 }}, {X + 0.06});
        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.06, duration: B.CUT, ease: "none" }}, 0);
        tl.set("#{cid}-w0", {{ autoAlpha: 0 }}, B.CUT);
        tl.set("#{cid}-w1", {{ autoAlpha: 1 }}, B.CUT);
        tl.fromTo("#{cid}-w1", {{ scale: 1.0 }}, {{ scale: 1.05, duration: B.END - B.CUT, ease: "none" }}, B.CUT);
        tl.fromTo("#{cid}-div", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.55, ease: "power3.out" }}, B.DIV);
        tl.fromTo("#{cid}-card", {{ autoAlpha: 0, y: 22 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, B.CARD);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, BG, css, body, script, A)


# ─── c3 scoreboard ────────────────────────────────────────────────────────────────
def c3_score(A, dur):
    cid = "c3-score"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    top = A['COL_TOP']
    css = f"""
      {s} .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 90% 70% at 50% 35%, #7a1690 0%, {PURPLE} 45%, #2a0533 100%); }}
      {s} .lines {{ position: absolute; inset: 0; opacity: 0.08; background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.9) 0 2px, rgba(255,255,255,0) 2px 96px); }}
      {s} .dip {{ position: absolute; inset: 0; z-index: 58; background: #2a0533; pointer-events: none; }}
      {s} .col {{ position: absolute; left: 70px; right: 70px; top: {top}px; z-index: 35; text-align: center; }}
      {s} .kick {{ display: block; color: {GOLD}; font-weight: 800; font-size: {A['KICK']}px; letter-spacing: 8px; text-transform: uppercase; opacity: 0; }}
      {s} .finalpill {{ display: inline-block; margin-top: 18px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 36px; letter-spacing: 5px; padding: 12px 30px; border-radius: 10px; text-transform: uppercase; opacity: 0; }}
      {s} .board {{ margin: 44px auto 0; width: 100%; background: {DARK}; border: 2px solid rgba(239,198,24,0.35); border-radius: 28px; padding: 26px 34px; box-shadow: 0 30px 80px rgba(0,0,0,0.5); opacity: 0; will-change: transform, opacity; }}
      {s} .row {{ display: flex; align-items: center; gap: 26px; padding: 22px 10px; position: relative; }}
      {s} .row + .row {{ border-top: 1px solid rgba(255,255,255,0.10); }}
      {s} .row img {{ display: block; width: {A['BADGE'] - 20}px; height: {A['BADGE'] - 20}px; object-fit: contain; flex: 0 0 auto; }}
      {s} .row .name {{ flex: 1 1 auto; text-align: left; color: #fff; font-weight: 800; font-size: 46px; letter-spacing: 0; text-transform: uppercase; line-height: 1.05; }}
      {s} .row .name small {{ display: block; font-size: 26px; letter-spacing: 4px; font-weight: 700; opacity: 0.75; margin-bottom: 6px; }}
      {s} .row .num {{ flex: 0 0 auto; min-width: 190px; text-align: right; color: #fff; font-weight: 800; font-size: 132px; line-height: 0.9; letter-spacing: -6px; font-variant-numeric: tabular-nums; }}
      {s} .row.win .num {{ color: {GOLD}; }}
      {s} .winrule {{ position: absolute; left: 10px; right: 10px; bottom: 2px; height: 10px; background: {GOLD}; border-radius: 4px; transform-origin: left center; opacity: 0; box-shadow: 0 0 16px rgba(239,198,24,0.6); }}
      {s} .result {{ display: block; margin-top: 40px; color: #fff; font-weight: 800; font-size: {A['KICK'] + 12}px; letter-spacing: 1px; line-height: 1.15; opacity: 0; text-shadow: 0 6px 24px rgba(0,0,0,0.6); }}
      {s} .result em {{ font-style: normal; color: {GOLD}; }}
"""
    body = f"""    <div class="stage" id="{cid}-stage">
      <div class="field"></div><div class="lines"></div>
      <div class="vig"></div>
      <div class="col">
        <span class="kick" id="{cid}-kick">The Big Game · Huyck Stadium</span><br />
        <span class="finalpill" id="{cid}-pill">Final</span>
        <div class="board" id="{cid}-board">
          <div class="row win" id="{cid}-row-l"><img src="public/badge-braves.png" alt="" /><div class="name"><small>Lompoc High</small>Braves</div><div class="num" id="{cid}-n-l">0</div><span class="winrule" id="{cid}-winrule"></span></div>
          <div class="row" id="{cid}-row-c"><img src="public/badge-conqs.png" alt="" /><div class="name"><small>Cabrillo High</small>Conquistadores</div><div class="num" id="{cid}-n-c">0</div></div>
        </div>
        <span class="result" id="{cid}-result">The Big Game goes to the <em>Braves</em>.</span>
      </div>
      <div class="dip" id="{cid}-dip"></div>
    </div>"""
    script = f"""        // BEATS (relative): BOARD card in, COUNT numbers 0→38 / 0→2 over 1.2s, RESULT gold rule + line ("goes to the Braves"). END = scene duration.
        const B = {{ BOARD: {B['BOARD']}, COUNT: {B['COUNT']}, RESULT: {B['RESULT']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);
        tl.fromTo("#{cid}-dip", {{ autoAlpha: 1 }}, {{ autoAlpha: 0, duration: 0.45, ease: "power2.out" }}, 0.05);
        tl.fromTo("#{cid}-kick", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.BOARD);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, scale: 0.8 }}, {{ autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }}, B.BOARD + 0.1);
        tl.fromTo("#{cid}-board", {{ autoAlpha: 0, y: 30, scale: 0.97 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, B.BOARD + 0.2);
        const nl = {{ v: 0 }}, nc = {{ v: 0 }};
        tl.to(nl, {{ v: 38, duration: 1.2, ease: "power2.out", onUpdate: () => {{ document.getElementById("{cid}-n-l").textContent = Math.round(nl.v); }} }}, B.COUNT);
        tl.to(nc, {{ v: 2, duration: 1.2, ease: "power2.out", onUpdate: () => {{ document.getElementById("{cid}-n-c").textContent = Math.round(nc.v); }} }}, B.COUNT);
        tl.fromTo("#{cid}-winrule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.5, ease: "power3.out" }}, B.RESULT);
        tl.fromTo("#{cid}-row-l", {{ scale: 1 }}, {{ scale: 1.02, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }}, B.RESULT);
        tl.fromTo("#{cid}-result", {{ autoAlpha: 0, y: 16 }}, {{ autoAlpha: 1, y: 0, duration: 0.5 }}, B.RESULT + 0.25);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, "#2a0533", css, body, script, A)


# ─── c4 close ─────────────────────────────────────────────────────────────────────
def c4_close(A, dur):
    cid = "c4-close"; B = BEATS[cid]; s = f'[data-composition-id="{cid}"]'
    top = A['COL_TOP'] + 20
    css = f"""
      {s} .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 90% 70% at 50% 40%, #7a1690 0%, {PURPLE} 45%, #2a0533 100%); }}
      {s} .col {{ position: absolute; left: 70px; right: 70px; top: {top}px; z-index: 35; text-align: center; }}
      {s} .badges {{ display: flex; align-items: center; justify-content: center; gap: 60px; }}
      {s} .badges img {{ display: block; width: {A['BADGE'] + 70}px; height: {A['BADGE'] + 70}px; object-fit: contain; filter: drop-shadow(0 12px 30px rgba(0,0,0,0.55)); opacity: 0; will-change: transform, opacity; }}
      {s} .badges .x {{ color: {GOLD}; font-weight: 800; font-size: 44px; letter-spacing: 4px; opacity: 0; }}
      {s} .l1 {{ display: block; margin-top: 54px; color: #fff; font-weight: 800; font-size: {A['HERO'] - 14}px; line-height: 1.0; letter-spacing: -3px; text-transform: uppercase; text-shadow: 0 8px 30px rgba(0,0,0,0.6); opacity: 0; will-change: transform, opacity; }}
      {s} .l1 em {{ font-style: normal; color: {GOLD}; }}
      {s} .respect {{ display: block; margin-top: 18px; color: rgba(255,255,255,0.8); font-weight: 700; font-size: 30px; letter-spacing: 5px; text-transform: uppercase; opacity: 0; }}
      {s} .find {{ display: block; margin-top: 54px; opacity: 0; will-change: transform, opacity; }}
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
        <div class="badges"><img id="{cid}-b1" src="public/badge-braves.png" alt="" /><span class="x" id="{cid}-x">&amp;</span><img id="{cid}-b2" src="public/badge-conqs.png" alt="" /></div>
        <span class="l1" id="{cid}-l1">Two programs.<br />One <em>Lompoc</em>.</span>
        <span class="respect" id="{cid}-respect">Respect to both sides</span>
        <div class="find" id="{cid}-find"><img src="public/mark-white.png" alt="" /><div class="pill"><small>Full story</small>lompoclocals.com/news</div></div>
      </div>
      <div class="src" id="{cid}-src">Score: Noozhawk · Week 2 prep football</div>
    </div>"""
    script = f"""        // BEATS (relative): BADGES both crests, LINE1 "Two programs. One Lompoc.", LINE2 full story pill, SRC source line. END = scene duration.
        const B = {{ BADGES: {B['BADGES']}, LINE1: {B['LINE1']}, LINE2: {B['LINE2']}, SRC: {B['SRC']}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.8 }}, 0);
        tl.fromTo("#{cid}-b1", {{ autoAlpha: 0, x: -40, scale: 0.8 }}, {{ autoAlpha: 1, x: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, B.BADGES);
        tl.fromTo("#{cid}-b2", {{ autoAlpha: 0, x: 40, scale: 0.8 }}, {{ autoAlpha: 1, x: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, B.BADGES);
        tl.fromTo("#{cid}-x", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.3 }}, B.BADGES + 0.3);
        tl.fromTo("#{cid}-l1", {{ autoAlpha: 0, scale: 1.12 }}, {{ autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out" }}, B.LINE1);
        tl.fromTo("#{cid}-respect", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.LINE1 + 0.9);
        tl.fromTo("#{cid}-find", {{ autoAlpha: 0, y: 28, scale: 0.92 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.3)" }}, B.LINE2);
        tl.fromTo("#{cid}-src", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.4 }}, B.SRC);
        tl.set({{}}, {{}}, B.END);"""
    return wrap(cid, dur, "#2a0533", css, body, script, A, nomark=True)


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


def scene_html(cid, dur, A):
    if cid == "c0-open": return c0_open(A, dur)
    if cid == "c1-cabrillo": return chapter(cid, "land-cabrillo.mp4", "clip-conq2-stride.mp4", "badge-conqs.png", "Cabrillo", "Conquistadores", A, dur, hero_px=A["HERO"] - 32)
    if cid == "c2-lompoc": return chapter(cid, "land-lompoc.mp4", "clip-brave-stride.mp4", "badge-braves.png", "Lompoc", "Braves", A, dur)
    if cid == "c3-score": return c3_score(A, dur)
    if cid == "c4-close": return c4_close(A, dur)
    raise ValueError(cid)


def auto(points):
    import json
    return json.dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in points]}]}).replace('"', "&quot;")


def sfx_rows():
    carve = 'data-fx-carve=\'{"enabled":true,"sources":["voiceover"],"strength":0.35}\''
    def a(id_, src, start, dur, vol, pts, track, cv=True):
        pts_json = __import__("json").dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in pts]}]})
        return f'      <audio id="{id_}" class="clip" data-audio-group="sfx" src="public/sfx/{src}" data-start="{start:.2f}" data-media-start="0" data-duration="{dur:.2f}" data-track-index="{track}" data-volume="{vol}" data-automation=\'{pts_json}\' {carve if cv else ""}></audio>'
    ST = {cid: start for cid, start, _ in SCENES}
    c1 = ST["c1-cabrillo"]; c2 = ST["c2-lompoc"]; c3 = ST["c3-score"]; c4 = ST["c4-close"]
    hit = c3 + BEATS["c3-score"]["RESULT"]
    rows = [
        a("sfx-drone", "low-drone.wav", 0.00, 4.00, 0.45, [(0, 0), (0.5, 0.45), (3.4, 0.45), (4.0, 0)], 13),
        a("sfx-whoosh1", "whoosh.wav", c1, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur1", "stadium-murmur.wav", c1, 5.85, 0.5, [(0, 0), (0.5, 0.5), (5.4, 0.5), (5.85, 0)], 12),
        a("sfx-whoosh2", "whoosh.wav", c2, 2.00, 0.55, [(0, 0.55), (1.2, 0.55), (2.0, 0)], 15, False),
        a("sfx-murmur2", "stadium-murmur.wav", c2, 5.85, 0.5, [(0, 0), (0.5, 0.5), (5.4, 0.5), (5.85, 0)], 13),
        a("sfx-whoosh3", "whoosh.wav", c3, 2.00, 0.5, [(0, 0.5), (1.2, 0.5), (2.0, 0)], 15, False),
        a("sfx-hit", "shield-hit.wav", hit, 3.00, 0.6, [(0, 0.6), (2.5, 0.6), (3.0, 0)], 14, False),
        a("sfx-roar", "crowd-roar.wav", hit + 0.15, 6.00, 0.42, [(0, 0), (0.6, 0.42), (2.2, 0.42), (2.8, 0.22), (5.4, 0.22), (6.0, 0)], 12),
        a("sfx-drone2", "low-drone.wav", c4 + 2.0, 4.45, 0.4, [(0, 0), (0.6, 0.4), (3.6, 0.4), (4.45, 0)], 13),
    ]
    return "\n".join(rows)


def index(A, folder, H):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{1 + (i % 2)}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    vo_note = "\n".join(
        f'      <audio id="vo{k}" class="clip" data-audio-group="voiceover" src="public/vo-arthur.wav" data-start="{at:.2f}" data-media-start="{ms:.2f}" data-duration="{d:.2f}" data-track-index="10" data-volume="1" data-fade-in="0.05" data-fade-out="0.10"></audio>'
        for k, (ms, d, at) in enumerate(VO_SEGS))
    bed = f'      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.30" data-fade-in="0.8" data-fade-out="1.5" data-fx-carve=\'{{"enabled":true,"sources":["voiceover"],"strength":0.4}}\'></audio>'
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
    <!-- TWO LEGENDS, ONE FIELD — THE RESULT. Chapter 3 of the Big Game saga. Lompoc 38, Cabrillo 2 (Noozhawk, Sep 4 2026). {TOTAL:.2f}s.
         Open → Cabrillo chapter → Lompoc chapter → scoreboard → close. Burned-in subtitles on track 9. Generated by gen.py — edit there. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

{vo_note}
{sfx_rows()}
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

print("wrote", [s[0] for s in SCENES], "+ subs, index.html, index-4x5.tmpl")
