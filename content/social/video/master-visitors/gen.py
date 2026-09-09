#!/usr/bin/env python3
"""
"Every Month" — Lompoc Locals master ad for business owners (visitors + how the town finds you).
One source of truth for 9:16 (index.html), 4:5 (index-4x5.tmpl) and 16:9 (index-16x9.tmpl).
Real product only: phone screenshots of the live site inside a device frame; no counters, no stats
beyond "hundreds" and the price.   python3 gen.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    # id,          start,  dur  — Dylan read at 0.60: hundreds 1.26 · search 5.20 · open a page 5.88 · hours 7.34 · tap 8.18
    #                             · your business 9.44 · looking 11.4 · Lompoc Locals 12.32 · whole town 14.7 · 39.99 15.5 · .com 17.66
    ("s1-open",   0.00,  5.10),
    ("s2-search", 4.85,  1.60),
    ("s3-page",   6.30,  1.15),
    ("s4-hours",  7.35,  0.90),
    ("s5-tap",    8.15,  1.40),
    ("s6-dir",    9.40,  2.95),
    ("s7-town",   12.20, 3.35),
    ("s8-end",    15.40, 7.10),
]
TOTAL = 22.50
VO_START = 0.60
VO_DUR = 19.20
SUBS = [
    [0.60, 4.60, "Every month, hundreds of people in Lompoc open one site to find what's here."],
    [5.15, 6.20, "They search. They open a page."],
    [6.90, 8.70, "They check the hours, and they tap the number."],
    [9.40, 11.60, "Your business belongs where the town is already looking."],
    [12.30, 14.80, "Lompoc Locals. One place for the whole town."],
    [15.45, 16.90, "$39.99 a month."],
    [17.60, 19.60, "lompoclocals.com/grow"],
]
GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; DARK = "#1a1030"; BG = "#140a17"
SHOT_W = 1170  # screenshot pixel width (390 @3x)

# Aspect params
ASPECTS = {
    "9x16": dict(W=1080, H=1920, bar=115, folder="compositions", idx="index.html",
                 ph=dict(sw=520, sh=1127, left=280, top=430), title=dict(top=170, size=86, left=84, right=84, align="left"),
                 chips=dict(top=330, left=84), SUB=42, SUBBOT=150, SUBLEFT=60, SUBRIGHT=60, end=dict(top="19%", price=150, line=44, url=44)),
    "4x5":  dict(W=1080, H=1350, bar=80, folder="compositions-4x5", idx="index-4x5.tmpl",
                 ph=dict(sw=360, sh=780, left=360, top=215), title=dict(top=100, size=54, left=70, right=70, align="left"),
                 chips=dict(top=1035, left=70), SUB=32, SUBBOT=88, SUBLEFT=60, SUBRIGHT=60, end=dict(top="15%", price=120, line=38, url=40)),
    "16x9": dict(W=1920, H=1080, bar=0, folder="compositions-16x9", idx="index-16x9.tmpl",
                 ph=dict(sw=380, sh=823, left=220, top=128), title=dict(top=300, size=74, left=760, right=120, align="left"),
                 chips=dict(top=640, left=760), SUB=34, SUBBOT=60, SUBLEFT=740, SUBRIGHT=120, end=dict(top="22%", price=130, line=40, url=42)),
}

def base_css(cid, A):
    s = f'[data-composition-id="{cid}"]'
    bar = A["bar"]
    return f"""
      {s} .field {{ position: absolute; inset: 0; background: radial-gradient(ellipse 120% 80% at 50% 0%, #7a1690 0%, {PURPLE} 35%, {DARK} 78%, {BG} 100%); }}
      {s} .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; display: {'block' if bar else 'none'}; }}
      {s} .cine-top {{ top: 0; }} {s} .cine-bot {{ bottom: 0; }}
      {s} .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      {s} .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 66%, rgba(10,6,12,0.32) 100%); }}
      {s} .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.07; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      {s} .title {{ position: absolute; left: {A['title']['left']}px; right: {A['title']['right']}px; top: {A['title']['top']}px; z-index: 36; text-align: {A['title']['align']}; }}
      {s} .t {{ display: block; color: #fff; font-weight: 800; font-size: {A['title']['size']}px; line-height: 1.02; letter-spacing: -1.5px; text-transform: uppercase; text-shadow: 0 6px 30px rgba(10,6,12,0.55); opacity: 0; will-change: transform, opacity; }}
      {s} .t em {{ font-style: normal; color: {GOLD}; }}
      {s} .chips {{ position: absolute; left: {A['chips']['left']}px; top: {A['chips']['top']}px; z-index: 36; display: flex; gap: 14px; }}
      {s} .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: {28 if A['H']==1920 else 24}px; letter-spacing: 3px; padding: 12px 24px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      {s} .phone {{ position: absolute; left: {A['ph']['left']}px; top: {A['ph']['top']}px; width: {A['ph']['sw']+36}px; height: {A['ph']['sh']+36}px; border-radius: {int(A['ph']['sw']*0.13)}px; background: #0b0710; box-shadow: 0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #2a1f30; z-index: 20; will-change: transform, opacity; }}
      {s} .screen {{ position: absolute; left: 18px; top: 18px; width: {A['ph']['sw']}px; height: {A['ph']['sh']}px; border-radius: {int(A['ph']['sw']*0.10)}px; overflow: hidden; background: #fff; }}
      {s} .shot {{ position: absolute; left: 0; top: 0; width: {A['ph']['sw']}px; height: auto; will-change: transform; }}
      {s} .notch {{ position: absolute; left: 50%; top: 18px; width: {int(A['ph']['sw']*0.32)}px; height: {int(A['ph']['sw']*0.055)}px; margin-left: -{int(A['ph']['sw']*0.16)}px; background: #0b0710; border-radius: 0 0 16px 16px; z-index: 2; }}
    """

def shell(cid, A, dur, css, body, script, bg=None):
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{A['W']}" data-height="{A['H']}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {bg or BG}">
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

def phone_html(cid, A, shot, extra=""):
    return f'''      <div class="field"></div>
      <div class="phone" id="{cid}-phone" data-layout-allow-overflow>
        <div class="screen" id="{cid}-screen"><img class="shot" id="{cid}-shot" src="public/shots/{shot}" alt="" />{extra}</div>
        <div class="notch"></div>
      </div>'''

def scale(A):  # screenshot px → screen px
    return A["ph"]["sw"] / SHOT_W

# ─── scenes ──────────────────────────────────────────────────────────────────
def s1_open(A, dur):
    cid = "s1-open"; k = scale(A)
    css = base_css(cid, A)
    body = phone_html(cid, A, "home.png") + f'''
      <div class="title"><span class="t" id="{cid}-t1">Hundreds of locals<em>.</em></span><span class="t" id="{cid}-t2">Every month<em>.</em></span></div>'''
    # home.png is 1170x2532 → screen shows top; scroll ~25% of its scaled height
    scroll = int(2532 * k * 0.25)
    script = f'''        tl.fromTo("#{cid}-phone", {{ y: 40, scale: 0.98 }}, {{ y: 0, scale: 1, duration: 0.9, ease: "power2.out" }}, 0);
        tl.fromTo("#{cid}-shot", {{ y: 0 }}, {{ y: -{scroll}, duration: {dur:.2f}, ease: "none" }}, 0);
        tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out" }}, 0.90);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out" }}, 1.80);'''
    return shell(cid, A, dur, css, body, script)

def s2_search(A, dur):
    cid = "s2-search"; sw = A["ph"]["sw"]; f = sw / 520  # font scale vs 9:16 phone
    s = f'[data-composition-id="{cid}"]'
    css = base_css(cid, A) + f"""
      {s} .ui {{ position: absolute; inset: 0; background: #faf8fb;}}
      {s} .topbar {{ height: {int(60*f)}px; display: flex; align-items: center; padding: 0 {int(18*f)}px; }}
      {s} .topbar img {{ height: {int(30*f)}px; width: auto; filter: invert(0.25) sepia(1) saturate(6) hue-rotate(255deg); }}
      {s} .box {{ margin: {int(10*f)}px {int(16*f)}px 0; height: {int(56*f)}px; border-radius: {int(16*f)}px; background: #fff; border: 2px solid {PURPLE}; display: flex; align-items: center; padding: 0 {int(16*f)}px; box-shadow: 0 8px 24px rgba(101,12,117,0.12); }}
      {s} .box .q {{ font-size: {int(24*f)}px; font-weight: 600; color: #1a1030; white-space: pre; }}
      {s} .box .cur {{ display: inline-block; width: 3px; height: {int(28*f)}px; background: {PURPLE}; margin-left: 2px; vertical-align: middle; }}
      {s} .res {{ margin: {int(12*f)}px {int(16*f)}px 0; background: #fff; border-radius: {int(16*f)}px; border: 1px solid #e9e4ec; overflow: hidden; }}
      {s} .row {{ display: flex; align-items: center; gap: {int(18*f)}px; padding: {int(28*f)}px {int(18*f)}px; border-bottom: 1px solid #f0ecf2; opacity: 0; will-change: transform, opacity; }}
      {s} .row .av {{ width: {int(78*f)}px; height: {int(78*f)}px; border-radius: {int(18*f)}px; background: #1a1030; flex: none; }}
      {s} .row .nm {{ font-size: {int(31*f)}px; font-weight: 700; color: #1a1030; }}
      {s} .row .mt {{ font-size: {int(19*f)}px; color: #6b6474; margin-top: {int(6*f)}px; }}
      {s} .row .mb {{ display: inline-block; background: rgba(101,12,117,0.10); color: {PURPLE}; font-weight: 800; font-size: {int(15*f)}px; padding: {int(3*f)}px {int(10*f)}px; border-radius: 999px; margin-right: 6px; }}
      {s} .hint {{ margin: {int(10*f)}px {int(18*f)}px 0; font-size: {int(12*f)}px; color: #8a8391; }}
    """
    ui = f'''<div class="ui">
          <div class="topbar"><img src="public/mark-white.png" alt="" /></div>
          <div class="box"><span class="q" id="{cid}-q"></span><span class="cur" id="{cid}-cur"></span></div>
          <div class="res">
            <div class="row" id="{cid}-r0"><div class="av"></div><div><div class="nm">Eye on I</div><div class="mt"><span class="mb">Member</span>Food &amp; Drink</div></div></div>
            <div class="row" id="{cid}-r1"><div class="av" style="background:#0b992f"></div><div><div class="nm">Hangar 7 Social House</div><div class="mt"><span class="mb">Member</span>Food &amp; Drink</div></div></div>
            <div class="row" id="{cid}-r2"><div class="av" style="background:#b8321f"></div><div><div class="nm">Pizza Garden</div><div class="mt">Food &amp; Drink</div></div></div>
          </div>
          <div class="hint">17 results for “pizza”</div>
        </div>'''
    body = phone_html(cid, A, "search.png", ui) + f'''
      <div class="chips"><span class="chip" id="{cid}-c0">They search</span></div>'''
    letters = "pizza"
    typing = "".join(f'\n        tl.set("#{cid}-q", {{ textContent: {letters[:i+1]!r} }}, {0.10 + i*0.08:.2f});' for i in range(len(letters)))
    script = f'''        tl.set("#{cid}-shot", {{ autoAlpha: 0 }}, 0);
        tl.fromTo("#{cid}-cur", {{ autoAlpha: 1 }}, {{ autoAlpha: 0, duration: 0.25, repeat: 5, yoyo: true, ease: "none" }}, 0.02);{typing}
        tl.fromTo("#{cid}-r0", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.28 }}, 0.55);
        tl.fromTo("#{cid}-r1", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.28 }}, 0.72);
        tl.fromTo("#{cid}-r2", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.28 }}, 0.88);
        tl.fromTo("#{cid}-c0", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, 0.30);'''
    return shell(cid, A, dur, css, body, script)

def s_member(cid, A, dur, chip, y_from, y_to, ease="power2.inOut", tap=None, chip_at=0.25):
    """member-tall.png (1170x7800) inside the phone, translated from y_from to y_to (screenshot px)."""
    k = scale(A)
    s = f'[data-composition-id="{cid}"]'
    css = base_css(cid, A) + f"""
      {s} .ring {{ position: absolute; border-radius: 999px; border: 3px solid {GOLD}; box-shadow: 0 0 24px rgba(239,198,24,0.8); opacity: 0; z-index: 3; }}
      {s} .hl {{ position: absolute; border-radius: {int(14*k*3)}px; background: rgba(239,198,24,0.28); box-shadow: inset 0 0 0 3px {GOLD}; opacity: 0; z-index: 2; }}
    """
    extra = ""
    if tap:
        # tap: (x, y, w, h) in screenshot px, anchored to the row's top-left at the *final* scroll position
        x, y, w, h = tap
        sx, sy, swd, sh = int(x*k), int((y - y_to)*k), int(w*k), int(h*k)
        extra = f'<div class="hl" id="{cid}-hl" style="left:{sx}px;top:{sy}px;width:{swd}px;height:{sh}px"></div><div class="ring" id="{cid}-ring" style="left:{sx+swd//2-30}px;top:{sy+sh//2-30}px;width:60px;height:60px"></div>'
    body = phone_html(cid, A, "member-tall.png", extra) + f'''
      <div class="chips"><span class="chip" id="{cid}-c0">{chip}</span></div>'''
    script = f'''        tl.fromTo("#{cid}-shot", {{ y: -{int(y_from*k)} }}, {{ y: -{int(y_to*k)}, duration: {min(dur*0.8, 0.8):.2f}, ease: "{ease}" }}, 0);
        tl.fromTo("#{cid}-c0", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, {chip_at});'''
    if tap:
        script += f'''
        tl.fromTo("#{cid}-ring", {{ autoAlpha: 0.9, scale: 0.4 }}, {{ autoAlpha: 0, scale: 2.4, duration: 0.6, ease: "power2.out" }}, 0.55);
        tl.fromTo("#{cid}-hl", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.18 }}, 0.55);'''
    return shell(cid, A, dur, css, body, script)

def s6_dir(A, dur):
    cid = "s6-dir"; k = scale(A); s = f'[data-composition-id="{cid}"]'
    # directory-tall.png: real member cards sit at y≈4150–5200; above 3400 and below 5200 the capture is
    # unloaded blank/skeleton. Hold a window over chips+cards (y 2950→3150) with a slow push, and mask
    # the bottom of the screen so the first skeleton card (≥5200) never shows.
    css = base_css(cid, A) + f"""
      {s} .fade {{ position: absolute; left: 0; right: 0; bottom: 0; height: 24%; z-index: 3; background: linear-gradient(to bottom, rgba(250,248,251,0) 0%, rgba(250,248,251,0.96) 55%, #faf8fb 100%); pointer-events: none; }}
    """
    body = phone_html(cid, A, "directory-tall.png", '<div class="fade"></div>') + f'''
      <div class="title"><span class="t" id="{cid}-t1">Where the town</span><span class="t" id="{cid}-t2">is already looking<em>.</em></span></div>'''
    script = f'''        tl.fromTo("#{cid}-shot", {{ y: -{int(2950*k)}, scale: 1.0, transformOrigin: "50% 60%" }}, {{ y: -{int(3150*k)}, scale: 1.04, duration: {dur:.2f}, ease: "power1.inOut" }}, 0);
        tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out" }}, 0.35);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out" }}, 0.75);'''
    return shell(cid, A, dur, css, body, script)

def s7_town(A, dur):
    cid = "s7-town"; s = f'[data-composition-id="{cid}"]'
    css = base_css(cid, A) + f"""
      {s} video {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.06) saturate(1.05); }}
      {s} .dim {{ position: absolute; inset: 0; background: rgba(20,10,23,0.28); z-index: 2; }}
      {s} .mark {{ position: absolute; left: 50%; top: {'40%' if A['H']>=1920 else ('33%' if A['H']>=1350 else '28%')}; width: {int(A['W']*0.16) if A['H']>1080 else 200}px; height: auto; transform: translate(-50%, -50%); z-index: 5; opacity: 0; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.6)); }}
      {s} .line {{ position: absolute; left: 60px; right: 60px; top: {'54%' if A['H']>=1920 else ('61%' if A['H']>=1350 else '62%')}; z-index: 5; text-align: center; color: #fff; font-weight: 800; font-size: {A['title']['size']-10}px; line-height: 1.05; letter-spacing: -1px; text-transform: uppercase; text-shadow: 0 6px 30px rgba(10,6,12,0.7); opacity: 0; }}
      {s} .line em {{ font-style: normal; color: {GOLD}; }}
      {s} .credit {{ position: absolute; left: 24px; top: {A['bar']+22}px; color: rgba(255,255,255,0.7); font-size: 18px; font-weight: 500; z-index: 5; letter-spacing: 0.5px; }}
    """
    body = f'''      <video id="{cid}-vid" class="clip" src="public/fly-out.mp4" data-start="0" data-media-start="0.6" data-duration="{dur:.2f}" muted playsinline></video>
      <div class="dim"></div>
      <img class="mark" id="{cid}-mark" src="public/mark-white.png" alt="" />
      <div class="line" id="{cid}-line">One place for the whole town<em>.</em></div>
      <div class="credit">Map © Mapbox © OpenStreetMap © Maxar</div>'''
    script = f'''        tl.fromTo("#{cid}-mark", {{ autoAlpha: 0, scale: 0.8 }}, {{ autoAlpha: 1, scale: 1, duration: 0.7, ease: "expo.out" }}, 0.20);
        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 20 }}, {{ autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out" }}, 1.00);'''
    return shell(cid, A, dur, css, body, script)

def s8_end(A, dur):
    cid = "s8-end"; s = f'[data-composition-id="{cid}"]'; E = A["end"]
    css = base_css(cid, A) + f"""
      {s} .col {{ position: absolute; left: 0; right: 0; top: {E['top']}; z-index: 20; text-align: center; }}
      {s} .gpill {{ display: inline-block; background: #0b992f; color: #fff; font-weight: 800; font-size: {E['line']-10}px; letter-spacing: 5px; padding: 12px 28px; border-radius: 999px; text-transform: uppercase; opacity: 0; }}
      {s} .price {{ display: block; margin-top: 26px; color: #fff; font-weight: 800; font-size: {E['price']}px; line-height: 1; letter-spacing: -3px; opacity: 0; }}
      {s} .price small {{ font-size: {int(E['price']*0.32)}px; letter-spacing: 0; color: rgba(255,255,255,0.75); font-weight: 600; }}
      {s} .tag {{ display: block; margin-top: 26px; color: {GOLD}; font-weight: 800; font-size: {E['line']}px; letter-spacing: 3px; text-transform: uppercase; opacity: 0; }}
      {s} .url {{ display: inline-block; margin-top: 44px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: {E['url']}px; padding: 20px 40px; border-radius: 999px; opacity: 0; box-shadow: 0 14px 34px rgba(239,198,24,0.35); }}
      {s} .mark {{ display: block; width: 110px; height: auto; margin: 56px auto 0; opacity: 0; }}
      {s} .bloom {{ position: absolute; left: 50%; top: 20%; width: 1000px; height: 1000px; margin-left: -500px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.16), rgba(239,198,24,0) 62%); }}
    """
    body = f'''      <div class="field"></div><div class="bloom" data-layout-allow-overflow></div>
      <div class="col">
        <span class="gpill" id="{cid}-p">Growth</span>
        <span class="price" id="{cid}-price">$39.99<small> / month</small></span>
        <span class="tag" id="{cid}-tag">Listed. Featured. Found.</span>
        <span class="url" id="{cid}-url">lompoclocals.com/grow</span>
        <img class="mark" id="{cid}-mark" src="public/mark-white.png" alt="" />
      </div>'''
    script = f'''        tl.fromTo("#{cid}-p", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, 0.05);
        tl.fromTo("#{cid}-price", {{ autoAlpha: 0, scale: 0.9 }}, {{ autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }}, 0.10);
        tl.fromTo("#{cid}-tag", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 1.20);
        tl.fromTo("#{cid}-url", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 2.20);
        tl.fromTo("#{cid}-mark", {{ autoAlpha: 0 }}, {{ autoAlpha: 0.95, duration: 0.5 }}, 2.60);
        tl.to("#{cid}-url", {{ scale: 1.03, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 5 }}, 3.0);'''
    return shell(cid, A, dur, css, body, script)

def subs(A):
    cid = "subs"; s = f'[data-composition-id="{cid}"]'
    css = f"""
      {s} .wrapz {{ position: absolute; left: {A['SUBLEFT']}px; right: {A['SUBRIGHT']}px; bottom: {A['bar']+A['SUBBOT']}px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      {s} .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      {s} .sub span {{ display: inline-block; max-width: 900px; background: rgba(0,0,0,0.55); color: #fff; font-weight: 600; font-size: {A['SUB']}px; line-height: 1.25; padding: 14px 28px; border-radius: 20px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
    """
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{A['W']}" data-height="{A['H']}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>{css}
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

# member-tall.png landmarks (screenshot px, 1170x7800): contact row (phone pill) ≈ y 2660–2750 at x 130–535; HOURS block ≈ y 6830–7250
def scene_html(cid, dur, A):
    if cid == "s1-open": return s1_open(A, dur)
    if cid == "s2-search": return s2_search(A, dur)
    if cid == "s3-page": return s_member(cid, A, dur, "They open a page", 300, 900, chip_at=0.20)
    if cid == "s4-hours": return s_member(cid, A, dur, "They check the hours", 900, 6420, chip_at=0.15)
    if cid == "s5-tap": return s_member(cid, A, dur, "They tap the number", 6420, 2200, tap=(120, 2655, 430, 100), chip_at=0.20)
    if cid == "s6-dir": return s6_dir(A, dur)
    if cid == "s7-town": return s7_town(A, dur)
    if cid == "s8-end": return s8_end(A, dur)
    raise ValueError(cid)

def index_html(A):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{A["folder"]}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{A["folder"]}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={A['W']}, height={A['H']}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      @font-face {{ font-family: "Plus Jakarta Sans"; src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-style: normal; }}
      html, body {{ margin: 0; width: {A['W']}px; height: {A['H']}px; overflow: hidden; background: {BG}; }}
      body {{ font-family: "Plus Jakarta Sans", sans-serif; }}
      #root {{ position: relative; width: {A['W']}px; height: {A['H']}px; overflow: hidden; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <!-- EVERY MONTH — Lompoc Locals master ad (business owners). {TOTAL:.2f}s. Real site screenshots in a phone frame; no stats beyond "hundreds" and the price. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="{A['W']}" data-height="{A['H']}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo-dylan.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.92" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.24" data-fade-in="0.6" data-fade-out="1.5" data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''

def write(path, s):
    with open(os.path.join(HERE, path), "w") as f: f.write(s)

for key, A in ASPECTS.items():
    os.makedirs(os.path.join(HERE, A["folder"]), exist_ok=True)
    for cid, start, dur in SCENES:
        write(f"{A['folder']}/{cid}.html", scene_html(cid, dur, A))
    write(f"{A['folder']}/subs.html", subs(A))
    write(A["idx"], index_html(A))
print("wrote", [s[0] for s in SCENES], "+ subs for", list(ASPECTS))
