#!/usr/bin/env python3
"""3,000 FOLLOWERS ON INSTAGRAM — thank you, Lompoc. Sat Sep 20 2026. 15.2 s, 9:16.

SILENT by design: Higgsfield's token is expired, so there is no voice and no bed yet.
index_html() drops the <audio> block in automatically the moment public/bed.wav exists,
so the piece can be re-rendered with sound later without touching the scenes.

Only our own media: member photos, Huyck, River Bend, a Vandenberg launch, Toro Loco,
and our own generated Big Game night-stadium clip.

Frame 0 is the finished poster: a dimmed 15-photo Lompoc mosaic under a giant gold 3,000,
"OF YOU", the @lompoclocals Instagram pill and "Thank you, Lompoc."

  python3 gen.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

X = 0.22
SCENES = [
    # id,          start,  dur
    ("s1-count",    0.00,  4.40),   # mosaic + 3,000 count-up  (frame 0 poster)
    ("s2-every",    4.20,  5.40),   # 4 cuts: business / Friday night / launch / taco
    ("s3-town",     9.40,  2.60),   # River Bend soccer · "This town showed up."
    ("s4-end",     11.80,  8.60),   # Thank you, Lompoc. → the ask: awareness, together
]
TOTAL = 20.40

# burned-in captions — they carry the whole message, there is no voice track
# With a voice track the display type already carries "Every business…", "This town showed
# up." and "Thank you, Lompoc." — captioning those again would print the same words twice on
# the same frame. Only the opening sentence, which the screen states as "3,000 / OF YOU",
# needs a caption for sound-off viewers.
SUBS = [
    (0.55, 4.35, "Three thousand of you follow Lompoc Locals on Instagram."),
]

GOLD = "#efc618"; INK = "#241629"; PURPLE = "#650c75"; GREEN = "#0b992f"
BG = "#140a17"; CREAM = "#f2ead9"

# 15-cell mosaic, 3 across — every one of these is ours
MOSAIC = [
    ("m-clark-builders-inc.jpg", "50% 50%"), ("huyck-goalposts.jpg", "50% 45%"), ("tacos.jpg", "50% 50%"),
    ("launch.jpg", "50% 60%"), ("m-the-garden-shoppe.jpg", "50% 50%"), ("riverbend.jpg", "50% 45%"),
    ("sweet.jpg", "50% 50%"), ("enchiladas.jpg", "50% 50%"), ("m-coastal-tint.jpg", "50% 50%"),
    ("beach.jpg", "50% 50%"), ("hangar.jpg", "50% 50%"), ("plume.jpg", "50% 50%"),
    ("m-hangar-7-social-house.jpg", "50% 50%"), ("breakfast.jpg", "50% 50%"), ("civic.jpg", "50% 45%"),
]

IG_GLYPH = ('<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-8px; margin-right:14px" aria-hidden="true">'
            '<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4"></rect>'
            '<circle cx="12" cy="12" r="4.2"></circle>'
            '<circle cx="17.4" cy="6.6" r="1.25" fill="#fff" stroke="none"></circle></svg>')


def css(cid):
    return f"""
      [data-composition-id="{cid}"] .stage {{ position:absolute; inset:0; opacity:0; will-change:opacity; }}
      [data-composition-id="{cid}"] .vig {{ position:absolute; inset:0; z-index:30; pointer-events:none; background:radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 60%, rgba(10,6,12,0.55) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position:absolute; inset:0; pointer-events:none; opacity:0.08; z-index:50; background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E"); }}
      [data-composition-id="{cid}"] .mark {{ position:absolute; top:150px; right:84px; width:96px; height:auto; z-index:44; }}
      [data-composition-id="{cid}"] video {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }}
      [data-composition-id="{cid}"] .cover {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }}
      [data-composition-id="{cid}"] .wrap {{ position:absolute; inset:0; overflow:hidden; transform-origin:50% 50%; will-change:transform; }}
      [data-composition-id="{cid}"] .scrim {{ position:absolute; inset:0; z-index:31; pointer-events:none; background:linear-gradient(to top, rgba(20,10,23,0.95) 0%, rgba(20,10,23,0.66) 34%, rgba(20,10,23,0.10) 66%); }}
      [data-composition-id="{cid}"] .topscrim {{ position:absolute; inset:0; z-index:31; pointer-events:none; background:linear-gradient(to bottom, rgba(20,10,23,0.72) 0%, rgba(20,10,23,0.24) 20%, rgba(20,10,23,0) 38%); }}
      [data-composition-id="{cid}"] .word {{ display:block; color:#fff; font-weight:800; font-size:126px; line-height:0.96; letter-spacing:-5px; text-shadow:0 8px 38px rgba(10,6,12,0.8); opacity:0; will-change:transform, opacity; }}
      [data-composition-id="{cid}"] .pill {{ display:inline-block; background:rgba(0,0,0,0.58); border:2px solid rgba(255,255,255,0.26); color:#fff; font-weight:700; font-size:38px; letter-spacing:0.5px; padding:16px 34px; border-radius:999px; }}
    """


def wrap(cid, dur, inner, js, first=False):
    fade = (f'tl.set("#{cid}-stage", {{ autoAlpha:1 }}, 0);' if first
            else f'tl.fromTo("#{cid}-stage", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:{X}, ease:"power1.inOut" }}, 0);')
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{dur:.2f}" style="position:absolute; inset:0; overflow:hidden; background:{BG if first else 'transparent'}">
    <style>{css(cid)}
    </style>
    <div class="stage" id="{cid}-stage"{' style="opacity:1"' if first else ''}>
      {inner}
      <div class="vig"></div>
    </div>
    <img class="mark" src="public/mark-white.png" alt="" />
    <div class="grain"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused:true, defaults:{{ ease:"power4.out", duration:0.45 }} }});
        {fade}
        {js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def mosaic_html():
    cells = "".join(
        f'\n        <img src="public/{f}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:{p}; display:block" />'
        for f, p in MOSAIC)
    return f'''<div class="wrap" id="s1-mos" data-layout-allow-overflow>
        <div style="position:absolute; inset:0; display:grid; grid-template-columns:repeat(3, 1fr); grid-template-rows:repeat(5, 1fr); gap:4px; filter:brightness(0.52) saturate(0.82) contrast(1.06)">{cells}
        </div>
      </div>
      <div style="position:absolute; inset:0; z-index:12; background:radial-gradient(ellipse 84% 58% at 50% 45%, rgba(101,12,117,0.80) 0%, rgba(38,6,46,0.86) 56%, rgba(14,5,18,0.94) 100%)"></div>'''


def scene_html(cid, dur):
    if cid == "s1-count":
        # FRAME 0 POSTER — mosaic + gold 3,000 + OF YOU + IG pill + Thank you, Lompoc.
        # The count-up resets to 0 at 0.85 and lands back on 3,000 at 2.05, so t=0 is already finished art.
        inner = f'''{mosaic_html()}
      <div style="position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); z-index:36; text-align:center; padding:0 36px" data-layout-allow-overlap>
        <span id="{cid}-pill" class="pill" style="margin-bottom:34px">{IG_GLYPH}Instagram · @lompoclocals</span>
        <span id="{cid}-num" data-layout-allow-overlap style="display:block; color:{GOLD}; font-weight:800; font-size:300px; line-height:0.94; letter-spacing:-12px; font-variant-numeric:tabular-nums; text-shadow:0 14px 64px rgba(10,6,12,0.8); will-change:transform, color">3,000</span>
        <span id="{cid}-of" style="display:block; margin-top:14px; color:#fff; font-weight:800; font-size:150px; line-height:1; letter-spacing:-3px; text-transform:uppercase; text-shadow:0 8px 34px rgba(10,6,12,0.7)">of you</span>
        <span id="{cid}-rule" style="display:block; width:190px; height:8px; margin:44px auto 0; border-radius:99px; background:{GREEN}"></span>
        <span id="{cid}-ty" style="display:block; margin-top:40px; color:{CREAM}; font-weight:700; font-size:58px; letter-spacing:-0.5px">Thank you, Lompoc.</span>
      </div>'''
        js = f'''tl.fromTo("#{cid}-mos", {{ scale:1.0 }}, {{ scale:1.07, duration:{dur:.2f}, ease:"none" }}, 0);
        {{ const o = {{ v:3000 }}; const el = document.querySelector("#{cid}-num");
          tl.set(o, {{ v:0 }}, 0.85);
          tl.set("#{cid}-num", {{ color:"#ffffff" }}, 0.85);
          tl.to(o, {{ v:3000, duration:1.20, ease:"power3.out", onUpdate: () => {{ el.textContent = Math.round(o.v).toLocaleString("en-US"); }} }}, 0.85); }}
        tl.to("#{cid}-num", {{ color:"{GOLD}", scale:1.03, duration:0.16, ease:"power2.out" }}, 2.05);
        tl.to("#{cid}-num", {{ scale:1.0, duration:0.40, ease:"back.out(2.2)" }}, 2.21);'''
        return wrap(cid, dur, inner, js, first=True)

    if cid == "s2-every":
        # four cuts, one line each · cuts at rel 0.00 / 1.35 / 2.70 / 4.05
        tilepos = "width:100%; height:100%; object-fit:cover; display:block"
        inner = f'''<div class="wrap" id="{cid}-c1" data-layout-allow-overflow>
        <div style="position:absolute; inset:0; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:6px; filter:brightness(0.66) saturate(1.02)">
          <img src="public/m-clark-builders-inc.jpg" alt="" style="{tilepos}" />
          <img src="public/m-hangar-7-social-house.jpg" alt="" style="{tilepos}" />
          <img src="public/m-the-garden-shoppe.jpg" alt="" style="{tilepos}" />
          <img src="public/m-coastal-tint.jpg" alt="" style="{tilepos}" />
        </div>
      </div>
      <div class="wrap" id="{cid}-c2" data-layout-allow-overflow style="opacity:0"><video id="{cid}-v2" class="clip" src="public/n2-brave-ready.mp4" data-start="1.35" data-media-start="0.40" data-duration="1.45" data-track-index="0" muted playsinline style="filter:brightness(0.86)"></video></div>
      <div class="wrap" id="{cid}-c3" data-layout-allow-overflow style="opacity:0"><img class="cover" src="public/launch.jpg" alt="" style="object-position:50% 58%; filter:brightness(0.92)" /></div>
      <div class="wrap" id="{cid}-c4" data-layout-allow-overflow style="opacity:0"><img class="cover" src="public/store.jpg" alt="" style="object-position:50% 52%; filter:brightness(0.86) saturate(1.06)" /></div>
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; top:210px; z-index:36"><span id="{cid}-tag" style="display:inline-block; background:{GOLD}; color:{INK}; font-weight:800; font-size:34px; letter-spacing:4px; padding:14px 28px; border-radius:10px; text-transform:uppercase; opacity:0">Thank you</span></div>
      <div style="position:absolute; left:84px; right:84px; bottom:30%; z-index:36; height:150px" data-layout-allow-overlap>
        <span class="word" id="{cid}-w1" style="position:absolute; left:0; bottom:0">Every business.</span>
        <span class="word" id="{cid}-w2" style="position:absolute; left:0; bottom:0">Every Friday night.</span>
        <span class="word" id="{cid}-w3" style="position:absolute; left:0; bottom:0">Every launch.</span>
        <span class="word" id="{cid}-w4" style="position:absolute; left:0; bottom:0">Every taco.</span>
      </div>'''
        js = f'''tl.set("#{cid}-c2", {{ autoAlpha:0 }}, 0);
        tl.set("#{cid}-c3", {{ autoAlpha:0, scale:1.08 }}, 0);
        tl.set("#{cid}-c4", {{ autoAlpha:0, scale:1.0 }}, 0);
        tl.fromTo("#{cid}-c1", {{ scale:1.0 }}, {{ scale:1.07, duration:1.50, ease:"none" }}, 0);
        tl.to("#{cid}-c1", {{ autoAlpha:0, duration:0.12 }}, 1.35);
        tl.to("#{cid}-c2", {{ autoAlpha:1, duration:0.12 }}, 1.35);
        tl.to("#{cid}-c2", {{ autoAlpha:0, duration:0.12 }}, 2.70);
        tl.to("#{cid}-c3", {{ scale:1.0, duration:1.45, ease:"none" }}, 2.70);
        tl.to("#{cid}-c3", {{ autoAlpha:1, duration:0.12 }}, 2.70);
        tl.to("#{cid}-c3", {{ autoAlpha:0, duration:0.12 }}, 4.05);
        tl.to("#{cid}-c4", {{ scale:1.08, duration:1.35, ease:"none" }}, 4.05);
        tl.to("#{cid}-c4", {{ autoAlpha:1, duration:0.12 }}, 4.05);
        tl.fromTo("#{cid}-tag", {{ autoAlpha:0, y:-12 }}, {{ autoAlpha:1, y:0, duration:0.35 }}, 0.18);
        tl.fromTo("#{cid}-w1", {{ autoAlpha:0, y:28, scale:1.08 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.34, ease:"expo.out" }}, 0.35);
        tl.to("#{cid}-w1", {{ autoAlpha:0, duration:0.12 }}, 1.32);
        tl.fromTo("#{cid}-w2", {{ autoAlpha:0, y:28, scale:1.08 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.34, ease:"expo.out" }}, 1.65);
        tl.to("#{cid}-w2", {{ autoAlpha:0, duration:0.12 }}, 2.66);
        tl.fromTo("#{cid}-w3", {{ autoAlpha:0, y:28, scale:1.08 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.34, ease:"expo.out" }}, 2.95);
        tl.to("#{cid}-w3", {{ autoAlpha:0, duration:0.12 }}, 4.00);
        tl.fromTo("#{cid}-w4", {{ autoAlpha:0, y:28, scale:1.08 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.34, ease:"expo.out" }}, 4.22);'''
        return wrap(cid, dur, inner, js)

    if cid == "s3-town":
        inner = f'''<div class="wrap" id="{cid}-w" data-layout-allow-overflow><img class="cover" src="public/riverbend.jpg" alt="" style="object-position:50% 42%; filter:brightness(0.72) saturate(1.02)" /></div>
      <div class="scrim"></div><div class="topscrim"></div>
      <div style="position:absolute; left:84px; right:84px; bottom:30%; z-index:36">
        <span class="word" id="{cid}-t1" style="font-size:132px">This town<br />showed up.</span>
      </div>'''
        js = (f'tl.fromTo("#{cid}-w", {{ scale:1.10 }}, {{ scale:1.0, duration:{dur:.2f}, ease:"none" }}, 0);'
              f'tl.fromTo("#{cid}-t1", {{ autoAlpha:0, y:30 }}, {{ autoAlpha:1, y:0, duration:0.45, ease:"expo.out" }}, 0.30);')
        return wrap(cid, dur, inner, js)

    if cid == "s4-end":
        inner = f'''<div style="position:absolute; inset:0; background:linear-gradient(170deg, {PURPLE} 0%, #38083f 52%, #17061c 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:29%; z-index:20; text-align:center; padding:0 70px">
        <span id="{cid}-rule" style="display:block; width:160px; height:8px; margin:0 auto; border-radius:99px; background:{GOLD}; opacity:0"></span>
        <div style="position:relative; height:300px; margin-top:52px">
          <span id="{cid}-t1" style="position:absolute; left:0; right:0; top:0; color:#fff; font-weight:800; font-size:122px; line-height:0.98; letter-spacing:-4px; opacity:0">Thank you,<br />Lompoc.</span>
          <span id="{cid}-a1" style="position:absolute; left:0; right:0; top:14px; color:#fff; font-weight:800; font-size:76px; line-height:1.06; letter-spacing:-2px; opacity:0">Let's keep bringing<br />awareness to Lompoc.</span>
          <span id="{cid}-a2" style="position:absolute; left:0; right:0; top:26px; color:{GOLD}; font-weight:800; font-size:86px; line-height:1.04; letter-spacing:-2.5px; opacity:0">Together we can<br />make some noise.</span>
        </div>
        <span id="{cid}-pill" style="display:inline-block; margin-top:64px; background:{GOLD}; color:{INK}; font-weight:800; font-size:48px; padding:22px 44px; border-radius:999px; opacity:0">lompoclocals.com</span>
        <span id="{cid}-t3" style="display:block; margin-top:34px; color:rgba(255,255,255,0.72); font-weight:600; font-size:34px; opacity:0">@lompoclocals</span>
      </div>'''
        js = (f'tl.fromTo("#{cid}-rule", {{ autoAlpha:0, scaleX:0.2 }}, {{ autoAlpha:1, scaleX:1, duration:0.40, ease:"expo.out" }}, 0.10);'
              f'tl.fromTo("#{cid}-t1", {{ autoAlpha:0, y:24, scale:1.05 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.48, ease:"expo.out" }}, 0.26);'
              f'tl.fromTo("#{cid}-pill", {{ autoAlpha:0, y:16, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.46, ease:"back.out(1.5)" }}, 0.95);'
              f'tl.fromTo("#{cid}-t3", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.32 }}, 1.45);'
              # the ask, timed to the closing read (abs 14.60 / 17.46 → scene-relative 2.80 / 5.66)
              f'tl.to("#{cid}-t1", {{ autoAlpha:0, duration:0.34, ease:"power2.in" }}, 2.42);'
              f'tl.fromTo("#{cid}-a1", {{ autoAlpha:0, y:18 }}, {{ autoAlpha:1, y:0, duration:0.42, ease:"expo.out" }}, 2.80);'
              f'tl.to("#{cid}-a1", {{ autoAlpha:0, duration:0.32, ease:"power2.in" }}, 5.26);'
              f'tl.fromTo("#{cid}-a2", {{ autoAlpha:0, y:18, scale:1.04 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.46, ease:"expo.out" }}, 5.62);')
        return wrap(cid, dur, inner, js)

    raise ValueError(cid)


def subs_scene():
    cid = "subs"
    items = "".join(f'\n      <div class="sub" id="sub-{i}"><span>{t}</span></div>' for i, (_, _, t) in enumerate(SUBS))
    js = ",\n          ".join(f"[{a:.2f}, {b:.2f}]" for a, b, _ in SUBS)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="1920" data-duration="{TOTAL:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position:absolute; left:60px; right:60px; bottom:310px; z-index:70; display:flex; justify-content:center; }}
      [data-composition-id="{cid}"] .sub {{ position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:center; opacity:0; }}
      [data-composition-id="{cid}"] .sub span {{ display:inline-block; max-width:920px; background:rgba(0,0,0,0.64); color:#fff; font-weight:600; font-size:42px; line-height:1.25; padding:14px 28px; border-radius:20px; text-align:center; }}
    </style>
    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>
    <script>
      (() => {{
        const S = [
          {js}
        ];
        const tl = gsap.timeline({{ paused:true }});
        S.forEach(([a,b], i) => {{
          tl.fromTo("#sub-"+i, {{ autoAlpha:0, y:10 }}, {{ autoAlpha:1, y:0, duration:0.12 }}, a);
          tl.to("#sub-"+i, {{ autoAlpha:0, duration:0.1 }}, b-0.1);
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
    <style>[data-composition-id="{cid}"] .bar {{ position:absolute; left:0; right:0; bottom:0; height:8px; background:{GOLD}; transform-origin:0% 50%; z-index:70; box-shadow:0 0 12px rgba(239,198,24,0.6); }}</style>
    <div class="bar" id="prog-bar"></div>
    <script>
      (() => {{ const tl = gsap.timeline({{paused:true}});
        tl.fromTo("#prog-bar", {{scaleX:0}}, {{scaleX:1, duration:{TOTAL:.2f}, ease:"none"}}, 0);
        window.__timelines["{cid}"] = tl; }})();
    </script>
  </div>
</template>
'''


def index_html():
    # SILENT until a bed lands in public/. Drop bed.wav (and vo.wav) in, re-run gen.py, re-render.
    has_audio = os.path.exists(os.path.join(HERE, "public", "bed.wav"))
    has_vo = os.path.exists(os.path.join(HERE, "public", "vo.wav"))
    rows = [f'      <div id="el-{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.2f}" data-duration="{d:.2f}" data-track-index="{i+1}"></div>'
            for i, (c, s, d) in enumerate(SCENES)]
    n = len(SCENES)
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="compositions/subs.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="compositions/progress.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+2}"></div>')
    a0 = n + 3
    audio = ""
    if has_audio:
        auto = '{"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": 0}, {"t": 0.5, "v": 0.30}, {"t": %.2f, "v": 0.30}, {"t": %.2f, "v": 0}]}]}' % (TOTAL - 1.3, TOTAL)
        vo = ''
        if has_vo:
            vo = f'''
      <audio id="vo" class="clip" data-audio-group="voiceover" src="public/vo.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{a0}" data-volume="0.78" data-fade-in="0.05" data-fade-out="0.12"></audio>'''
        carve = ' data-fx-carve=\'{"enabled":true,"sources":["voiceover"],"strength":0.55}\'' if has_vo else ''
        audio = f'''{vo}
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{a0+1}" data-volume="0.30" data-fade-in="0.5" data-fade-out="1.3" data-automation='{auto}'{carve}></audio>
      <audio id="sfx-1" class="clip" data-audio-group="sfx" src="public/whoosh.wav" data-start="4.20" data-media-start="0" data-duration="1.10" data-track-index="{a0+2}" data-volume="0.22" data-fade-out="0.3"></audio>
      <audio id="sfx-2" class="clip" data-audio-group="sfx" src="public/shield-hit.wav" data-start="11.80" data-media-start="0" data-duration="1.30" data-track-index="{a0+2}" data-volume="0.24" data-fade-out="0.4"></audio>'''
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      @font-face {{ font-family:"Plus Jakarta Sans"; src:url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight:200 800; font-style:normal; }}
      html, body {{ margin:0; width:1080px; height:1920px; overflow:hidden; background:{BG}; }}
      body {{ font-family:"Plus Jakarta Sans", sans-serif; }}
      #root {{ position:relative; width:1080px; height:1920px; overflow:hidden; }}
      #root > div[data-composition-src] {{ position:absolute; inset:0; }}
    </style>
  </head>
  <body>
    <!-- 3,000 FOLLOWERS ON INSTAGRAM — thank you, Lompoc. Sat Sep 20 2026. Our own media only.
         SILENT: no bed.wav / vo.wav yet (Higgsfield token expired). Drop them into public/ and
         re-run gen.py — the <audio> block below regenerates itself. Generated by gen.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="1920">
{chr(10).join(rows)}
{audio}
    </div>
    <script>window.__timelines["main"] = gsap.timeline({{ paused:true }});</script>
  </body>
</html>
'''


os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)
for c, s, d in SCENES:
    open(os.path.join(HERE, f"compositions/{c}.html"), "w").write(scene_html(c, d))
open(os.path.join(HERE, "compositions/subs.html"), "w").write(subs_scene())
open(os.path.join(HERE, "compositions/progress.html"), "w").write(progress_scene())
open(os.path.join(HERE, "index.html"), "w").write(index_html())
print("wrote", [s[0] for s in SCENES], "total", TOTAL,
      "audio=" + str(os.path.exists(os.path.join(HERE, "public", "bed.wav"))))
