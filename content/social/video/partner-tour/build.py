"""Write the partner-tour HyperFrames project: six full-bleed beats of the live site.

Framing is expressed as the window of the page you want on screen, in the page's
own CSS pixels, and converted to a `translate(...) scale(...)` with origin 0 0.
That way a beat says "show the hero band" instead of "scale 1.98 about 12%".
"""
import os

P = os.path.dirname(os.path.abspath(__file__))
W, H = 1920, 1080
X = 0.26                      # crossfade
PURPLE, GOLD, INK = "#650c75", "#efc618", "#140a17"


def frame(x0, y0, s):
    """Window whose top-left is (x0,y0) at zoom s -> the transform that shows it."""
    return (round(-x0 * s, 1), round(-y0 * s, 1), round(s, 4))


def centered(y0, s):
    """Same, horizontally centred on the 1920-wide page."""
    return frame(960 - 960 / s, y0, s)


SCENES = [
    ("s1-home",   0.00, 4.91),
    ("s2-search", 4.65, 2.95),
    ("s3-deals",  7.34, 4.36),
    ("s4-member", 11.44, 4.64),
    ("s5-map",    15.82, 3.75),
    ("s6-claim",  19.31, 4.69),
]
TOTAL = 24.00

COMMON = """
      [data-composition-id="{cid}"] .stage {{ position:absolute; inset:0; opacity:0; will-change:opacity; }}
      [data-composition-id="{cid}"] .shotwrap {{ position:absolute; inset:0; overflow:hidden; background:{ink}; }}
      [data-composition-id="{cid}"] .shot {{ position:absolute; left:0; top:0; width:{w}px; display:block;
        will-change:transform; transform-origin:0 0; image-rendering:auto; }}
      [data-composition-id="{cid}"] .vig {{ position:absolute; inset:0; z-index:30; pointer-events:none;
        background:radial-gradient(ellipse 98% 94% at 50% 46%, rgba(10,6,12,0) 70%, rgba(10,6,12,0.26) 100%); }}
"""


def wrap(cid, dur, inner, js, first=False):
    fade = (f'tl.set("#{cid}-stage", {{ autoAlpha:1 }}, 0);' if first else
            f'tl.fromTo("#{cid}-stage", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:{X}, ease:"power1.inOut" }}, 0);')
    stage_style = ' style="opacity:1"' if first else ""
    bg = INK if first else "transparent"
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{W}" data-height="{H}" data-duration="{dur:.2f}"
       style="position:absolute; inset:0; overflow:hidden; background:{bg}">
    <style>{COMMON.format(cid=cid, w=W, ink=INK)}</style>
    <div class="stage" id="{cid}-stage"{stage_style}>
{inner}
      <div class="vig"></div>
    </div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused:true }});
        {fade}
{js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def move(cid, src, a, b, dur, ease="power1.inOut", first=False):
    """One beat: a screenshot travelling from window `a` to window `b`.

    The travel is held still for one crossfade at each end. Two layers dissolving
    while both are moving smears the type into a double exposure; frozen on both
    sides, the dissolve is clean and an s1->s2 pair that shares a frame reads as
    a match cut rather than a fade.
    """
    ax, ay, asc = a
    bx, by, bsc = b
    at = 0.0 if first else X
    span = round(dur - X - at, 2)
    inner = (f'      <div class="shotwrap"><img class="shot" id="{cid}-img" data-layout-allow-overflow '
             f'src="{src}" style="transform:translate({ax}px,{ay}px) scale({asc});" /></div>')
    js = (f'        tl.fromTo("#{cid}-img", {{ x:{ax}, y:{ay}, scale:{asc} }}, '
          f'{{ x:{bx}, y:{by}, scale:{bsc}, duration:{span:.2f}, ease:"{ease}" }}, {at});')
    return inner, js


# ── s1 home — opens on the hero band alone (frame 0 is the poster), eases out to
#    the full page so the live nav and the members rail come into view.
i, j = move("s1-home", "public/home.jpg", centered(65, 1.9817), centered(0, 1.45), 4.91, "power1.out", first=True)
s1 = wrap("s1-home", 4.91, i, j, first=True)

# ── s2 search — starts on exactly the frame s1 ended on, so the dissolve reads as
#    the dropdown opening, then pulls back over the real results.
i, j = move("s2-search", "public/search.jpg", centered(0, 1.45), centered(55, 1.20), 2.95, "power1.out")
s2 = wrap("s2-search", 2.95, i, j)

# ── s3 deals — the live count in the header, then a drift down into the grid.
i, j = move("s3-deals", "public/deals.jpg", centered(0, 1.0), centered(430, 1.05), 4.36)
s3 = wrap("s3-deals", 4.36, i, j)

# ── s4 member page — their gallery down to their card: badge, logo, address.
i, j = move("s4-member", "public/biz.jpg", centered(0, 1.0), centered(520, 1.04), 4.64)
s4 = wrap("s4-member", 4.64, i, j)

# ── s5 map — a slow push into the downtown pin cluster, framed inside the map
#    canvas so the half-cut sidebar rows never show. Mapbox/OSM credit stays in frame.
i, j = move("s5-map", "public/map.jpg", frame(520, 280, 1.41), frame(620, 378, 1.62), 3.75, "none")
s5 = wrap("s5-map", 3.75, i, j)

# ── s6 end card ───────────────────────────────────────────────────────────────
s6_inner = f'''      <div style="position:absolute; inset:0; background:
        radial-gradient(ellipse 120% 90% at 22% 12%, #7d1b8f 0%, rgba(125,27,143,0) 62%),
        radial-gradient(ellipse 110% 100% at 88% 96%, #3d0747 0%, rgba(61,7,71,0) 60%),
        linear-gradient(160deg, {PURPLE} 0%, #34073d 58%, {INK} 100%);"></div>
      <div id="s6-glow" style="position:absolute; left:50%; top:52%; width:1500px; height:1500px; margin:-750px 0 0 -750px;
        background:radial-gradient(circle, rgba(239,198,24,0.15) 0%, rgba(239,198,24,0) 62%); z-index:2;"></div>
      <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
        justify-content:center; z-index:10; text-align:center; padding:0 140px;">
        <img id="s6-mark" src="public/mark-white.png" style="width:104px; height:auto; margin-bottom:44px;" />
        <div id="s6-h" style="color:#fff; font-weight:800; font-size:88px; line-height:1.04; letter-spacing:-3px;">
          Your business, where<br /><span style="color:{GOLD}; font-style:italic;">Lompoc is already looking.</span>
        </div>
        <div id="s6-p" style="margin-top:34px; color:rgba(255,255,255,0.78); font-size:34px; font-weight:500;">
          3-minute setup · Cancel anytime
        </div>
        <div id="s6-cta" style="margin-top:52px; display:inline-block; background:{GOLD}; color:{INK};
          font-weight:800; font-size:40px; padding:24px 52px; border-radius:999px; letter-spacing:-0.5px;">
          lompoclocals.com/partners
        </div>
      </div>'''
s6_js = '''        tl.fromTo("#s6-mark", { autoAlpha:0, y:26 }, { autoAlpha:1, y:0, duration:0.55, ease:"power2.out" }, 0.10);
        tl.fromTo("#s6-h",    { autoAlpha:0, y:34 }, { autoAlpha:1, y:0, duration:0.62, ease:"power2.out" }, 0.24);
        tl.fromTo("#s6-p",    { autoAlpha:0, y:22 }, { autoAlpha:1, y:0, duration:0.55, ease:"power2.out" }, 0.46);
        tl.fromTo("#s6-cta",  { autoAlpha:0, y:26, scale:0.96 }, { autoAlpha:1, y:0, scale:1, duration:0.62, ease:"back.out(1.6)" }, 0.62);
        tl.fromTo("#s6-glow", { scale:0.86 }, { scale:1.12, duration:4.69, ease:"none" }, 0);'''
s6 = wrap("s6-claim", 4.69, s6_inner, s6_js)

os.makedirs(f"{P}/compositions", exist_ok=True)
for name, html in [("s1-home", s1), ("s2-search", s2), ("s3-deals", s3),
                   ("s4-member", s4), ("s5-map", s5), ("s6-claim", s6)]:
    open(f"{P}/compositions/{name}.html", "w").write(html)

rows = "\n".join(
    f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html"\n'
    f'           data-start="{st:.2f}" data-duration="{du:.2f}" data-track-index="{i+1}"></div>'
    for i, (cid, st, du) in enumerate(SCENES))

n = len(SCENES) + 1
audio_tags = (
    f'      <audio id="a-vo" class="clip" data-audio-group="voiceover" src="public/vo.wav"\n'
    f'             data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n}"\n'
    f'             data-volume="0.90" data-fade-in="0.05" data-fade-out="0.25"></audio>\n'
    f'      <audio id="a-bed" class="clip" data-audio-group="music" src="public/bed.wav"\n'
    f'             data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="{n+1}"\n'
    f'             data-volume="0.24" data-fade-in="0.6" data-fade-out="1.4"\n'
    f"             data-fx-carve='{{\"enabled\":true,\"sources\":[\"voiceover\"],\"strength\":0.60}}'></audio>")

index = f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      @font-face {{
        font-family: "Plus Jakarta Sans";
        src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2");
        font-weight: 200 800; font-style: normal;
      }}
      html, body {{ margin:0; width:{W}px; height:{H}px; overflow:hidden; background:{INK}; }}
      body {{ font-family:"Plus Jakarta Sans", sans-serif; }}
      #root {{ position:relative; width:{W}px; height:{H}px; overflow:hidden; }}
      #root > div[data-composition-src] {{ position:absolute; inset:0; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}"
         data-width="{W}" data-height="{H}">
{rows}

{audio_tags}
    </div>

    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''
open(f"{P}/index.html", "w").write(index)
print("wrote", P, "total", TOTAL)
