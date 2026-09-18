#!/usr/bin/env python3
"""
THE LOMPOC DINNER BOARD — Fri Sep 18 2026. A split-flap departures board: rows are Lompoc
kitchens, the "departure" time is when each one stops serving. Members flip in first (gold dot +
their own photo + real Friday closing times), then every other local kitchen still open tonight.
20.5 s, 9:16. Frame 0 = the board mid-flip (cover). Generated from this file:

  python3 gen.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.25
SCENES = [
    ("s1-wake",   0.00, 3.05),
    ("s2-members", 2.85, 7.85),
    ("s3-more",   10.50, 5.20),
    ("s4-end",    15.50, 5.00),
]
TOTAL = 20.50
VO_START = 0.00
VO_DUR = 20.00   # vo.wav has the per-line offsets baked in (silence-mapped to the captions)

SUBS = [
    (0.50, 3.96, "It's Friday night. You still haven't decided."),
    (4.15, 6.71, "Every kitchen in Lompoc still serving."),
    (7.00, 7.95, "Members first."),
    (10.75, 13.32, "Then fifty more, all over town."),
    (15.20, 19.90, "Dinner in Lompoc. Pick one at lompoclocals.com/find/dinner"),
]

# members: photo, name, opens — real Friday hours from the listings
MEMBERS = [
    ("m4-jaspers.png","JASPER'S SALOON",  "2:00"),
    ("m-hangar.png",  "HANGAR 7",         "12:00"),
    ("m1-toro.png",   "TORO LOCO",        "9:00"),
    ("m3-eddies.png", "EDDIE'S GRILL",    "9:00"),
    ("m5-culichi.png","EL CULICHI",       "8:30"),
    ("m6-eyeoni.png", "EYE ON I",         "8:00"),
]
# the rest of the local kitchens open through the midday hour
MORE = [
    ("WICKED SHAMROCK", "2:00"),       ("PCH STREET", "12:00"),
    ("JOHNNY'S BAR & GRILL", "12:00"), ("CINCO DE MAYO", "11:30"),
    ("NOBLE GRUB", "11:00"),           ("FATTE'S PIZZA", "11:00"),
    ("OLD TOWN KITCHEN", "10:00"),     ("HOPTIONS TAPROOM", "10:00"),
    ("VALLE EATERY & BAR", "10:00"),   ("GLAZE'S SMOKEHOUSE", "9:00"),
]

GOLD = "#efc618"; INK = "#0d0b10"; PURPLE = "#650c75"; BOARD = "#17141c"; FLAP = "#221d2a"; CREAM = "#f2ead9"

def css(cid):
    return f"""
      [data-composition-id="{cid}"] .stage {{ position:absolute; inset:0; opacity:0; will-change:opacity; }}
      [data-composition-id="{cid}"] .bg {{ position:absolute; inset:0; background:
          radial-gradient(ellipse 90% 45% at 50% 16%, rgba(239,198,24,0.13) 0%, rgba(239,198,24,0) 62%),
          linear-gradient(180deg, #120f16 0%, {BOARD} 34%, #0c0a10 100%); }}
      [data-composition-id="{cid}"] .rails {{ position:absolute; left:0; right:0; top:0; bottom:0;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.032) 0 1px, transparent 1px 8px); }}
      [data-composition-id="{cid}"] .vig {{ position:absolute; inset:0; z-index:40; pointer-events:none;
          background: radial-gradient(ellipse 100% 78% at 50% 46%, rgba(8,6,10,0) 58%, rgba(8,6,10,0.62) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position:absolute; inset:0; pointer-events:none; opacity:0.07; z-index:52;
          background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position:absolute; top:150px; right:84px; width:92px; height:auto; z-index:44; opacity:0.92; }}
      /* board furniture */
      [data-composition-id="{cid}"] .hdr {{ position:absolute; left:84px; top:150px; z-index:42; }}
      [data-composition-id="{cid}"] .hdr .ttl {{ display:block; color:{CREAM}; font-weight:800; font-size:76px; letter-spacing:-2px; line-height:0.96; }}
      [data-composition-id="{cid}"] .hdr .sub {{ display:inline-block; margin-top:16px; color:{GOLD}; font-weight:800; font-size:27px; letter-spacing:6px; }}
      [data-composition-id="{cid}"] .secbar {{ position:absolute; left:84px; right:84px; z-index:41; display:flex; align-items:center; justify-content:space-between;
          border-bottom:2px solid rgba(239,198,24,0.42); padding-bottom:14px; }}
      [data-composition-id="{cid}"] .secbar span {{ color:{GOLD}; font-weight:800; font-size:30px; letter-spacing:6px; }}
      [data-composition-id="{cid}"] .secbar em {{ color:rgba(242,234,217,0.5); font-style:normal; font-weight:700; font-size:24px; letter-spacing:4px; }}
      /* flap row */
      [data-composition-id="{cid}"] .row {{ position:absolute; left:84px; right:84px; height:118px; z-index:41;
          background:linear-gradient(180deg, {FLAP} 0%, #1b1622 49%, #15111b 51%, #120e18 100%);
          border-radius:12px; box-shadow:0 10px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
          display:flex; align-items:center; gap:24px; padding:0 26px; overflow:hidden;
          transform-origin:50% 0%; will-change:transform, opacity; opacity:0; }}
      [data-composition-id="{cid}"] .row::after {{ content:""; position:absolute; left:0; right:0; top:50%; height:2px; background:rgba(0,0,0,0.55); }}
      [data-composition-id="{cid}"] .row .dot {{ width:16px; height:16px; border-radius:50%; background:{GOLD}; box-shadow:0 0 16px rgba(239,198,24,0.75); flex:none; }}
      [data-composition-id="{cid}"] .row img {{ width:84px; height:84px; border-radius:10px; object-fit:cover; flex:none; }}
      [data-composition-id="{cid}"] .row .nm {{ color:{CREAM}; font-weight:800; font-size:44px; letter-spacing:-0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }}
      [data-composition-id="{cid}"] .row .tm {{ color:{GOLD}; font-weight:800; font-size:44px; letter-spacing:1px; font-variant-numeric:tabular-nums; flex:none; }}
      [data-composition-id="{cid}"] .row.plain .nm {{ font-size:40px; color:rgba(242,234,217,0.94); }}
      [data-composition-id="{cid}"] .row.plain {{ height:96px; }}
      [data-composition-id="{cid}"] .row.plain .tm {{ font-size:38px; color:rgba(239,198,24,0.85); }}
    """

def wrap(cid, dur, inner, js, first=False):
    fade = (f'tl.set("#{cid}-stage", {{ autoAlpha: 1 }}, 0);' if first
            else f'tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);')
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{dur:.2f}" style="position:absolute; inset:0; overflow:hidden; background:{INK if first else 'transparent'}">
    <style>{css(cid)}
    </style>
    <div class="stage" id="{cid}-stage"{' style="opacity:1"' if first else ''}>
      <div class="bg"></div><div class="rails"></div>
      {inner}
      <div class="vig"></div>
    </div>
    <img class="mark" src="public/mark-white.png" alt="" />
    <div class="grain"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.4 }} }});
        {fade}
        {js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def flap_in(cid, sel, at, dist=0.30):
    """A split-flap: the row snaps down from a folded state, with a short counter-bounce."""
    return (f'tl.fromTo("{sel}", {{ autoAlpha:0, rotationX:-92, y:-16 }}, '
            f'{{ autoAlpha:1, rotationX:0, y:0, duration:{dist:.2f}, ease:"power4.out" }}, {at:.2f});'
            f'tl.to("{sel}", {{ rotationX:6, duration:0.07, ease:"sine.inOut", yoyo:true, repeat:1 }}, {at+dist:.2f});')

def scene_html(cid, dur):
    if cid == "s1-wake":
        chips = "".join(
            f'<img src="public/{img}" alt="" style="width:132px; height:132px; border-radius:14px; object-fit:cover; box-shadow:0 10px 26px rgba(0,0,0,0.55)" />'
            for img, _, _ in MEMBERS)
        inner = f'''<div class="hdr" id="{cid}-hdr" style="top:300px"><span class="ttl" style="font-size:112px; letter-spacing:-5px">LOMPOC<br />DINNER</span><span class="sub" id="{cid}-sub">FRI 9/18 &nbsp;·&nbsp; <span id="{cid}-clock">6:07</span></span></div>
      <div id="{cid}-chips" style="position:absolute; left:84px; right:84px; top:700px; z-index:42; display:flex; gap:16px; justify-content:space-between">{chips}</div>
      <div class="row" id="{cid}-r0" style="top:940px; perspective:900px; opacity:1"><span class="dot"></span><span class="nm">STILL SERVING</span><span class="tm" id="{cid}-cnt">56</span></div>
      <div id="{cid}-tag" style="position:absolute; left:84px; right:84px; top:1102px; z-index:42; color:rgba(242,234,217,0.55); font-weight:700; font-size:30px; letter-spacing:5px">MEMBERS FIRST &nbsp;·&nbsp; THEN THE WHOLE TOWN</div>'''
        js = (f'tl.set("#{cid}-hdr", {{ autoAlpha:1 }}, 0);'
              f'tl.set("#{cid}-chips", {{ autoAlpha:1 }}, 0);'
              f'tl.set("#{cid}-r0", {{ autoAlpha:1, rotationX:0 }}, 0);'
              f'tl.set("#{cid}-tag", {{ autoAlpha:1 }}, 0);'
              f'tl.fromTo("#{cid}-chips img", {{ y:10 }}, {{ y:0, duration:0.5, ease:"power2.out", stagger:0.05 }}, 0.05);'
              f'tl.to("#{cid}-r0", {{ rotationX:5, duration:0.09, ease:"sine.inOut", yoyo:true, repeat:1 }}, 1.45);'
              + f'{{ const o={{v:7}}; const el=document.querySelector("#{cid}-clock");'
                f' tl.to(o, {{ v:12, duration:1.30, ease:"none", onUpdate:()=>{{ el.textContent = "6:" + String(Math.round(o.v)).padStart(2,"0"); }} }}, 0.60); }}')
        return wrap(cid, dur, inner, js, first=True)

    if cid == "s2-members":
        top = 0.175
        rows = [f'<div class="secbar" id="{cid}-bar" style="top:{int(1920*0.145)}px"><span>MEMBERS</span><em>OPEN TILL</em></div>']
        js = [f'tl.fromTo("#{cid}-bar", {{ autoAlpha:0, y:-10 }}, {{ autoAlpha:1, y:0, duration:0.3 }}, 0.05)']
        for i, (img, nm, tm) in enumerate(MEMBERS):
            y = int(1920 * top) + 58 + i * 138
            rows.append(f'<div class="row" id="{cid}-r{i}" style="top:{y}px; perspective:900px"><span class="dot"></span><img src="public/{img}" alt="" /><span class="nm">{nm}</span><span class="tm">{tm}</span></div>')
            js.append(flap_in(cid, f"#{cid}-r{i}", 0.42 + i * 0.62))
        return wrap(cid, dur, "\n      ".join(rows), "\n        ".join(js))

    if cid == "s3-more":
        head = f'<div class="secbar" id="{cid}-bar" style="top:{int(1920*0.145)}px"><span>+50 MORE STILL OPEN</span><em>OPEN TILL</em></div>'
        js = [f'tl.fromTo("#{cid}-bar", {{ autoAlpha:0, y:-10 }}, {{ autoAlpha:1, y:0, duration:0.3 }}, 0.05)']
        rows = []
        for i, (nm, tm) in enumerate(MORE):
            y = int(1920 * 0.175) + 58 + i * 108
            rows.append(f'<div class="row plain" id="{cid}-r{i}" style="top:{y}px; perspective:900px"><span class="nm">{nm}</span><span class="tm">{tm}</span></div>')
            js.append(flap_in(cid, f"#{cid}-r{i}", 0.30 + i * 0.38, 0.22))
        # no drift: ten rows sit inside the safe band between the header and the captions
        scrim = ('<div style="position:absolute; left:0; right:0; bottom:0; height:560px; z-index:43; pointer-events:none; '
                 'background:linear-gradient(to top, #0c0a10 0%, rgba(12,10,16,0.96) 42%, rgba(12,10,16,0) 100%)"></div>')
        inner = head + f'\n      <div id="{cid}-scroll" style="position:absolute; inset:0; z-index:41">' + "\n        ".join(rows) + "</div>\n      " + scrim
        return wrap(cid, dur, inner, "\n        ".join(js))

    if cid == "s4-end":
        inner = f'''<div style="position:absolute; inset:0; z-index:44; background:linear-gradient(180deg, {PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:30%; z-index:46; text-align:center">
        <span id="{cid}-t1" style="display:block; color:#fff; font-weight:800; font-size:112px; line-height:0.98; letter-spacing:-4px; opacity:0">Pick one.</span>
        <span id="{cid}-pill" style="display:inline-block; margin-top:52px; background:{GOLD}; color:{INK}; font-weight:800; font-size:42px; padding:20px 38px; border-radius:999px; opacity:0">lompoclocals.com/find/dinner</span>
        <span id="{cid}-t2" style="display:block; margin-top:34px; color:rgba(255,255,255,0.85); font-weight:600; font-size:31px; letter-spacing:1px; opacity:0">Every local kitchen · hours · phone · tonight's deals</span>
      </div>'''
        js = (f'tl.fromTo("#{cid}-t1", {{ autoAlpha:0, y:22, scale:1.06 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"expo.out" }}, 0.22);'
              f'tl.fromTo("#{cid}-pill", {{ autoAlpha:0, y:16, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.4)" }}, 1.55);'
              f'tl.fromTo("#{cid}-t2", {{ autoAlpha:0, y:12 }}, {{ autoAlpha:1, y:0, duration:0.4 }}, 2.45);')
        return wrap(cid, dur, inner, js)
    raise ValueError(cid)

def subs_scene():
    cid = "subs"
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    subs_js = ",\n          ".join(f"[{a:.2f}, {b:.2f}, {t!r}]" for a, b, t in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position:absolute; left:60px; right:60px; bottom:310px; z-index:70; display:flex; justify-content:center; }}
      [data-composition-id="{cid}"] .sub {{ position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:center; opacity:0; will-change:opacity, transform; }}
      [data-composition-id="{cid}"] .sub span {{ display:inline-block; max-width:920px; background:rgba(0,0,0,0.66); color:#fff; font-weight:600; font-size:42px; line-height:1.25; padding:14px 28px; border-radius:20px; text-align:center; }}
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
          tl.fromTo("#sub-" + i, {{ autoAlpha:0, y:10 }}, {{ autoAlpha:1, y:0, duration:0.14, ease:"power2.out" }}, a);
          tl.to("#sub-" + i, {{ autoAlpha:0, duration:0.12, ease:"power1.in" }}, b - 0.12);
        }});
        tl.set({{}}, {{}}, {TOTAL:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def progress_scene():
    cid = "progress"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>
      [data-composition-id="{cid}"] .bar {{ position:absolute; left:0; right:0; bottom:0; height:8px; background:{GOLD}; transform-origin:0% 50%; transform:scaleX(0); z-index:70; box-shadow:0 0 12px rgba(239,198,24,0.6); }}
    </style>
    <div class="bar" id="prog-bar"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused: true }});
        tl.fromTo("#prog-bar", {{ scaleX:0 }}, {{ scaleX:1, duration:{TOTAL:.2f}, ease:"none" }}, 0);
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''

def index_html(with_audio=True):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    n = len(SCENES)
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="compositions/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="compositions/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+2}"></div>')
    a0 = n + 3
    audio = ""
    if with_audio:
        bed_auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.5, "v": 0.24}, {"t": %.2f, "v": 0.24}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.3, TOTAL)
        audio = f'''
      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="{a0}" data-volume="0.74" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{a0+1}" data-volume="0.24" data-fade-in="0.5" data-fade-out="1.3" data-automation='{bed_auto}' data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.55}}'></audio>
      <audio id="sfx-1" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="10.50" data-media-start="0" data-duration="1.20" data-track-index="{a0+2}" data-volume="0.22" data-fade-out="0.3"></audio>
      <audio id="sfx-2" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="15.50" data-media-start="0" data-duration="1.20" data-track-index="{a0+2}" data-volume="0.26" data-fade-out="0.3"></audio>'''
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      @font-face {{ font-family:"Plus Jakarta Sans"; src:url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight:200 800; font-style:normal; }}
      html, body {{ margin:0; width:1080px; height:1920px; overflow:hidden; background:{INK}; }}
      body {{ font-family:"Plus Jakarta Sans", sans-serif; }}
      #root {{ position:relative; width:1080px; height:1920px; overflow:hidden; }}
      #root > div[data-composition-src] {{ position:absolute; inset:0; }}
    </style>
  </head>
  <body>
    <!-- THE LOMPOC LUNCH BOARD — Fri Sep 18 2026. Split-flap board of every local kitchen open
         through the midday hour; members first with their own photos and real Friday hours.
         {TOTAL:.2f}s. Own assets only. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="1920">
{chr(10).join(rows)}
{audio}
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

os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)
for cid, start, dur in SCENES:
    write(f"compositions/{cid}.html", scene_html(cid, dur))
write("compositions/subs.html", subs_scene())
write("compositions/progress.html", progress_scene())
write("index.html", index_html(with_audio=os.path.exists(os.path.join(HERE, "public", "bed.wav"))))
print("wrote", [s[0] for s in SCENES], "+ subs, progress, index.html (audio=%s)" % os.path.exists(os.path.join(HERE, "public", "bed.wav")))
