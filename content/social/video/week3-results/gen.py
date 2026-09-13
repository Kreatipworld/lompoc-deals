#!/usr/bin/env python3
"""
Week 3 RESULTS — Saturday Sep 12 2026 recap. Braves 48-6 over Pioneer Valley at Huyck (3-0);
Conqs 14-49 at Nipomo (1-3). Next: Cabrillo vs Righetti Thu 9/17 7 PM Huyck · Lompoc vs Dublin Fri 9/18 7 PM Huyck.
22.0 s, 9:16. Arthur read at 0.50, new highlights bed, own SFX + own Big Game clips. Generated from this file:

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    # id,          start, dur
    ("s1-open",    0.00,  2.70),   # stadium lights · pill WEEK 3 · FINAL · "Week 3 is in the books."
    ("s2-braves",  2.50,  6.20),   # Braves scoreboard 48-6 · 3-0
    ("s3-conqs",   8.60,  4.20),   # Conqs scoreboard 14-49 · 1-3
    ("s4-next",    12.70, 2.70),   # NEXT UP
    ("s5-end",     15.30, 6.70),   # end card · lompoclocals.com/football
]
TOTAL = 22.00
VO_START = 0.50
VO_DUR = 20.21

# burned-in captions (absolute seconds from ASR word times + 0.50)
SUBS = [
    (0.50, 2.20, "Week 3 is in the books."),
    (2.78, 7.50, "At Huyck Stadium, the Lompoc Braves rolled past Pioneer Valley, 48 to 6."),
    (8.10, 8.85, "3-0."),
    (8.90, 12.40, "Down in Nipomo, the Conqs fell 49 to 14."),
    (13.00, 15.00, "They come home Thursday against Righetti."),
    (15.50, 20.60, "Every score, every week, at lompoclocals.com/football"),
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; BG = "#140a17"; RED = "#d7263d"; GREEN = "#2fbf6b"


def common_css(cid, H, bar):
    return f"""
      [data-composition-id="{cid}"] .cine-bar {{ position: absolute; left: 0; right: 0; height: {bar}px; background: #0a060c; z-index: 60; }}
      [data-composition-id="{cid}"] .cine-top {{ top: 0; }} [data-composition-id="{cid}"] .cine-bot {{ bottom: 0; }}
      [data-composition-id="{cid}"] .stage {{ position: absolute; inset: 0; opacity: 0; will-change: opacity; }}
      [data-composition-id="{cid}"] .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 68%, rgba(10,6,12,0.36) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.08; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position: absolute; top: 150px; right: 84px; width: 96px; height: auto; z-index: 40; }}
      [data-composition-id="{cid}"] video {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
      [data-composition-id="{cid}"] .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      [data-composition-id="{cid}"] .cover {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.08) saturate(1.05) brightness(0.72); }}
      [data-composition-id="{cid}"] .scrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to top, rgba(20,10,23,0.94) 0%, rgba(20,10,23,0.72) 34%, rgba(20,10,23,0.15) 62%); }}
      [data-composition-id="{cid}"] .topscrim {{ position: absolute; inset: 0; z-index: 31; pointer-events: none; background: linear-gradient(to bottom, rgba(20,10,23,0.76) 0%, rgba(20,10,23,0.28) 22%, rgba(20,10,23,0.0) 38%); }}
      [data-composition-id="{cid}"] .chip {{ display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 34px; letter-spacing: 3px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .hero {{ display: block; color: #fff; text-shadow: 0 6px 30px rgba(10,6,12,0.7); font-weight: 800; font-size: 118px; line-height: 0.96; letter-spacing: -5px; opacity: 0; will-change: transform, opacity; }}
      /* scoreboard */
      [data-composition-id="{cid}"] .board {{ position: absolute; left: 84px; right: 84px; top: 34%; z-index: 36; }}
      [data-composition-id="{cid}"] .row {{ display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 0; border-bottom: 2px solid rgba(255,255,255,0.14); opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .row .name {{ color: #fff; font-weight: 800; font-size: 58px; letter-spacing: -1px; line-height: 1; text-transform: uppercase; }}
      [data-composition-id="{cid}"] .row .name small {{ display: block; color: rgba(255,255,255,0.62); font-size: 26px; letter-spacing: 3px; font-weight: 700; margin-bottom: 8px; }}
      [data-composition-id="{cid}"] .row .num {{ color: #fff; font-weight: 800; font-size: 150px; line-height: 0.9; letter-spacing: -6px; font-variant-numeric: tabular-nums; min-width: 230px; text-align: right; }}
      [data-composition-id="{cid}"] .row.win .num {{ color: {GOLD}; text-shadow: 0 0 40px rgba(239,198,24,0.35); }}
      [data-composition-id="{cid}"] .final {{ display: inline-block; margin-top: 26px; color: rgba(255,255,255,0.8); font-weight: 700; font-size: 30px; letter-spacing: 5px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      [data-composition-id="{cid}"] .rec {{ position: absolute; right: 84px; top: 24%; z-index: 37; background: {GOLD}; color: {INK}; font-weight: 800; font-size: 64px; letter-spacing: 0; padding: 16px 30px; border-radius: 14px; opacity: 0; will-change: transform, opacity; box-shadow: 0 14px 40px rgba(10,6,12,0.55); }}
      [data-composition-id="{cid}"] .rec small {{ display: block; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }}
      [data-composition-id="{cid}"] .badge {{ position: absolute; top: 20%; left: 84px; width: 210px; height: auto; z-index: 36; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55)); opacity: 0; will-change: transform, opacity; }}
    """


def wrap(cid, dur, H, bar, inner, js, first=False, bg=None):
    css = common_css(cid, H, bar)
    root_bg = (bg or BG) if first else "transparent"
    fade_js = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if first
               else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {root_bg}">
    <style>{css}
    </style>
    <div class="stage" id="{cid}-stage">
      {inner}
      <div class="vig"></div>
    </div>
    <img class="mark" src="public/mark-white.png" alt="" />
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


def count_js(sel, target, at, dur=1.0):
    # seek-safe count-up: a tweened proxy object drives textContent from the timeline
    return (f'{{ const o = {{ v: 0 }}; const el = document.querySelector("{sel}"); '
            f'tl.to(o, {{ v: {target}, duration: {dur:.2f}, ease: "power3.out", onUpdate: () => {{ el.textContent = String(Math.round(o.v)); }} }}, {at:.2f}); }}')


def scoreboard(cid, dur, H, bar, video, media_start, badge, our_name, our_small, our_score, opp_name, opp_small, opp_score,
               we_won, final_text, record, t_row1, t_num1, t_row2, t_num2, t_final, t_rec):
    win1 = "win" if we_won else ""
    win2 = "" if we_won else "win"
    # rows: ours first when we won (Braves), theirs first when we lost (Nipomo 49 / Cabrillo 14)
    r1 = (our_name, our_small, our_score, win1) if we_won else (opp_name, opp_small, opp_score, win2)
    r2 = (opp_name, opp_small, opp_score, win2) if we_won else (our_name, our_small, our_score, win1)
    if video.endswith(".jpg"):
        media = f'<div class="wrap" id="{cid}-w0" data-layout-allow-overflow><img class="cover" src="public/{video}" alt="" style="object-position: 50% 38%" /></div>'
        media_js = f'tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.08, duration: {dur:.2f}, ease: "none" }}, 0);'
    else:
        media = f'<video id="{cid}-v" class="clip" src="public/{video}" data-start="0" data-media-start="{media_start:.2f}" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="filter: brightness(0.62) saturate(0.9)"></video>'
        media_js = ""
    inner = f'''{media}
      <div class="scrim"></div><div class="topscrim"></div>
      <img class="badge" id="{cid}-badge" src="public/{badge}" alt="" />
      <div class="rec" id="{cid}-rec"><small>Record</small>{record}</div>
      <div class="board">
        <div class="row {r1[3]}" id="{cid}-r1"><div class="name"><small>{r1[1]}</small>{r1[0]}</div><div class="num" id="{cid}-n1">0</div></div>
        <div class="row {r2[3]}" id="{cid}-r2"><div class="name"><small>{r2[1]}</small>{r2[0]}</div><div class="num" id="{cid}-n2">0</div></div>
        <span class="final" id="{cid}-final">{final_text}</span>
      </div>'''
    n1 = r1[2]; n2 = r2[2]
    js = f'''{media_js}
        tl.fromTo("#{cid}-badge", {{ autoAlpha: 0, x: -30 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.05);
        tl.fromTo("#{cid}-r1", {{ autoAlpha: 0, y: 24 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, {t_row1:.2f});
        {count_js(f"#{cid}-n1", n1, t_num1, 0.9)}
        tl.fromTo("#{cid}-r2", {{ autoAlpha: 0, y: 24 }}, {{ autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }}, {t_row2:.2f});
        {count_js(f"#{cid}-n2", n2, t_num2, 0.6)}
        tl.fromTo("#{cid}-final", {{ autoAlpha: 0, y: 10 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, {t_final:.2f});
        tl.fromTo("#{cid}-rec", {{ autoAlpha: 0, scale: 1.6, rotation: -6 }}, {{ autoAlpha: 1, scale: 1, rotation: -6, duration: 0.38, ease: "expo.out" }}, {t_rec:.2f});'''
    return wrap(cid, dur, H, bar, inner, js)


def scene_html(cid, dur, H, bar):
    if cid == "s1-open":
        inner = f'''<video id="{cid}-v" class="clip" src="public/n2-brave-ready.mp4" data-start="0" data-media-start="0.30" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="filter: brightness(0.7)"></video>
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="chip" id="{cid}-pill" style="font-size:38px; padding:18px 32px">Week 3 · Final</span></div>
      <div style="position:absolute; left:84px; right:84px; bottom:21%; z-index:35"><span class="hero" id="{cid}-h1">Week 3 is<br />in the books.</span></div>'''
        js = f'''tl.set("#{cid}-pill", {{ autoAlpha: 1 }}, 0);
        tl.fromTo("#{cid}-h1", {{ autoAlpha: 0, y: 26, scale: 1.08 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "expo.out" }}, 0.55);'''
        return wrap(cid, dur, H, bar, inner, js, first=True)
    if cid == "s2-braves":
        # abs: scene 2.50 · row1 2.9 · 48 lands ~6.1 (count 5.2→6.1) · row2 6.55 · 6 lands ~7.25 · final 7.45 · 3-0 at 8.2
        return scoreboard(cid, dur, H, bar, "huyck-goalposts.jpg", 0, "badge-braves.png",
                          "Lompoc Braves", "Home", 48, "Pioneer Valley", "Visitor", 6, True,
                          "Final · Huyck Stadium", "3-0",
                          t_row1=0.40, t_num1=2.70, t_row2=3.95, t_num2=4.15, t_final=4.95, t_rec=5.70)
    if cid == "s3-conqs":
        # abs: scene 8.60 · row1 (Nipomo) 8.9 · 49 lands ~11.2 (count 10.3→11.2) · row2 11.35 · 14 lands ~12.1 · final 12.2 · 1-3 at 12.5
        return scoreboard(cid, dur, H, bar, "clip-conq2-reveal.mp4", 0.60, "badge-conqs.png",
                          "Cabrillo Conqs", "Visitor", 14, "Nipomo", "Home", 49, False,
                          "Final · at Nipomo", "1-3",
                          t_row1=0.30, t_num1=1.70, t_row2=2.75, t_num2=2.95, t_final=3.55, t_rec=3.90)
    if cid == "s4-next":
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, #1a0a1f 0%, {PURPLE} 55%, #1a0a1f 100%)"></div>
      <div style="position:absolute; left:84px; top:200px; z-index:36"><span class="chip" id="{cid}-pill" style="font-size:38px; padding:18px 32px">Next up · Huyck Stadium</span></div>
      <div style="position:absolute; left:84px; right:84px; top:36%; z-index:35; display:flex; flex-direction:column; gap:34px">
        <div id="{cid}-g1" style="display:flex; align-items:center; gap:26px; opacity:0"><img src="public/badge-conqs.png" alt="" style="width:150px; height:auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55))" /><div><div style="color:{GOLD}; font-weight:800; font-size:30px; letter-spacing:4px; text-transform:uppercase">Thu 9/17 · 7:00 PM</div><div style="color:#fff; font-weight:800; font-size:66px; line-height:1; letter-spacing:-2px; margin-top:8px">Cabrillo vs Righetti</div></div></div>
        <div id="{cid}-g2" style="display:flex; align-items:center; gap:26px; opacity:0"><img src="public/badge-braves.png" alt="" style="width:150px; height:auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55))" /><div><div style="color:{GOLD}; font-weight:800; font-size:30px; letter-spacing:4px; text-transform:uppercase">Fri 9/18 · 7:00 PM</div><div style="color:#fff; font-weight:800; font-size:66px; line-height:1; letter-spacing:-2px; margin-top:8px">Lompoc vs Dublin</div></div></div>
      </div>'''
        js = f'''tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: -10 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, 0.05);
        tl.fromTo("#{cid}-g1", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 0.30);
        tl.fromTo("#{cid}-g2", {{ autoAlpha: 0, x: -40 }}, {{ autoAlpha: 1, x: 0, duration: 0.45 }}, 1.20);'''
        return wrap(cid, dur, H, bar, inner, js)
    if cid == "s5-end":
        inner = f'''<div style="position:absolute; inset:0; background: linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:30%; z-index:20; text-align:center">
        <span id="{cid}-t1" style="display:block; color:#fff; font-weight:800; font-size:82px; line-height:1.0; letter-spacing:-2px; opacity:0">Every score,<br />every week.</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:44px; background:{GOLD}; color:{INK}; font-weight:800; font-size:44px; letter-spacing:0.5px; padding:20px 40px; border-radius:999px; opacity:0">lompoclocals.com/football</span>
        <span id="{cid}-t2" style="display:block; margin-top:34px; color:rgba(255,255,255,0.85); font-weight:600; font-size:34px; letter-spacing:1px; opacity:0">Both schools · schedules · scores · stories</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-t1", {{ autoAlpha: 0, y: 20, scale: 1.05 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }}, 0.25);
        tl.fromTo("#{cid}-pill", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }}, 1.90);
        tl.fromTo("#{cid}-t2", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, 2.60);'''
        return wrap(cid, dur, H, bar, inner, js)
    raise ValueError(cid)


def subs_scene(H, bar):
    cid = "subs"
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position: absolute; left: 60px; right: 60px; bottom: 170px; z-index: 70; display: flex; justify-content: center; pointer-events: none; }}
      [data-composition-id="{cid}"] .sub {{ position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; opacity: 0; will-change: opacity, transform; }}
      [data-composition-id="{cid}"] .sub span {{ display: inline-block; max-width: 920px; background: rgba(0,0,0,0.58); color: #fff; font-weight: 600; font-size: 42px; line-height: 1.25; padding: 14px 28px; border-radius: 20px; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }}
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
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{H}" data-duration="{TOTAL:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent; pointer-events: none">
    <style>
      [data-composition-id="{cid}"] .bar {{ position: absolute; left: 0; right: 0; bottom: {bar}px; height: 6px; background: {GOLD}; transform-origin: 0% 50%; transform: scaleX(0); z-index: 70; box-shadow: 0 0 12px rgba(239,198,24,0.6); }}
    </style>
    <div class="bar" id="prog-bar"></div>
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
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="8"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="{folder}/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="9"></div>')
    bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.5, "v": 0.22}, {"t": %.2f, "v": 0.22}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.2, TOTAL)
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
    <!-- WEEK 3 RESULTS — Sat Sep 12 2026. Braves 48-6 vs Pioneer Valley (3-0); Conqs 14-49 at Nipomo (1-3). MaxPreps, synced Sep 12. {TOTAL:.2f}s. Own clips + SFX. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="{H}">
{chr(10).join(rows)}

      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="0.72" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.22" data-fade-in="0.5" data-fade-out="1.2" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
      <audio id="sfx-1" class="clip" data-audio-group="sfx" src="public/shield-hit.wav" data-start="8.18" data-media-start="0" data-duration="1.40" data-track-index="12" data-volume="0.30" data-fade-out="0.4"></audio>
      <audio id="sfx-2" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="12.45" data-media-start="0" data-duration="1.20" data-track-index="12" data-volume="0.30" data-fade-out="0.3"></audio>
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
write(f"{folder}/subs.html", subs_scene(H, bar))
write(f"{folder}/progress.html", progress_scene(H, bar))
write("index.html", index_html(H, folder))
print("wrote", [s[0] for s in SCENES], "+ subs, progress, index.html")
