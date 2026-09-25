"""THE NUMBER — 15 seconds for owners. A counter ticks up to this month's page
views, flashing a real member photo every few thousand, slams, then asks.

    python3 _kit/make.py number-ad --data @out/number/story.json --out out/number

Data: slug, assets, n (the figure), photos [asset keys], line, ask, url.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Video
from .member_spotlight import _media_src
from .master_story import FIELD

BLACK, COUNT, SLAM, ASK = 1.0, 9.0, 2.6, 2.8
FLASH = 0.067   # two frames at 30 fps


def _css(cid, size):
    g = B.geom(size); s = f'[data-composition-id="{cid}"]'; tall = g["h"] > 1400
    return f"""
      {s} .mark {{ display:none }}
      {s} .black {{ position:absolute; inset:0; background:#07040a; }}
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .num {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"38%" if tall else "30%"}; z-index:36; text-align:center;
        color:{B.GOLD}; font-weight:800; font-size:{230 if tall else 170}px; line-height:1; letter-spacing:-8px; font-variant-numeric:tabular-nums;
        text-shadow:0 10px 40px rgba(0,0,0,0.5); }}
      {s} .line {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"53%" if tall else "48%"}; z-index:36; text-align:center;
        color:#fff; font-weight:800; font-size:{56 if tall else 44}px; line-height:1.1; letter-spacing:-1.5px; }}
      {s} .ask {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"36%" if tall else "28%"}; z-index:36; text-align:center;
        color:#fff; font-weight:800; font-size:{110 if tall else 80}px; line-height:1.0; letter-spacing:-4px; }}
      {s} .flash {{ position:absolute; inset:0; z-index:34; opacity:0; object-fit:cover; width:100%; height:100%; filter:brightness(0.95); }}
    """


def build(d):
    assets = dict(d.get("assets") or {}); n = int(d["n"]); photos = d.get("photos", [])
    scenes = []
    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    # s0 — black, one tick
    scenes.append(Scene("s0-black", 0.0, BLACK, styled(lambda cid, dur, size: '<div class="black"></div>'), lambda cid, dur: ""))

    # s1 — the counter, with photo flashes
    def count_html(cid, dur, size):
        imgs = "".join(f'<img id="{cid}-f{i}" class="flash" src="{_media_src(assets, k)[0]}" alt="" />' for i, k in enumerate(photos))
        return f'<div class="black"></div>{imgs}<div class="num" id="{cid}-n">0</div>'
    def count_js(cid, dur, size=None):
        out = (f'const o_{cid.replace("-", "_")} = {{ v: 0 }}; const el_{cid.replace("-", "_")} = document.getElementById("{cid}-n");'
               f'tl.to(o_{cid.replace("-", "_")}, {{ v:{n}, duration:{dur - 0.2:.2f}, ease:"power2.in", onUpdate: () => {{ el_{cid.replace("-", "_")}.textContent = Math.floor(o_{cid.replace("-", "_")}.v).toLocaleString("en-US"); }} }}, 0.1);'
               f'tl.set("#{cid}-n", {{ textContent: "{n:,}" }}, {dur - 0.05:.2f});')
        for i in range(len(photos)):
            u = (i + 1) / (len(photos) + 1)
            t = 0.4 + (dur - 0.8) * (1 - (1 - u) ** 1.8)      # flashes bunch up as the count accelerates
            out += f'tl.set("#{cid}-f{i}", {{ opacity:1 }}, {t:.3f}); tl.set("#{cid}-f{i}", {{ opacity:0 }}, {t + FLASH:.3f});'
        return out
    scenes.append(Scene("s1-count", 0.0, COUNT, styled(count_html), count_js))

    # s2 — the slam
    def slam_html(cid, dur, size):
        # Same vertical position as the counter so the crossfade lands the figure on itself.
        return f'<div class="field"></div><div class="num" id="{cid}-n">{n:,}</div><div class="line" id="{cid}-l" style="opacity:0">{d["line"]}</div>'
    def slam_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-n", {{ scale:1.35 }}, {{ scale:1, duration:0.35, ease:"expo.out", transformOrigin:"50% 50%" }}, 0);'
                + S.rise(cid, "l", 0.45, dy=16, dur=0.4))
    scenes.append(Scene("s2-slam", 0.0, SLAM, styled(slam_html), slam_js))

    # s3 — the ask
    def ask_html(cid, dur, size):
        return f'<div class="field"></div><div class="ask" id="{cid}-a" style="opacity:0">{d["ask"]}</div><div class="line" id="{cid}-u" style="top:52%; opacity:0"><span class="pill">{d["url"]}</span></div>'
    def ask_js(cid, dur, size=None):
        return S.pop(cid, "a", 0.1, scale=1.2, dur=0.4) + f'tl.fromTo("#{cid}-u", {{ autoAlpha:0, y:18 }}, {{ autoAlpha:1, y:0, duration:0.45, ease:"back.out(1.5)" }}, 0.75);'
    scenes.append(Scene("s3-ask", 0.0, ASK, styled(ask_html), ask_js))

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "THE NUMBER"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=[], vo_lines=[], assets=assets,
                 audio=[Audio("public/bed.wav", "music", 0.0, total, volume=0.5, fade_in=0.2, fade_out=0.8),
                        Audio("public/sfx.wav", "sfx", 0.0, total, volume=0.9)],
                 note="The figure and the photos come from the database; re-cut monthly.")
