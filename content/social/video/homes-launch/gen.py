#!/usr/bin/env python3
"""
HOMES IN LOMPOC — launch master (Sep 14 2026). 40.0 s. 9:16 master + 4:5 cut.
Premium real-estate commercial: satellite open, the product in a phone frame, our first Plus agent
(Maressa Martinez, Empire Real Estate Group) and her four homes, then the call to agents.
Arthur read at 0.60, new premium bed, own flyover + light-leak, her photos, UI captures.

  python3 gen.py        # writes index.html, index-4x5.tmpl, compositions/, compositions-4x5/
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.30
SCENES = [
    # id,          start, dur
    ("s1-open",    0.00,  3.70),   # cover · satellite · pill
    ("s2-phone",   3.40,  6.20),   # title slam · /homes in the phone · REAL LISTINGS · LOCAL AGENTS
    ("s3-tiles",   9.30,  3.30),   # photos · open houses · the person to call
    ("s4-agent",   12.40, 5.30),   # Maressa · Empire · FIRST AGENT ON THE MARKET
    ("s5-homes",   17.50, 9.80),   # four homes, Zillow cards
    ("s6-tour",    27.10, 3.40),   # /listings/50 in the phone · ONE TAP FROM A TOUR
    ("s7-agents",  30.30, 6.00),   # Lompoc agents: this is your market · list your homes
    ("s8-end",     36.10, 3.90),   # wordmark · lompoclocals.com/homes · tagline
]
TOTAL = 40.00
VO_START = 0.60
VO_DUR = 38.93
VO_VOL = 0.80
BED_VOL = 0.26

SUBS = [
    (0.60, 3.30, "Lompoc has a new place to find a home."),
    (3.98, 6.20, "Homes in Lompoc, on Lompoc Locals."),
    (7.10, 9.30, "Real listings, posted by real local agents,"),
    (9.66, 12.40, "with photos, open houses, and the person to call."),
    (13.26, 15.90, "Meet Maressa Martinez, Empire Real Estate Group,"),
    (16.42, 17.60, "the first agent on the market."),
    (18.26, 20.10, "A three-bedroom on South J Street."),
    (20.86, 22.50, "A townhome with no HOA."),
    (23.40, 25.00, "A move-in-ready home on North V."),
    (25.62, 27.00, "And a rental on Gaviota."),
    (27.80, 30.40, "Every home on the map, one tap from a tour."),
    (31.18, 33.40, "Lompoc agents, this is your market."),
    (34.06, 36.10, "List your homes where locals already look."),
    (37.14, 39.20, "lompoclocals.com/homes"),
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"; DEEP = "#2c0736"

HOMES = [
    # img, mode, price, facts, addr, chip, chip_kind, position
    ("l50-0c.jpg", "framed", "$659,000", "3 bd | 2 ba | 1,496 sqft", "238 S J St, Lompoc", "For sale", "sale", "50% 50%"),
    ("l53-0.jpg",  "framed", "$490,000", "3 bd | 1.5 ba | 1,327 sqft", "Townhome · Lompoc · no HOA", "For sale", "sale", "50% 50%"),
    ("l51-0.jpg",  "framed", "$275,000", "3 bd | 2 ba | 1,440 sqft", "1317 N V St #97, Lompoc", "For sale", "sale", "50% 50%"),
    ("l52-0.jpg",  "framed", "$3,700/mo", "3 bd | 2 ba | 1,840 sqft", "2207 Gaviota, Lompoc", "For rent", "rent", "50% 50%"),
]


def common_css(cid, H, bar):
    wide = H == 1920
    mark_top = 150 if wide else 104
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 68%, rgba(10,6,12,0.34) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.07; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position: absolute; top: {mark_top}px; right: 84px; width: 92px; height: auto; z-index: 40; }}
      [data-composition-id="{cid}"] video.bg {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
      [data-composition-id="{cid}"] video.leak {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: screen; opacity: 0.55; z-index: 45; pointer-events: none; }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05) saturate(1.05); }}
      [data-composition-id="{cid}"] .blur {{ position: absolute; inset: -6%; background-size: cover; background-position: 50% 50%; filter: blur(34px) brightness(0.45) saturate(1.15); }}
      [data-composition-id="{cid}"] .whole {{ display: block; position: absolute; left: 0; width: 1080px; height: auto; top: 44%; transform: translateY(-50%); box-shadow: 0 30px 80px rgba(0,0,0,0.55); filter: contrast(1.05) saturate(1.05); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.92) 0%, rgba(20,10,23,0.6) 30%, rgba(20,10,23,0.0) 55%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.72) 0%, rgba(20,10,23,0.25) 22%, rgba(20,10,23,0.0) 38%); }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 32px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      [data-composition-id="{cid}"] .pill {{ display: inline-block; background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.4); color: #fff; font-weight: 700; font-size: 28px; letter-spacing: 3px; text-transform: uppercase; padding: 12px 26px; border-radius: 999px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .hero {{ display: block; color: #fff; text-shadow: 0 8px 36px rgba(10,6,12,0.75); font-weight: 800; font-size: 120px; line-height: 0.94; letter-spacing: -5px; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .card {{ position: absolute; left: 64px; right: 64px; z-index: 36; background: rgba(255,255,255,0.97); border-radius: 26px; padding: 30px 34px; box-shadow: 0 24px 60px rgba(10,6,12,0.45); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .card .price {{ display: block; color: {INK}; font-weight: 800; font-size: 78px; line-height: 1; letter-spacing: -2px; font-variant-numeric: tabular-nums; }}
      [data-composition-id="{cid}"] .card .facts {{ display: block; margin-top: 10px; color: #3d2a44; font-weight: 600; font-size: 34px; line-height: 1.2; }}
      [data-composition-id="{cid}"] .card .addr {{ display: block; margin-top: 8px; color: #6b5c72; font-weight: 500; font-size: 30px; line-height: 1.2; }}
      [data-composition-id="{cid}"] .card .status {{ position: absolute; top: -22px; left: 34px; background: #fff; color: {INK}; border: 2px solid rgba(101,12,117,0.18); font-weight: 800; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; padding: 8px 18px; border-radius: 999px; }}
      [data-composition-id="{cid}"] .card .status.rent {{ background: {GOLD}; border-color: {GOLD}; }}
      [data-composition-id="{cid}"] .phone {{ position: absolute; left: 50%; z-index: 34; transform: translateX(-50%); border-radius: 64px; overflow: hidden; background: #0d0a10; box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 14px #1a1420, 0 0 0 18px rgba(255,255,255,0.10); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .phone img {{ display: block; width: 100%; height: auto; will-change: transform; }}
    """


def wrap(cid, dur, H, bar, inner, js, first=False, bg=None, mark=True):
    css = common_css(cid, H, bar)
    root_bg = (bg or BG) if first else "transparent"
    fade_js = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if first
               else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    mark_html = '<img class="mark" src="public/mark-white.png" alt="" />' if mark else ""
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {root_bg}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      {inner}
      <div class="vig"></div>
    </div>
    {mark_html}
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


def leak(cid, start, dur, track):
    return f'<video id="{cid}-leak{track}" class="clip leak" src="public/fx-lightleak.mp4" data-start="{start:.2f}" data-media-start="0.30" data-duration="{dur:.2f}" data-track-index="{track}" muted playsinline></video>'


def framed(cid, src, pos="50% 50%", top="44%"):
    return f'''<div class="wrap" id="{cid}-w0" data-layout-allow-overflow>
        <div class="blur" style="background-image: url('public/{src}')"></div>
        <img class="whole" src="public/{src}" alt="" style="top: {top}; object-position: {pos}" />
      </div>'''


def phone_geom(H):
    # device inner width/height and capture scale (captures are 430×2300)
    if H == 1920:
        w, h = 720, 1250
    else:
        w, h = 540, 900
    scale = w / 430.0
    img_h = 2300 * scale
    return w, h, scale, img_h


def scene_html(cid, dur, H, bar):
    wide = H == 1920
    safe_bottom = "22%" if wide else "19%"
    if cid == "s1-open":
        # COVER (frame 0, held ~1.0 s): HOMES IN LOMPOC · the real market, by local agents · lompoclocals.com/homes,
        # all inside the center safe zone. Then the cover text lifts, the pill drops in; the title slam lives in s2.
        inner = f'''<video id="{cid}-bg" class="clip bg" src="public/fly-dive.mp4" data-start="0" data-media-start="0.00" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="filter: saturate(0.9) brightness(0.9)"></video>
      <div style="position:absolute; inset:0; z-index:31; pointer-events:none; background: linear-gradient(180deg, rgba(44,7,54,0.55) 0%, rgba(101,12,117,0.42) 45%, rgba(20,10,23,0.9) 100%)"></div>
      <div id="{cid}-cover" style="position:absolute; left:0; right:0; top:50%; z-index:36; text-align:center; padding:0 60px" data-layout-allow-overlap>
        <span style="display:block; color:{GOLD}; font-weight:800; font-size:30px; letter-spacing:6px; text-transform:uppercase">New on Lompoc Locals</span>
        <span style="display:block; margin-top:26px; color:#fff; font-weight:800; font-size:152px; line-height:0.9; letter-spacing:-7px; text-transform:uppercase; text-shadow: 0 12px 50px rgba(10,6,12,0.8)">Homes<br />in Lompoc</span>
        <span style="display:block; margin-top:34px; color:rgba(255,248,236,0.96); font-weight:700; font-size:50px; letter-spacing:-0.5px">the real market, by local agents</span>
        <span style="display:inline-block; margin-top:34px; background:rgba(0,0,0,0.55); border:2px solid rgba(255,255,255,0.25); color:#fff; font-weight:700; font-size:34px; letter-spacing:0.5px; padding:14px 30px; border-radius:999px">lompoclocals.com/homes</span>
      </div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="pill" id="{cid}-pill">New on Lompoc Locals</span></div>'''
        js = f'''tl.set("#{cid}-cover", {{ yPercent: -50 }}, 0);
        tl.to("#{cid}-cover", {{ autoAlpha: 0, y: -30, scale: 1.04, duration: 0.5, ease: "power2.in" }}, 1.00);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: -12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 1.60);'''
        return wrap(cid, dur, H, bar, inner, js, first=True)

    if cid == "s2-phone":
        # abs 3.40 · title 3.9→0.50 · REAL LISTINGS 7.1→3.70 · LOCAL AGENTS 8.94→5.54
        w, h, scale, img_h = phone_geom(H)
        top = 470 if wide else 330
        scroll = -(img_h - h) * 0.72
        inner = f'''<div style="position:absolute; inset:0; background: radial-gradient(ellipse 90% 70% at 50% 30%, {PURPLE} 0%, {DEEP} 65%, #1a0520 100%)"></div>
      {leak(cid, 0.0, 1.6, 0)}
      <div style="position:absolute; left:84px; right:84px; top:{190 if wide else 130}px; z-index:36">
        <span class="hero" id="{cid}-title" style="font-size:{104 if wide else 84}px">Homes in Lompoc</span>
      </div>
      <div class="phone" id="{cid}-phone" style="top:{top}px; width:{w}px; height:{h}px">
        <img id="{cid}-shot" src="public/ui-homes.png" alt="" />
      </div>
      <div style="position:absolute; left:84px; right:84px; top:{330 if wide else 235}px; z-index:37; display:flex; gap:16px; flex-wrap:wrap">
        <span class="chip" id="{cid}-c1">Real listings</span>
        <span class="chip" id="{cid}-c2">Local agents</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-title", {{ autoAlpha: 0, y: 30, scale: 1.08 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, 0.50);
        tl.fromTo("#{cid}-phone", {{ autoAlpha: 0, y: 120, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out" }}, 0.55);
        tl.fromTo("#{cid}-shot", {{ y: 0 }}, {{ y: {scroll:.0f}, duration: {dur - 1.2:.2f}, ease: "power1.inOut" }}, 1.10);
        tl.fromTo("#{cid}-c1", {{ autoAlpha: 0, x: -24 }}, {{ autoAlpha: 1, x: 0, duration: 0.4, ease: "expo.out" }}, 3.70);
        tl.fromTo("#{cid}-c2", {{ autoAlpha: 0, x: -24 }}, {{ autoAlpha: 1, x: 0, duration: 0.4, ease: "expo.out" }}, 5.54);'''
        return wrap(cid, dur, H, bar, inner, js, mark=False)

    if cid == "s3-tiles":
        # abs 9.30 · photos 10.04→0.74 · open houses 10.84→1.54 · person 11.9→2.60
        th = 400 if wide else 300
        tile = f"position:relative; overflow:hidden; border-radius:24px; background:#1a0a1f; height:{th}px; opacity:0; will-change: transform, opacity; box-shadow: 0 16px 40px rgba(10,6,12,0.5)"
        lab = "position:absolute; left:0; right:0; bottom:0; padding:18px 24px; background: linear-gradient(to top, rgba(20,10,23,0.92), rgba(20,10,23,0)); color:#fff; font-weight:800; font-size:36px; letter-spacing:0.5px"
        av = 300 if wide else 220
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, #1a0a1f 0%, {PURPLE} 55%, #1a0a1f 100%)"></div>
      <div style="position:absolute; left:64px; right:64px; top:{13 if wide else 10}%; z-index:35; display:grid; grid-template-columns:1fr; gap:22px">
        <div id="{cid}-t1" style="{tile}"><img src="public/l52-0.jpg" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 45%" /><div style="{lab}">Photos</div></div>
        <div id="{cid}-t2" style="{tile}"><img src="public/l53-0.jpg" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 50%" /><span style="position:absolute; top:18px; left:22px; background:{GOLD}; color:{INK}; font-weight:800; font-size:26px; letter-spacing:1px; text-transform:uppercase; padding:8px 16px; border-radius:999px">Open house</span><div style="{lab}">Open houses</div></div>
        <div id="{cid}-t3" style="{tile}; display:flex; align-items:center; gap:28px; padding:0 34px; background: linear-gradient(135deg, #3a0b45, #1a0a1f)"><img src="public/agent-avatar.jpg" alt="" style="width:{av}px; height:{av}px; border-radius:50%; object-fit:cover; object-position:50% 20%; border:6px solid {GOLD}; flex:none" /><div><span style="display:block; color:#fff; font-weight:800; font-size:40px; line-height:1.05">The person<br />to call</span><span style="display:block; margin-top:10px; color:rgba(255,255,255,0.8); font-weight:600; font-size:26px">Every home lists its agent</span></div></div>
      </div>'''
        js = f'''tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 40, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 0.74);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 40, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 1.54);
        tl.fromTo("#{cid}-t3", {{ autoAlpha: 0, y: 40, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }}, 2.60);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s4-agent":
        # abs 12.40 · Meet 13.26→0.86 · name 13.5→1.10 · Empire 14.88→2.48 · chip 16.5→4.10
        sz = 640 if wide else 470
        card = 250 if wide else 190
        inner = f'''<div style="position:absolute; inset:0; background: radial-gradient(ellipse 90% 70% at 50% 28%, {PURPLE} 0%, {DEEP} 62%, #1a0520 100%)"></div>
      {leak(cid, 0.0, 1.4, 0)}
      <div style="position:absolute; left:0; right:0; top:{15 if wide else 9}%; z-index:36; text-align:center">
        <img id="{cid}-av" src="public/agent-avatar.jpg" alt="" style="width:{sz}px; height:{sz}px; border-radius:48px; object-fit:cover; object-position:50% 15%; border:8px solid rgba(255,255,255,0.9); box-shadow: 0 30px 80px rgba(0,0,0,0.55); opacity:0; will-change: transform, opacity" />
        <span id="{cid}-meet" style="display:block; margin-top:34px; color:{GOLD}; font-weight:800; font-size:30px; letter-spacing:6px; text-transform:uppercase; opacity:0">Meet</span>
        <span id="{cid}-name" style="display:block; margin-top:10px; color:#fff; font-weight:800; font-size:{84 if wide else 66}px; line-height:0.98; letter-spacing:-3px; opacity:0">Maressa Martinez</span>
        <span id="{cid}-role" style="display:block; margin-top:14px; color:rgba(255,255,255,0.85); font-weight:600; font-size:36px; opacity:0">Realtor · Empire Real Estate Group</span>
        <span class="chip" id="{cid}-chip" style="margin-top:34px; font-size:34px; padding:16px 30px">First agent on the market</span>
      </div>
      <img id="{cid}-promo" src="public/agent-cover.jpg" alt="" style="position:absolute; right:64px; bottom:{'14.5%' if wide else '12%'}; width:{card}px; border-radius:18px; border:6px solid #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.5); transform: rotate(6deg); z-index:36; opacity:0; will-change: transform, opacity" />'''
        js = f'''tl.fromTo("#{cid}-av", {{ autoAlpha: 0, y: 40, scale: 0.9 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "expo.out" }}, 0.30);
        tl.fromTo("#{cid}-meet", {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, 0.86);
        tl.fromTo("#{cid}-name", {{ autoAlpha: 0, y: 24, scale: 1.05 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, 1.10);
        tl.fromTo("#{cid}-role", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 2.48);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, 4.10);
        tl.fromTo("#{cid}-promo", {{ autoAlpha: 0, y: 40, rotation: 14 }}, {{ autoAlpha: 1, y: 0, rotation: 6, duration: 0.6, ease: "expo.out" }}, 2.70);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s5-homes":
        # abs 17.50 · homes at 18.3→0.80 · 21.0→3.50 · 23.4→5.90 · 26.0→8.50 ; each shot holds until the next
        beats = [0.80, 3.50, 5.90, 8.50]
        shots = []
        cards = []
        js_lines = []
        card_bottom = "23%" if wide else "20%"
        for i, (img, mode, price, facts, addr, chip, kind, pos) in enumerate(HOMES):
            shots.append(f'''<div class="wrap" id="{cid}-s{i}" data-layout-allow-overflow style="opacity:0">
        <div class="blur" style="background-image: url('public/{img}')"></div>
        <img class="whole" src="public/{img}" alt="" style="top: 42%; object-position: {pos}" />
      </div>''')
            cards.append(f'''<div class="card" id="{cid}-k{i}" style="bottom:{card_bottom}"><span class="status {kind}">{chip}</span><span class="price">{price}</span><span class="facts">{facts}</span><span class="addr">{addr}</span></div>''')
            b = beats[i]
            nxt = beats[i + 1] if i + 1 < len(beats) else dur + 1
            first_shot = 0.0 if i == 0 else b - 0.25
            js_lines.append(f'tl.fromTo("#{cid}-s{i}", {{ autoAlpha: 0, scale: 1.06 }}, {{ autoAlpha: 1, scale: 1.0, duration: 0.5, ease: "power2.out" }}, {first_shot:.2f});')
            js_lines.append(f'tl.to("#{cid}-s{i}", {{ scale: 1.05, duration: {nxt - first_shot:.2f}, ease: "none" }}, {first_shot + 0.5:.2f});')
            js_lines.append(f'tl.fromTo("#{cid}-k{i}", {{ autoAlpha: 0, y: 40 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, {b:.2f});')
            if i + 1 < len(beats):
                js_lines.append(f'tl.to("#{cid}-s{i}", {{ autoAlpha: 0, duration: 0.3 }}, {nxt - 0.25:.2f});')
                js_lines.append(f'tl.to("#{cid}-k{i}", {{ autoAlpha: 0, y: -20, duration: 0.25 }}, {nxt - 0.30:.2f});')
        inner = "\n      ".join(shots) + f'''
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="pill" id="{cid}-pill">Her homes right now</span></div>
      ''' + "\n      ".join(cards)
        js = "\n        ".join(js_lines) + f'''
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: -12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 0.40);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s6-tour":
        # abs 27.10 · chip 29.6→2.50 ; phone scrolls to Request a tour (buttons ≈ y 770 of 2300 capture)
        w, h, scale, img_h = phone_geom(H)
        top = 250 if wide else 170
        target = -(770 * scale - h * 0.42)
        inner = f'''<div style="position:absolute; inset:0; background: radial-gradient(ellipse 90% 70% at 50% 30%, {PURPLE} 0%, {DEEP} 65%, #1a0520 100%)"></div>
      {leak(cid, 0.0, 1.4, 0)}
      <div class="phone" id="{cid}-phone" style="top:{top}px; width:{w}px; height:{h}px">
        <img id="{cid}-shot" src="public/ui-listing.png" alt="" />
      </div>
      <div style="position:absolute; left:84px; right:84px; bottom:{'19.5%' if wide else '18%'}; z-index:37"><span class="chip" id="{cid}-c1">One tap from a tour</span></div>'''
        js = f'''tl.fromTo("#{cid}-phone", {{ autoAlpha: 0, y: 100, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "expo.out" }}, 0.10);
        tl.fromTo("#{cid}-shot", {{ y: 0 }}, {{ y: {target:.0f}, duration: 2.2, ease: "power2.inOut" }}, 0.50);
        tl.fromTo("#{cid}-c1", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, 2.50);'''
        return wrap(cid, dur, H, bar, inner, js, mark=False)

    if cid == "s7-agents":
        # abs 30.30 · line1 31.2→0.90 · line2 34.0→3.70 · small 35.5→5.20
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, {PURPLE} 0%, {DEEP} 100%)"></div>
      {leak(cid, 0.0, 1.4, 0)}
      <video id="{cid}-particles" class="clip" src="public/fx-particles.mp4" data-start="0" data-media-start="0.20" data-duration="{dur:.2f}" data-track-index="1" muted playsinline style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; mix-blend-mode: screen; opacity: 0.35; z-index: 5"></video>
      <div style="position:absolute; left:84px; right:84px; top:{22 if wide else 16}%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:{104 if wide else 82}px">Lompoc agents:<br />this is your market.</span>
        <span id="{cid}-h2" style="display:block; margin-top:44px; color:{GOLD}; font-weight:800; font-size:{56 if wide else 46}px; line-height:1.08; letter-spacing:-1px; opacity:0; will-change: transform, opacity">List your homes where locals already look.</span>
        <span id="{cid}-h3" style="display:block; margin-top:40px; color:rgba(255,255,255,0.85); font-weight:600; font-size:30px; letter-spacing:0.5px; opacity:0">Plus · $99.99/mo · lompoclocals.com/for-businesses/real-estate</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-h1", {{ autoAlpha: 0, y: 30, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, 0.90);
        tl.fromTo("#{cid}-h2", {{ autoAlpha: 0, y: 20 }}, {{ autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 3.70);
        tl.fromTo("#{cid}-h3", {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 5.20);'''
        return wrap(cid, dur, H, bar, inner, js)

    if cid == "s8-end":
        # abs 36.10 · wordmark 36.3→0.20 · pill 37.2→1.10 · tagline 38.6→2.50
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:{28 if wide else 22}%; z-index:20; text-align:center">
        <span id="{cid}-wm" style="display:block; color:#fff; font-weight:800; font-size:{112 if wide else 92}px; line-height:0.94; letter-spacing:-4px; opacity:0">LOMPOC<br />LOCALS</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:44px; background:{GOLD}; color:{INK}; font-weight:800; font-size:44px; letter-spacing:0.5px; padding:20px 40px; border-radius:999px; opacity:0">lompoclocals.com/homes</span>
        <span id="{cid}-t2" style="display:block; margin-top:34px; color:rgba(255,255,255,0.9); font-weight:700; font-size:40px; letter-spacing:0.5px; opacity:0">All of Lompoc, in one place.</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-wm", {{ autoAlpha: 0, y: 24, scale: 1.06 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, 0.20);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 1.10);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 2.50);'''
        return wrap(cid, dur, H, bar, inner, js, mark=False)
    raise ValueError(cid)


def subs_scene(H, bar):
    cid = "subs"
    bottom = 170 if H == 1920 else 118
    fs = 42 if H == 1920 else 36
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: {bottom}px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      [data-composition-id="{cid}"] .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      [data-composition-id="{cid}"] .sub span {{ display: inline-block; max-width: 920px; background: rgba(0,0,0,0.58); color: #fff; font-weight: 600; font-size: {fs}px; line-height: 1.25; padding: 14px 28px; border-radius: 20px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
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


def index_html(H, folder):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="12"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="13"></div>')
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
    <!-- HOMES IN LOMPOC — launch master. {TOTAL:.2f}s. Own flyover + light-leak, UI captures, the agent's own photos, Arthur read, new bed. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="14" data-volume="{VO_VOL:.2f}" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="15" data-volume="{BED_VOL:.2f}" data-fade-in="0.6" data-fade-out="1.4" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
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
    write(f"{folder}/subs.html", subs_scene(H, bar))
    write(f"{folder}/progress.html", progress_scene(H, bar))
    write(idx, index_html(H, folder))
print("wrote", [s[0] for s in SCENES], "+ subs, progress, index.html, index-4x5.tmpl")
