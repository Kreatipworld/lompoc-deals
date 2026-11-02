"""DISCOVER WHAT'S IN TOWN — a Sunday tour of members, one need at a time.

Built Nov 1 2026 for the businesses that paid in the last two weeks: "more like
discover what's in town", not a thank-you. Nothing on screen says anyone paid.
Each stop is the need ("Hungry?"), the member's own photo, their logo and name,
and a pin that moves one stop down the route across the top.

    python3 _kit/make.py discover-town --data @town.json --out out/<project> --vo out/<project>/public

Data contract:
    slug, title
    cover  {top, bottom, tiles: [k x6], say}
    stops  [{name, need, what, say, photo?, pos?, move?, logo?, card?}]
        card "logo":  logo fills a card in the member's colours (`colors` [a, b])
        card "neon":  designed lettering, no photo (`word`, `chips`)
    end    {title, url, say}
    assets staged filename -> path
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

MOVES = {
    "in": ("scale:1.0", "scale:1.13"),
    "out": ("scale:1.16", "scale:1.02"),
    "left": ("scale:1.14, xPercent:3.5", "scale:1.14, xPercent:-3.5"),
    "right": ("scale:1.14, xPercent:-3.5", "scale:1.14, xPercent:3.5"),
    "up": ("scale:1.14, yPercent:3", "scale:1.14, yPercent:-3"),
    "down": ("scale:1.14, yPercent:-3", "scale:1.14, yPercent:3"),
}


def build(d: dict) -> Video:
    assets = dict(d.get("assets") or {})
    stops = d["stops"]
    scenes, subs = [], []

    def src(k):
        return _media_src(assets, k)[0]

    def css(cid):
        s = f'[data-composition-id="{cid}"]'
        return f"""<style>
          @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces.ttf") format("truetype"); font-weight:100 900; }}
          {s} .vig, {s} .mark {{ display:none; }}
          {s} .grain {{ opacity:0.05; }}
          {s} .bg {{ position:absolute; inset:0; overflow:hidden; background:{B.INK}; }}
          {s} .bg img {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .shade {{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(20,8,26,0.82) 0%, rgba(20,8,26,0.25) 24%, rgba(20,8,26,0) 42%, rgba(20,8,26,0.45) 56%, rgba(20,8,26,0.9) 72%, rgba(20,8,26,0.5) 88%, rgba(20,8,26,0.3) 100%); }}
          {s} .need {{ position:absolute; left:84px; right:84px; top:270px; font-family:"Fraunces",serif; font-weight:900; font-size:112px; line-height:0.95; letter-spacing:-3px; color:{B.GOLD}; text-shadow:0 8px 30px rgba(0,0,0,0.65); }}
          {s} .rail {{ position:absolute; left:84px; right:84px; top:206px; height:6px; background:rgba(255,255,255,0.35); border-radius:3px; }}
          {s} .dot {{ position:absolute; top:197px; width:24px; height:24px; margin-left:-12px; border-radius:50%; background:#fff; }}
          {s} .dot.on {{ background:{B.GOLD}; }}
          {s} .pin {{ position:absolute; top:150px; width:46px; height:60px; margin-left:-23px; background:{B.GOLD}; clip-path:polygon(50% 100%, 12% 56%, 0 34%, 8% 13%, 28% 1%, 50% 0, 72% 1%, 92% 13%, 100% 34%, 88% 56%); }}
          {s} .logo {{ position:absolute; left:84px; top:1020px; width:190px; height:190px; background:#fff; border-radius:30px; padding:16px; object-fit:contain; box-shadow:0 18px 40px rgba(0,0,0,0.45); }}
          {s} .name {{ position:absolute; left:84px; right:84px; top:1228px; font-family:"Fraunces",serif; font-weight:900; font-size:84px; line-height:0.98; letter-spacing:-2px; color:#fff; }}
          {s} .what {{ position:absolute; left:84px; right:84px; font-weight:800; font-size:42px; line-height:1.1; color:{B.GOLD}; }}
          {s} .big {{ position:absolute; left:70px; right:70px; text-align:center; font-family:"Fraunces",serif; font-weight:900; line-height:0.92; letter-spacing:-4px; color:#fff; text-shadow:0 10px 40px rgba(0,0,0,0.75); }}
          {s} .big em {{ font-style:normal; color:{B.GOLD}; }}
          {s} .tile {{ position:absolute; overflow:hidden; border-radius:26px; }}
          {s} .tile img {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .sq {{ position:absolute; width:196px; height:196px; background:#fff; border-radius:28px; display:flex; align-items:center; justify-content:center; text-align:center; box-shadow:0 14px 30px rgba(0,0,0,0.35); }}
          {s} .sq img {{ width:164px; height:164px; object-fit:contain; display:block; }}
          {s} .sq b {{ font-family:"Fraunces",serif; font-weight:900; font-size:44px; line-height:0.95; color:{B.PURPLE}; }}
          {s} .pill {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:52px; padding:24px 50px; border-radius:999px; }}
          {s} .chip {{ display:inline-block; font-weight:800; font-size:44px; color:#fff; padding:16px 30px; border:4px solid #33e0ff; border-radius:999px; margin:0 16px 18px 0; box-shadow:0 0 22px rgba(51,224,255,0.5); }}
          {s} .neon {{ position:absolute; left:0; right:0; text-align:center; font-family:"Fraunces",serif; font-weight:900; color:#d9fbff; text-shadow:0 0 14px #33e0ff, 0 0 44px #33e0ff, 0 0 90px #1aa6ff; }}
        </style>"""

    def rail(cid, i):
        n = len(stops)
        at = lambda k: 84 + k * (912 / (n - 1))
        dots = "".join(f'<div class="dot{" on" if k < i else ""}" style="left:{at(k):.0f}px"></div>' for k in range(n))
        return (f'<div class="rail"></div>{dots}'
                f'<div class="pin" id="{cid}-pin" style="left:{at(i):.0f}px"></div>')

    def rail_js(cid, i):
        n = len(stops)
        step = 912 / (n - 1)
        return f'tl.fromTo("#{cid}-pin", {{ x:{-step if i else 0:.0f} }}, {{ x:0, duration:0.55, ease:"power2.inOut" }}, 0.1);'

    def add(cid, html, js, say):
        scenes.append(Scene(cid, 0.0, 2.5, lambda c, du, sz, h=html: css(c) + h(c, du, sz), js, lines=(len(subs),)))
        subs.append(Sub(0.0, 2.5, say, say=say))

    # ── cover: frame 0 is the thumbnail, fully composed
    c = d["cover"]
    def cover_html(cid, dur, size):
        pos = [(0, 0), (360, 0), (720, 0), (0, 640), (360, 640), (720, 640), (0, 1280), (360, 1280), (720, 1280)]
        tiles = "".join(f'<div class="tile" style="left:{x + 4}px; top:{y + 4}px; width:352px; height:632px; border-radius:18px"><img id="{cid}-t{k}" src="{src(c["tiles"][k])}" /></div>'
                        for k, (x, y) in enumerate(pos))
        return (f'<div class="bg">{tiles}</div><div style="position:absolute; inset:0; background:rgba(28,8,36,0.56)"></div>'
                f'<div class="big" id="{cid}-a" style="top:520px; font-size:150px">{c["top"]}</div>'
                f'<div class="big" id="{cid}-b" style="top:830px; font-size:190px"><em>{c["bottom"]}</em></div>')
    def cover_js(cid, dur, size=None):
        out = "".join(f'tl.fromTo("#{cid}-t{k}", {{ scale:1.0 }}, {{ scale:1.12, duration:{dur:.2f}, ease:"none" }}, 0);' for k in range(9))
        return out + f'tl.fromTo("#{cid}-b", {{ scale:1 }}, {{ scale:1.05, duration:0.35, yoyo:true, repeat:1, ease:"power2.out" }}, 0.5);'
    add("s0-cover", cover_html, cover_js, c["say"])

    for i, p in enumerate(stops):
        cid = f"s{i + 1}-stop"
        kind = p.get("card")

        if kind == "logo":
            def html(cid, dur, size, p=p, i=i):
                a, b = p["colors"]
                return (f'<div class="bg" style="background:radial-gradient(ellipse 90% 60% at 50% 42%, {a} 0%, {b} 100%)"></div>'
                        f'<div class="tile" id="{cid}-lg" style="left:190px; top:520px; width:700px; height:560px; background:#fff; border-radius:40px; box-shadow:0 30px 70px rgba(0,0,0,0.5)"><img src="{src(p["logo"])}" style="object-fit:contain; padding:30px; box-sizing:border-box" /></div>'
                        f'<div class="need" id="{cid}-n">{p["need"]}</div>' + rail(cid, i)
                        + f'<div class="name" id="{cid}-m" style="top:1140px; text-align:center">{p["name"]}</div>'
                        f'<div class="what" id="{cid}-w" style="top:1340px; text-align:center">{p["what"]}</div>')
            def js(cid, dur, size=None, i=i):
                return (rail_js(cid, i) + S.pop(cid, "n", 0.08, scale=1.3)
                        + f'tl.fromTo("#{cid}-lg", {{ autoAlpha:0, scale:0.7, rotation:-5 }}, {{ autoAlpha:1, scale:1, rotation:0, duration:0.55, ease:"back.out(1.6)" }}, 0.2);'
                        + S.rise(cid, "m", 0.4, dy=30) + S.rise(cid, "w", 0.6))
        elif kind == "neon":
            def html(cid, dur, size, p=p, i=i):
                chips = "".join(f'<span class="chip">{x}</span>' for x in p["chips"])
                return (f'<div class="bg" style="background:radial-gradient(ellipse 80% 45% at 50% 42%, #173a63 0%, #0b1020 62%, #05060c 100%)"></div>'
                        f'<div class="need" id="{cid}-n">{p["need"]}</div>' + rail(cid, i)
                        + f'<div class="neon" id="{cid}-w" style="top:560px; font-size:290px; letter-spacing:-6px">{p["word"]}</div>'
                        f'<div id="{cid}-c" style="position:absolute; left:84px; right:84px; top:880px; text-align:center">{chips}</div>'
                        f'<div class="name" id="{cid}-m" style="top:1180px; text-align:center">{p["name"]}</div>'
                        f'<div class="what" id="{cid}-a" style="top:1290px; text-align:center">{p["what"]}</div>')
            def js(cid, dur, size=None, i=i):
                return (rail_js(cid, i) + S.pop(cid, "n", 0.08, scale=1.3)
                        + f'tl.fromTo("#{cid}-w", {{ autoAlpha:0.1 }}, {{ autoAlpha:1, duration:0.08, repeat:6, yoyo:true }}, 0.2);'
                        + S.rise(cid, "c", 0.65, dy=24) + S.rise(cid, "m", 0.8, dy=24) + S.rise(cid, "a", 0.95))
        else:
            def html(cid, dur, size, p=p, i=i):
                pos = p.get("pos", "50% 50%")
                logo = f'<img class="logo" id="{cid}-lg" src="{src(p["logo"])}" />' if p.get("logo") else ""
                return (f'<div class="bg"><img id="{cid}-im" src="{src(p["photo"])}" style="object-position:{pos}" /></div><div class="shade"></div>'
                        f'<div class="need" id="{cid}-n">{p["need"]}</div>' + rail(cid, i) + logo
                        + f'<div class="name" id="{cid}-m">{p["name"]}</div>'
                        f'<div class="what" id="{cid}-w" style="top:{1228 + 84 * p.get("rows", 1) + 22}px">{p["what"]}</div>')
            def js(cid, dur, size=None, p=p, i=i):
                a, b = MOVES[p.get("move", "in")]
                return (rail_js(cid, i)
                        + f'tl.fromTo("#{cid}-im", {{ {a} }}, {{ {b}, duration:{dur:.2f}, ease:"none" }}, 0);'
                        + S.pop(cid, "n", 0.08, scale=1.3)
                        + (S.pop(cid, "lg", 0.25, scale=1.3) if p.get("logo") else "")
                        + S.rise(cid, "m", 0.32, dy=30) + S.rise(cid, "w", 0.5))
        add(cid, html, js, p["say"])

    e = d["end"]
    def end_html(cid, dur, size):
        rows, y, k, out = [4, 5, 4], 400, 0, ""
        for n in rows:
            width = n * 196 + (n - 1) * 14
            x0 = (1080 - width) / 2
            for j in range(n):
                p = stops[k]
                inner = f'<img src="{src(p["logo"])}" />' if p.get("logo") else f'<b>{p.get("short", p["name"])}</b>'
                out += f'<div class="sq" id="{cid}-q{k}" style="left:{x0 + j * 210:.0f}px; top:{y}px">{inner}</div>'
                k += 1
            y += 214
        return (f'<div class="bg" style="background:radial-gradient(ellipse 90% 60% at 50% 42%, {B.PURPLE} 0%, #2c0636 100%)"></div>'
                f'<div class="big" id="{cid}-t" style="top:210px; font-size:124px; letter-spacing:-3px">{e["title"]}</div>' + out
                + f'<div id="{cid}-u" style="position:absolute; left:0; right:0; top:1110px; text-align:center"><span class="pill">{e["url"]}</span></div>')
    def end_js(cid, dur, size=None):
        out = S.pop(cid, "t", 0.1, scale=1.3, dur=0.5)
        for k in range(len(stops)):
            out += S.pop(cid, f"q{k}", 0.3 + 0.06 * k, scale=1.4, dur=0.32)
        return out + S.pop(cid, "u", 1.3, scale=1.15, dur=0.4)
    add(f"s{len(stops) + 1}-end", end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "DISCOVER WHAT'S IN TOWN"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.16, fade_in=0.1, fade_out=1.2)],
                 note="Member tour: their own photos and logos, no mention of payment, no alcohol on screen.")
