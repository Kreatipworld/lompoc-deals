"""SUNDAY LUNCH — "what to eat" picks, on a cream menu page.

The feed had turned into one look: dark field, big yellow number, white headline
(owner, Sep 27 2026: "check our profile and change the look and feel"). This is
the opposite on purpose — daylight cream paper, each restaurant's own dish photo
framed like a print on a table, a serif name in brand purple and one green
"Get:" chip. No hours on screen (owner: "don't add the time, just
recommendations to eat").

    python3 _kit/make.py sunday-lunch --data @spots.json --out out/<project> --vo out/<project>/public

Data contract:

    slug     "sunday-lunch-2026-10-04"
    assets   staged public/ filename -> URL/local path (dish photos, fonts, logo)
    open     {say, title, sub, photos: [key, key, key]}
    spots    [ {name, dish, photo, area, say} ]   one scene per spot, in order
    end      {say, title, url, photos: [key, ...]}

Every dish named must be the one in that restaurant's own photo.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

PAPER = "#F6EFE3"
INKP = "#2a1630"


def _css(cid: str, size) -> str:
    s = f'[data-composition-id="{cid}"]'
    return f"""
      @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces.ttf") format("truetype"); font-weight:100 900; font-style:normal; }}
      @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces-Italic.ttf") format("truetype"); font-weight:100 900; font-style:italic; }}
      {s} .vig, {s} .mark {{ display:none; }}
      {s} .grain {{ opacity:0.05; }}
      {s} .paper {{ position:absolute; inset:0; background:{PAPER}; }}
      {s} .warm {{ position:absolute; inset:0; background:radial-gradient(80% 45% at 85% 0%, #fde2b8 0%, rgba(253,226,184,0) 62%), radial-gradient(70% 40% at 0% 100%, #e3f0d9 0%, rgba(227,240,217,0) 60%); }}
      {s} .kick {{ position:absolute; left:84px; font-weight:800; letter-spacing:10px; font-size:30px; color:{B.GREEN}; text-transform:uppercase; }}
      {s} .serif {{ font-family:"Fraunces", serif; font-weight:800; letter-spacing:-4px; line-height:0.92; color:{B.PURPLE}; }}
      {s} .serif i {{ font-weight:500; color:{INKP}; }}
      {s} .print {{ position:absolute; border-radius:36px; overflow:hidden; border:12px solid #fff; background:#fff;
                    box-shadow:0 34px 70px rgba(60,20,60,0.24); }}
      {s} .print img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .num {{ position:absolute; left:86px; font-family:"Fraunces", serif; font-style:italic; font-size:48px; color:#08782a; }}
      {s} .name {{ position:absolute; left:80px; right:80px; font-size:112px; }}
      {s} .get {{ position:absolute; left:84px; display:flex; align-items:center; gap:18px; background:#fff; border-radius:999px;
                  padding:20px 34px; font-size:40px; font-weight:700; color:{INKP}; box-shadow:0 12px 30px rgba(60,20,60,0.12); }}
      {s} .get b {{ color:{B.GREEN}; font-weight:800; letter-spacing:3px; font-size:30px; text-transform:uppercase; }}
      {s} .area {{ position:absolute; left:86px; font-size:32px; font-weight:700; color:#6a5670; letter-spacing:0.5px; }}
      {s} .ghost {{ position:absolute; right:30px; top:1250px; font-family:"Fraunces", serif; font-style:italic; font-weight:800;
                    font-size:620px; line-height:0.8; color:rgba(101,12,117,0.07); }}
      {s} .logo {{ position:absolute; right:84px; width:190px; height:auto; }}
      {s} .pill {{ display:inline-block; background:{B.PURPLE}; color:#fff; font-weight:800; font-size:46px; padding:24px 44px; border-radius:999px; }}
    """


def build(d: dict) -> Video:
    assets = dict(d.get("assets") or {})
    spots = d["spots"]
    scenes, subs = [], []

    def src(key):
        return _media_src(assets, key)[0]

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    base = '<div class="paper"></div><div class="warm"></div>'
    logo = f'<img class="logo" src="{src("logo")}" alt="" style="top:150px" />'

    # s0 — the cover. Frame 0 is the thumbnail: everything already in place.
    o = d["open"]
    def open_html(cid, dur, size):
        p = o["photos"]
        return (f'{base}{logo}<div class="kick" style="top:250px">{o["kick"]}</div>'
                f'<div class="serif" style="position:absolute; left:80px; right:80px; top:310px; font-size:176px">{o["title"]}</div>'
                f'<div style="position:absolute; left:86px; top:830px; font-size:42px; font-weight:600; color:#5b4760">{o["sub"]}</div>'
                f'<div class="print" id="{cid}-p0" style="left:70px; top:960px; width:560px; height:560px; transform:rotate(-4deg)"><img src="{src(p[0])}" /></div>'
                f'<div class="print" id="{cid}-p1" style="left:520px; top:1040px; width:500px; height:500px; transform:rotate(5deg)"><img src="{src(p[1])}" /></div>'
                f'<div class="print" id="{cid}-p2" style="left:250px; top:1420px; width:540px; height:400px; transform:rotate(-1.5deg)"><img src="{src(p[2])}" /></div>')
    def open_js(cid, dur, size=None):
        # gentle drift only — the frame is already composed at t=0
        return (f'tl.to("#{cid}-p0", {{ x:-14, y:-10, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.to("#{cid}-p1", {{ x:16, y:-6, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.to("#{cid}-p2", {{ y:-16, duration:{dur:.2f}, ease:"none" }}, 0);')
    add("s0-cover", 3.0, open_html, open_js, o["say"])

    # s1..sN — one spot each. Alternate the print's tilt and entrance so eight
    # cards in a row read as a sequence, not one card repeated.
    for i, sp in enumerate(spots):
        left = i % 2 == 0
        def spot_html(cid, dur, size, sp=sp, i=i, left=left):
            tilt = -2.2 if left else 2.4
            return (f'{base}'
                    f'<div class="print" id="{cid}-ph" style="left:60px; right:60px; top:150px; height:780px; transform:rotate({tilt}deg)"><img id="{cid}-im" src="{src(sp["photo"])}" /></div>'
                    f'<div class="ghost" id="{cid}-x" aria-hidden="true">{i + 1}</div>'
                    f'<div class="num" id="{cid}-n" style="top:952px; line-height:1">No. {i + 1}</div>'
                    f'<div class="serif name" id="{cid}-t" style="top:1035px">{sp["name"]}</div>'
                    f'<div class="get" id="{cid}-g" style="top:{1035 + (125 if len(sp["name"]) <= 15 else 230)}px"><b>Get</b> {sp["dish"]}</div>'
                    f'<div class="area" id="{cid}-a" style="top:{1035 + (125 if len(sp["name"]) <= 15 else 230) + 120}px">{sp["area"]} · lompoclocals.com</div>')
        def spot_js(cid, dur, size=None, left=left):
            dx = -120 if left else 120
            return (f'tl.fromTo("#{cid}-ph", {{ autoAlpha:0, x:{dx}, rotation:{(-6 if left else 6)} }}, {{ autoAlpha:1, x:0, rotation:{(-2.2 if left else 2.4)}, duration:0.6, ease:"expo.out" }}, 0.05);'
                    f'tl.fromTo("#{cid}-im", {{ scale:1.0 }}, {{ scale:1.08, duration:{dur:.2f}, ease:"none" }}, 0);'
                    + S.rise(cid, "n", 0.25, dy=16, dur=0.4) + S.rise(cid, "t", 0.32, dy=22, dur=0.45)
                    + f'tl.fromTo("#{cid}-x", {{ autoAlpha:0, y:60 }}, {{ autoAlpha:1, y:0, duration:0.9, ease:"expo.out" }}, 0.2);'
                    + S.pop(cid, "g", 0.62, scale=1.12, dur=0.4) + S.rise(cid, "a", 0.8, dy=10, dur=0.35))
        add(f"s{i + 1}-spot", 3.4, spot_html, spot_js, sp["say"])

    # end — the invitation
    e = d["end"]
    def end_html(cid, dur, size):
        p = e["photos"]
        prints = ""
        spots_xy = [(70, 170, -5), (560, 150, 4), (90, 560, 3), (580, 540, -3)]
        for k, (x, y, r) in enumerate(spots_xy[:len(p)]):
            prints += f'<div class="print" id="{cid}-p{k}" style="left:{x}px; top:{y}px; width:430px; height:360px; transform:rotate({r}deg)"><img src="{src(p[k])}" /></div>'
        return (f'{base}{prints}'
                f'<div class="serif" id="{cid}-t" style="position:absolute; left:80px; right:80px; top:970px; font-size:132px; opacity:0">{e["title"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:84px; top:1250px; opacity:0"><span class="pill">{e["url"]}</span></div>'
                f'<img class="logo" src="{src("logo")}" alt="" style="top:1390px; left:84px; right:auto; width:200px" />')
    def end_js(cid, dur, size=None):
        out = ""
        for k in range(len(e["photos"])):
            out += S.pop(cid, f"p{k}", 0.05 + 0.08 * k, scale=1.1, dur=0.45)
        return out + S.rise(cid, "t", 0.4, dy=24, dur=0.5) + S.pop(cid, "u", 0.8, scale=1.12, dur=0.45)
    add("s9-end", 3.6, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "SUNDAY LUNCH"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.2, fade_out=1.2)],
                 note="Cream 'menu' look. Dishes = each restaurant's own photo. No hours on screen. No captions; bed 0.22.")
