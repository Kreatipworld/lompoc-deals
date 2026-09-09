#!/usr/bin/env python3
"""
THIS IS LOMPOC v9 — master commercial in the Member Spotlight style (real photos, Ken Burns, gold
chips, progress line) with a wow catch + three numbers up front, the phone beats, and the end card.
Higgsfield only as transitions: fx-lightleak.mp4 / fx-particles.mp4 as screen-blend overlays.
Writes index-v9.tmpl + index-v9-4x5.tmpl and w*/p*/s*/fx* compositions; v6/v7/v8 files untouched.
    python3 gen_v9.py
"""
import os
BED_OWN = os.environ.get("BED", "own") == "own"  # default: our generated bed (library music retired Sep 8 — see feedback_only_owned_media)
BED_SRC = "public/bed-own-v9.wav" if BED_OWN else "public/bgm-bama-country.mp3"
BED_VOL = "0.34" if BED_OWN else "0.5"
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
def load(path, marker):
    src = open(path).read().split(marker)[0]
    ns = {"__file__": path}; exec(compile(src, path, "exec"), ns); return ns
MV = load(os.path.join(HERE, "..", "master-visitors", "gen.py"), "\nfor key, A in ASPECTS.items():")
H7 = load(os.path.join(HERE, "..", "hangar7", "gen.py"), "\nfor H, bar, folder, idx in")
GOLD, INK, PURPLE, DARK, BG, X = MV["GOLD"], MV["INK"], MV["PURPLE"], MV["DARK"], MV["BG"], MV["X"]

TOTAL = 35.90
VO_FILE, VO_START, VO_DUR = "public/vo-v9-dylan.wav", 0.60, 22.32
# v9.1: main read split around the extra members line
VO_SLICES = [("public/vo-v9-open.wav", 0.00, 5.60, 0.60), ("public/vo-v9-dylan.wav", 3.60, 12.45, 6.80), ("public/vo-v9-clark.wav", 0.00, 1.76, 19.55), ("public/vo-v9-extra.wav", 0.00, 3.84, 21.55), ("public/vo-v9-dylan.wav", 16.05, 6.27, 25.95)]
from members_v91 import members as members_seq
SUBS = [
    [0.60, 5.80, "Last month, the Lompoc Locals platform put Lompoc in front of more than 20,000 people. Right here."],
    [7.20, 8.60, "454 local businesses."],
    [9.30, 10.50, "47 events on the calendar."],
    [11.15, 12.20, "One town, in two languages."],
    [13.10, 14.90, "Cupcakes on H Street. Pizza on I."],
    [15.65, 18.90, "Wine in the Ghetto. A barbershop on V. A tint shop on Ocean."],
    [19.60, 21.30, "Clark Builders on Chestnut."],
    [21.60, 25.25, "…and every member on Lompoc Locals, from the florist to the tire shop."],
    [27.10, 29.40, "They search. They open a page. They tap the number."],
    [30.05, 32.20, "Lompoc Locals. One place for the whole town."],
]
MV["SUBS"] = SUBS; MV["TOTAL"] = TOTAL; H7["TOTAL"] = TOTAL

# id, start, dur (absolute; VO at 0.60)
SCENES = [
    ("w1-catch",   0.00,  6.50),
    ("w2-numbers", 6.30,  6.00),
    ("m1-members", 12.10, 14.35),
    ("s2-search", 26.20,  1.40),
    ("s3-page",   27.80,  1.00),
    ("s5-tap",    28.65,  1.10),
    ("w5-end",    29.45,  6.45),
]
# member sequence: (absolute cut time, image, chip, credit, object-position, ken burns)
MEMBERS = [
    (12.10, "cast/sweet-baking-co-2.jpg",                 "Sweet Baking Co. · H Street",        "Sweet Baking Co.",                  "50% 55%", ("scale", 1.0, 1.08)),
    (13.90, "cast/members/lompoc-valley-florist.jpg",     "Lompoc Valley Florist · H Street",   "Lompoc Valley Florist",             "50% 50%", ("scale", 1.0, 1.07)),
    (14.78, "cast/eye-on-i-0.jpg",                        "Eye on I · I Street",                "Eye on I",                          "50% 45%", ("scale", 1.0, 1.07)),
    (15.68, "cast/flying-goat-cellars-2.jpg",             "Flying Goat Cellars · Wine Ghetto",  "Flying Goat Cellars",               "50% 50%", ("drift", -3, 3)),
    (16.35, "cast/members/hangar-7-social-house.jpg",     "Hangar 7 · Ocean Ave",               "Hangar 7 Social House",             "50% 50%", ("scale", 1.0, 1.06)),
    (16.92, "cast/paisanos-0.jpg",                        "Paisano's · V Street",               "Paisano's Family Barbershop",       "50% 45%", ("scale", 1.0, 1.07)),
    (18.16, "cast/coastal-tint-0.jpg",                    "Coastal Tint · Ocean Ave",           "Coastal Tint",                      "50% 55%", ("scale", 1.0, 1.08)),
    (19.55, "cast/members/clark-builders-inc.jpg",        "Clark Builders · Chestnut Ct",       "Clark Builders, Inc.",              "50% 50%", ("scale", 1.0, 1.07)),
    (21.60, "cast/members/eddies-grill.jpg",              "Eddie's Grill · H Street",           "Eddie's Grill",                     "50% 50%", ("scale", 1.0, 1.06)),
    (21.93, "cast/members/the-garden-shoppe.jpg",         "The Garden Shoppe · Ocean Ave",      "The Garden Shoppe",                 "50% 50%", ("scale", 1.0, 1.06)),
    (22.26, "cast/vargas-jewelers-trophies-awards-0.jpg", "Vargas Jewelers · H Street",         "Vargas Jewelers Trophies & Awards", "50% 50%", ("scale", 1.0, 1.06)),
    (22.59, "cast/members/wm-rieck-plumbing-co.jpg",      "Wm Rieck Plumbing · Chestnut",       "Wm Rieck Plumbing Co",              "50% 50%", ("scale", 1.0, 1.06)),
    (22.92, "cast/members/terrones-plumbing.jpg",         "Terrones Plumbing",                  "Terrones Plumbing",                 "50% 50%", ("scale", 1.0, 1.03)),
    (23.25, "cast/members/js-glass-co.jpg",               "J's Glass Co · Ocean Ave",           "J's Glass Co",                      "50% 50%", ("scale", 1.0, 1.06)),
    (23.58, "cast/members/the-waxed-honey.jpg",           "The Waxed Honey · Ocean Ave",        "The Waxed Honey",                   "50% 40%", ("scale", 1.0, 1.06)),
    (23.91, "cast/members/rey-s-liquor-store.jpg",        "Rey's Liquor · H Street",            "Rey's Liquor Store",                "50% 45%", ("scale", 1.0, 1.06)),
    (24.24, "cast/members/west-coast-industries.jpg",     "West Coast Industries · 8th St",     "West Coast Industries",             "50% 60%", ("scale", 1.0, 1.06)),
    (24.57, "cast/members/bowl-and-soul.jpg",             "Bowl & Soul",                        "Bowl & Soul",                       "50% 45%", ("scale", 1.0, 1.06)),
    (24.90, "cast/members/valley-embroidery.jpg",         "Valley Embroidery · 8th St",         "Valley Embroidery",                 "50% 50%", ("scale", 1.0, 1.06)),
    (25.23, "cast/members/in-out-tires-lpc.jpg",          "In&Out Tires · H Street",            "In&Out Tires Lpc",                  "50% 50%", ("scale", 1.0, 1.04)),
]
# fx overlays: id, start, dur, clip, media_start, peak opacity
FX = [
    ("fx-a", 3.92, 2.40, "fx-lightleak.mp4", 0.60, 1.0),
    ("fx-b", 12.00, 0.80, "fx-particles.mp4", 0.00, 0.9),
    ("fx-c", 26.10, 0.70, "fx-lightleak.mp4", 2.00, 0.8),
    ("fx-d", 29.45, 1.20, "fx-lightleak.mp4", 1.00, 0.5),
]
PHOTOS = {  # cid: (file, chip, credit, ken burns, object-position, chip_at)
    "p1-sweet":    ("cast/sweet-baking-co-2.jpg", "Sweet Baking Co. · H Street", "Sweet Baking Co.", ("scale", 1.0, 1.08, "50% 55%"), 1.04),
    "p2-eye":      ("cast/eye-on-i-0.jpg", "Eye on I · I Street", "Eye on I", ("scale", 1.0, 1.07, "50% 45%"), 0.23),
    "p3-goat":     ("cast/flying-goat-cellars-2.jpg", "Flying Goat Cellars · Wine Ghetto", "Flying Goat Cellars", ("drift", -3, 3, "50% 50%"), 0.25),
    "p4-paisanos": ("cast/paisanos-0.jpg", "Paisano's · V Street", "Paisano's Family Barbershop", ("scale", 1.0, 1.07, "50% 45%"), 0.25),
    "p5-coastal":  ("cast/coastal-tint-0.jpg", "Coastal Tint · Ocean Ave", "Coastal Tint", ("scale", 1.0, 1.08, "50% 55%"), 0.25),
}

def write(p, s):
    os.makedirs(os.path.dirname(os.path.join(HERE, p)), exist_ok=True)
    open(os.path.join(HERE, p), "w").write(s)

def photo(cid, dur, A):
    img, chip, credit, kb, chip_at = PHOTOS[cid]
    s = H7["photo_scene"](cid, dur, A["H"], A["bar"], img, "cover", kb, [chip], chip_times=[chip_at])
    top = 300 if A["H"] == 1920 else 200
    s = s.replace('<div class="vig"></div>\n    </div>', f'<div class="pcredit" id="{cid}-cr">photo: {credit}</div>\n      <div class="vig"></div>\n    </div>', 1)
    s = s.replace("    </style>", f'      [data-composition-id="{cid}"] .pcredit {{ position: absolute; left: 84px; top: {top}px; z-index: 36; color: #fff; font-size: 22px; font-weight: 600; letter-spacing: 1px; background: rgba(10,6,12,0.62); padding: 6px 14px; border-radius: 8px; opacity: 0; }}\n    </style>', 1)
    s = s.replace('tl.set({}, {}, B.END);', f'tl.fromTo("#{cid}-cr", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.3 }}, 0.35);\n        tl.set({{}}, {{}}, B.END);', 1)
    return s

def w1(A, dur):  # 0.00–6.50: quiet lines 0.90 / 1.90 · slam on "twenty" 4.08 · PEOPLE 4.80 · platform line 5.15
    cid = "w1-catch"; s = f'[data-composition-id="{cid}"]'; big = A["H"] == 1920
    css = MV["base_css"](cid, A) + f"""
      {s} .black {{ position: absolute; inset: 0; background: radial-gradient(ellipse 90% 60% at 50% 45%, #1e0f24 0%, #07040a 75%); }}
      {s} .bloom {{ position: absolute; left: 50%; top: 42%; width: 1100px; height: 1100px; margin: -550px 0 0 -550px; border-radius: 50%; background: radial-gradient(circle, rgba(122,22,144,0.55), rgba(101,12,117,0.18) 45%, rgba(7,4,10,0) 70%); opacity: 0; will-change: transform, opacity; }}
      {s} .quiet {{ position: absolute; left: 60px; right: 60px; top: {'40%' if big else '36%'}; z-index: 36; text-align: center; }}
      {s} .q {{ display: block; color: {GOLD}; font-weight: 800; font-size: {44 if big else 34}px; letter-spacing: 8px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; margin-bottom: {26 if big else 18}px; }}
      {s} .col {{ position: absolute; left: 60px; right: 60px; top: {'30%' if big else '24%'}; z-index: 36; text-align: center; }}
      {s} .num {{ display: block; color: {GOLD}; font-weight: 800; font-size: {236 if big else 168}px; line-height: 0.9; letter-spacing: -9px; text-shadow: 0 16px 60px rgba(239,198,24,0.35); opacity: 0; will-change: transform, opacity; }}
      {s} .l1 {{ display: block; margin-top: {64 if big else 44}px; color: #fff; font-weight: 800; font-size: {70 if big else 50}px; line-height: 1.0; letter-spacing: -1px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      {s} .l2 {{ display: block; margin-top: {22 if big else 14}px; color: rgba(255,255,255,0.78); font-weight: 700; font-size: {28 if big else 22}px; letter-spacing: 5px; text-transform: uppercase; opacity: 0; }}
      {s} .flash {{ position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 58; pointer-events: none; }}
    """
    body = f'''      <div class="black"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="quiet"><span class="q" id="{cid}-q1">Last month</span><span class="q" id="{cid}-q2">The Lompoc Locals platform</span></div>
      <div class="col"><span class="num" id="{cid}-num">20,000+</span><span class="l1" id="{cid}-l1">People looked at Lompoc</span><span class="l2" id="{cid}-l2">On the Lompoc Locals platform · Last month</span></div>
      <div class="flash" id="{cid}-flash"></div>'''
    script = f'''        tl.fromTo("#{cid}-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1.15, duration: 3.9, ease: "sine.inOut" }}, 0.2);
        tl.fromTo("#{cid}-q1", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.5 }}, 0.90);
        tl.fromTo("#{cid}-q2", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.5 }}, 1.90);
        tl.to("#{cid}-q1, #{cid}-q2", {{ autoAlpha: 0, duration: 0.25, ease: "power2.in" }}, 3.70);
        tl.to("#{cid}-bloom", {{ autoAlpha: 0.35, duration: 0.4 }}, 3.90);
        tl.fromTo("#{cid}-flash", {{ autoAlpha: 0.85 }}, {{ autoAlpha: 0, duration: 0.35, ease: "power2.out", immediateRender: false }}, 4.08);
        tl.fromTo("#{cid}-num", {{ autoAlpha: 0, scale: 1.6 }}, {{ autoAlpha: 1, scale: 1.0, duration: 0.42, ease: "power4.out" }}, 4.08);
        tl.to("#{cid}-num", {{ scale: 1.015, duration: 2.3, ease: "none" }}, 4.50);
        tl.fromTo("#{cid}-l1", {{ autoAlpha: 0, y: 24 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, 4.80);
        tl.fromTo("#{cid}-l2", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 5.15);'''
    return MV["shell"](cid, A, dur, css, body, script, bg="#07040a")

def w2(A, dur):  # 3.70–9.70: 454 at 4.62 · 47 at 6.70 · 2 languages at 9.30
    cid = "w2-numbers"; s = f'[data-composition-id="{cid}"]'; big = A["H"] == 1920
    css = MV["base_css"](cid, A) + f"""
      {s} .rows {{ position: absolute; left: 84px; right: 84px; top: {'22%' if big else '17%'}; z-index: 36; }}
      {s} .row {{ display: flex; align-items: baseline; gap: {26 if big else 18}px; margin-bottom: {54 if big else 34}px; opacity: 0; will-change: transform, opacity; }}
      {s} .n {{ color: {GOLD}; font-weight: 800; font-size: {150 if big else 104}px; line-height: 0.9; letter-spacing: -6px; font-variant-numeric: tabular-nums; min-width: {300 if big else 210}px; }}
      {s} .lab {{ color: #fff; font-weight: 800; font-size: {44 if big else 32}px; line-height: 1.05; letter-spacing: 1px; text-transform: uppercase; }}
      {s} .rule {{ display: block; height: 6px; width: 0; background: {GOLD}; border-radius: 3px; margin-top: {14 if big else 10}px; }}
      {s} .lchips {{ display: inline-flex; gap: 10px; margin-top: 12px; }}
      {s} .lc {{ display: inline-block; background: #0b992f; color: #fff; font-weight: 800; font-size: {26 if big else 20}px; letter-spacing: 3px; padding: 8px 18px; border-radius: 10px; }}
    """
    body = f'''      <div class="field"></div>
      <div class="rows">
        <div class="row" id="{cid}-r0"><span class="n" id="{cid}-n0">0</span><div><span class="lab">Local<br/>businesses</span><span class="rule" id="{cid}-u0"></span></div></div>
        <div class="row" id="{cid}-r1"><span class="n" id="{cid}-n1">0</span><div><span class="lab">Events on<br/>the calendar</span><span class="rule" id="{cid}-u1"></span></div></div>
        <div class="row" id="{cid}-r2"><span class="n" id="{cid}-n2">2</span><div><span class="lab">Languages</span><div class="lchips"><span class="lc">EN</span><span class="lc">ES</span></div><span class="rule" id="{cid}-u2"></span></div></div>
      </div>'''
    script = f'''        const a = {{ v: 0 }}, b = {{ v: 0 }};
        tl.fromTo("#{cid}-r0", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, 0.92);
        tl.to(a, {{ v: 454, duration: 0.9, ease: "power2.out", onUpdate: () => {{ document.getElementById("{cid}-n0").textContent = Math.round(a.v); }} }}, 0.92);
        tl.to("#{cid}-u0", {{ width: 160, duration: 0.5, ease: "power3.out" }}, 1.30);
        tl.fromTo("#{cid}-r1", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, 3.00);
        tl.to(b, {{ v: 47, duration: 0.8, ease: "power2.out", onUpdate: () => {{ document.getElementById("{cid}-n1").textContent = Math.round(b.v); }} }}, 3.00);
        tl.to("#{cid}-u1", {{ width: 160, duration: 0.5, ease: "power3.out" }}, 3.35);
        tl.fromTo("#{cid}-r2", {{ autoAlpha: 0, y: 26 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, 4.90);
        tl.to("#{cid}-u2", {{ width: 160, duration: 0.5, ease: "power3.out" }}, 5.15);'''
    return MV["shell"](cid, A, dur, css, body, script)

def w5(A, dur):  # 19.55–26.00: mark 19.90 · name 20.20 · line 21.40 · url 22.30
    cid = "w5-end"; s = f'[data-composition-id="{cid}"]'; big = A["H"] == 1920
    css = MV["base_css"](cid, A) + f"""
      {s} .col {{ position: absolute; left: 0; right: 0; top: {'26%' if big else '20%'}; z-index: 36; text-align: center; }}
      {s} .mk {{ display: block; margin: 0 auto; width: {200 if big else 150}px; height: auto; opacity: 0; will-change: transform, opacity; }}
      {s} .nm {{ display: block; margin-top: {26 if big else 16}px; color: #fff; font-weight: 800; font-size: {92 if big else 66}px; letter-spacing: -2px; opacity: 0; will-change: transform, opacity; }}
      {s} .ln {{ display: block; margin-top: {18 if big else 12}px; color: {GOLD}; font-weight: 800; font-size: {40 if big else 30}px; letter-spacing: 4px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      {s} .url {{ display: inline-block; margin-top: {44 if big else 28}px; background: {GOLD}; color: {INK}; font-weight: 800; font-size: {44 if big else 34}px; letter-spacing: 1px; padding: 16px 40px; border-radius: 999px; opacity: 0; will-change: transform, opacity; box-shadow: 0 14px 34px rgba(239,198,24,0.3); }}
      {s} .credit {{ position: absolute; left: 84px; right: 84px; bottom: {'8.5%' if big else '8%'}; text-align: center; color: rgba(250,245,236,0.7); font-size: 22px; font-weight: 500; z-index: 36; opacity: 0; }}
    """
    body = f'''      <div class="field"></div>
      <div class="col"><img class="mk" id="{cid}-mk" src="public/mark-white.png" alt="" /><span class="nm" id="{cid}-nm">Lompoc Locals</span><span class="ln" id="{cid}-ln">One place for the whole town.</span><br/><span class="url" id="{cid}-url">lompoclocals.com</span></div>
      <div class="credit" id="{cid}-cr">{"" if BED_OWN else "🎵 Bama Country — Kevin MacLeod (incompetech.com) · CC BY 4.0"}</div>'''
    script = f'''        tl.fromTo("#{cid}-mk", {{ autoAlpha: 0, scale: 0.8 }}, {{ autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }}, 0.35);
        tl.fromTo("#{cid}-nm", {{ autoAlpha: 0, y: 20 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.65);
        tl.fromTo("#{cid}-ln", {{ autoAlpha: 0, y: 16 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 1.85);
        tl.fromTo("#{cid}-url", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 2.75);
        tl.fromTo("#{cid}-cr", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.4 }}, 3.20);'''
    return MV["shell"](cid, A, dur, css, body, script)

def fx(cid, dur, A, clip, ms, peak):
    s = f'[data-composition-id="{cid}"]'
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{A['W']}" data-height="{A['H']}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      {s} .fxwrap {{ position: absolute; inset: 0; mix-blend-mode: screen; opacity: 0; will-change: opacity; }}
      {s} video {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
    </style>
    <div class="fxwrap" id="{cid}-w" data-layout-allow-overlap><video id="{cid}-v" class="clip" src="public/{clip}" data-start="0" data-media-start="{ms:.2f}" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true }});
        tl.fromTo("#{cid}-w", {{ autoAlpha: 0 }}, {{ autoAlpha: {peak}, duration: {min(0.18, dur*0.3):.2f}, ease: "power2.out" }}, 0);
        tl.to("#{cid}-w", {{ autoAlpha: 0, duration: {max(0.3, dur*0.5):.2f}, ease: "power2.in" }}, {max(0.18, dur - max(0.3, dur*0.5)):.2f});
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def fade_chip(html, cid, dur):
    return html.replace(f'tl.set({{}}, {{}}, {dur:.2f});', f'tl.to("#{cid}-c0", {{ autoAlpha: 0, duration: 0.12 }}, {dur-0.30:.2f});\n        tl.set({{}}, {{}}, {dur:.2f});', 1)

def transparent_root(html):
    return re.sub(r'(<div data-composition-id="[^"]+"[^>]*?background: )#[0-9a-fA-F]{6}(">)', r'\1transparent\2', html, count=1)

def scene(cid, dur, A):
    if cid == "w1-catch": return w1(A, dur)
    return transparent_root(_scene(cid, dur, A))

def _scene(cid, dur, A):
    if cid == "w2-numbers": return w2(A, dur)
    if cid == "m1-members": return members_seq(A, 12.10, dur, MEMBERS, H7, X)
    if cid == "s2-search":  # typing done ~16.72; results 16.95/17.10/17.25 → rel 0.65/0.80/0.95
        return fade_chip(MV["s2_search"](A, dur).replace(", 0.55);", ", 0.65);").replace(", 0.72);", ", 0.80);").replace(", 0.88);", ", 0.95);"), cid, dur)
    if cid == "s3-page": return fade_chip(MV["s_member"](cid, A, dur, "They open a page", 300, 900, chip_at=0.20), cid, dur)
    if cid == "s5-tap":  return MV["s_member"](cid, A, dur, "They tap the number", 900, 2200, tap=(120, 2655, 430, 100), chip_at=0.15)
    if cid == "w5-end": return w5(A, dur)
    raise ValueError(cid)

def index(A, folder):
    VO_ROWS = chr(10).join(f'      <audio id="vo{i}" class="clip" data-audio-group="voiceover" src="{f}" data-start="{at:.2f}" data-media-start="{ms:.2f}" data-duration="{d:.2f}" data-track-index="10" data-volume="1" data-fade-in="0.05" data-fade-out="0.08"></audio>' for i, (f, ms, d, at) in enumerate(VO_SLICES))
    rows = [f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{st:.2f}" data-duration="{du:.2f}" data-track-index="{i+1}"></div>' for i, (cid, st, du) in enumerate(SCENES)]
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress-v9.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="13"></div>')
    rows += [f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{st:.2f}" data-duration="{du:.2f}" data-track-index="14"></div>' for cid, st, du, _, _, _ in FX]
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs-v9.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="15"></div>')
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={A['W']}, height={A['H']}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      @font-face {{ font-family: "Plus Jakarta Sans"; src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-style: normal; }}
      html, body {{ margin: 0; width: {A['W']}px; height: {A['H']}px; overflow: hidden; background: #07040a; }}
      body {{ font-family: "Plus Jakarta Sans", sans-serif; }}
      #root {{ position: relative; width: {A['W']}px; height: {A['H']}px; overflow: hidden; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <!-- THIS IS LOMPOC v9 — spotlight-style master commercial v9.2: wow catch, three numbers, ALL Growth members (one mention + one picture each), phone beats, end card. {TOTAL:.2f}s. Dylan v9 read at {VO_START}. fx clips = transitions only. Generated by gen_v9.py; v6 index.html untouched. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="{A['W']}" data-height="{A['H']}">
{chr(10).join(rows)}

{VO_ROWS}
      <audio id="music-bed" class="clip" data-audio-group="music" src="{BED_SRC}" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="{BED_VOL}" data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.3}}' data-automation='{{"version":1,"lanes":[{{"target":"volume","points":[{{"t":0,"v":{BED_VOL}}},{{"t":34.40,"v":{BED_VOL}}},{{"t":35.90,"v":0}}]}}]}}'></audio>
      <audio id="sfx-drone" class="clip" data-audio-group="sfx" src="public/sfx/low-drone.wav" data-start="0" data-media-start="0" data-duration="6.50" data-track-index="12" data-volume="0.7" data-fade-in="0.3" data-fade-out="1.4"></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''

for key, folder, idx in (("9x16", "compositions", "index-v9.tmpl"), ("4x5", "compositions-4x5", "index-v9-4x5.tmpl")):
    A = MV["ASPECTS"][key]
    for cid, st, du in SCENES: write(f"{folder}/{cid}.html", scene(cid, du, A))
    for cid, st, du, clip, ms, peak in FX: write(f"{folder}/{cid}.html", fx(cid, du, A, clip, ms, peak))
    write(f"{folder}/progress-v9.html", H7["progress_scene"](A["H"], A["bar"]))
    write(f"{folder}/subs-v9.html", MV["subs"](A))
    write(idx, index(A, folder))
print("wrote v9:", [s[0] for s in SCENES], "+ fx, progress-v9, subs-v9 for 9x16 and 4x5")
