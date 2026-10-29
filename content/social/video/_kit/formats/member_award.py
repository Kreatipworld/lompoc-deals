"""MEMBER AWARD — a congratulations spot when a member wins a town honour.

Built Oct 28 2026 for Eye on I (Lompoc Valley Chamber 2026 Small Business
Award). Night-stage look in the member's own colours: their logo glows centre
stage, a gold starburst turns behind it and confetti falls; then their own
photos arrive as prints and the end card says congratulations from us.

    python3 _kit/make.py member-award --data @award.json --out out/<project> --vo out/<project>/public

Data contract:
    slug, name, accent (member colour), stage (background colour)
    assets   staged filename -> URL/path (photos, "logo")
    award    {year, title, by, say}        cover: logo, burst, confetti, award ribbon
    hero     {photo, line, say}            one full photo with a line of text
    prints   {photos: [k, k, k], line, say}
    place    {photos: [k, k], line, say}
    end      {line, url, say}
"""
import math

from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

CONF_COLORS = [B.GOLD, "#fff3c2", "#ffffff", "#f59e0b"]


def _confetti(cid, n=46, accent="#2fb8c8"):
    out = ""
    cols = CONF_COLORS + [accent]
    for i in range(n):
        x = (i * 223) % 1080
        y = -80 - (i * 137) % 900
        w = 14 + (i * 7) % 16
        h = w * (2 if i % 3 == 0 else 1)
        r = (i * 41) % 180
        rad = "50%" if i % 4 == 0 else "3px"
        out += (f'<i class="cf" id="{cid}-cf{i}" style="left:{x}px; top:{y}px; width:{w}px; height:{h}px; '
                f'background:{cols[i % len(cols)]}; border-radius:{rad}; transform:rotate({r}deg)"></i>')
    return out


def _confetti_js(cid, dur, n=46, start=0.0):
    out = ""
    for i in range(n):
        fall = 1500 + (i * 97) % 900
        spin = 360 + (i * 53) % 540
        drift = ((i * 31) % 160) - 80
        out += (f'tl.fromTo("#{cid}-cf{i}", {{ y:0, x:0, rotation:{(i * 41) % 180} }}, '
                f'{{ y:{fall}, x:{drift}, rotation:{spin}, duration:{dur - start:.2f}, ease:"none" }}, {start:.2f});')
    return out


def _burst(n=28):
    """Gold starburst: lines with a dot at the tip, an echo of the eye logo's rays."""
    lines = ""
    for i in range(n):
        a = 2 * math.pi * i / n
        r0, r1 = 360, 470 + (60 if i % 2 else 0)
        x0, y0 = 500 + r0 * math.cos(a), 500 + r0 * math.sin(a)
        x1, y1 = 500 + r1 * math.cos(a), 500 + r1 * math.sin(a)
        lines += (f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" />'
                  f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="9" />')
    return (f'<svg viewBox="0 0 1000 1000" style="width:100%;height:100%">'
            f'<g stroke="{B.GOLD}" stroke-width="5" stroke-linecap="round" fill="none">{lines}</g></svg>')


def build(d: dict) -> Video:
    assets = dict(d.get("assets") or {})
    acc, stage = d.get("accent", "#2fb8c8"), d.get("stage", "#121214")
    scenes, subs = [], []

    def src(k):
        return _media_src(assets, k)[0]

    def css(cid):
        s = f'[data-composition-id="{cid}"]'
        return f"""<style>
          {s} .mark {{ display:none; }}
          {s} .stage {{ position:absolute; inset:0; background:radial-gradient(ellipse 90% 60% at 50% 34%, #2a2a30 0%, {stage} 62%, #060607 100%); }}
          {s} .spot {{ position:absolute; left:140px; top:-200px; width:800px; height:1400px;
                       background:radial-gradient(ellipse 50% 60% at 50% 40%, rgba(239,198,24,0.22) 0%, rgba(239,198,24,0) 70%); }}
          {s} .burst {{ position:absolute; left:90px; top:150px; width:900px; height:900px; opacity:0.95; }}
          {s} .logo {{ position:absolute; left:250px; top:310px; width:580px; height:580px; }}
          {s} .cf {{ position:absolute; display:block; z-index:6; }}
          {s} .kick {{ position:absolute; left:0; right:0; text-align:center; font-weight:800; font-size:32px; letter-spacing:10px;
                       color:{B.GOLD}; text-transform:uppercase; }}
          {s} .award {{ position:absolute; left:60px; right:60px; text-align:center; color:#fff; font-weight:800;
                        font-size:118px; line-height:0.95; letter-spacing:-4px; }}
          {s} .award em {{ font-style:normal; color:{B.GOLD}; }}
          {s} .ribbon {{ position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; background:{acc}; color:#06191c;
                         font-weight:800; font-size:40px; padding:18px 40px; border-radius:999px; box-shadow:0 18px 40px rgba(0,0,0,0.5); }}
          {s} .frame {{ position:absolute; overflow:hidden; border-radius:40px; border:8px solid {B.GOLD};
                        box-shadow:0 0 0 10px rgba(239,198,24,0.15), 0 40px 80px rgba(0,0,0,0.6); }}
          {s} .frame img, {s} .print img {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .print {{ position:absolute; background:#fff; padding:14px; border-radius:24px; box-shadow:0 30px 70px rgba(0,0,0,0.6); }}
          {s} .line {{ position:absolute; left:80px; right:80px; color:#fff; font-weight:800; font-size:76px; line-height:1.02; letter-spacing:-2px; }}
          {s} .line em {{ font-style:normal; color:{B.GOLD}; }}
          {s} .tag {{ position:absolute; left:80px; font-weight:800; font-size:30px; letter-spacing:8px; color:{acc}; text-transform:uppercase; }}
          {s} .pill {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:44px; padding:20px 40px; border-radius:999px; }}
        </style>
        <div class="stage"></div><div class="spot" id="{cid}-spot"></div>"""

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, lambda c, du, sz, h=html: css(c) + h(c, du, sz), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    # cover: frame 0 is the thumbnail, fully composed (confetti already in the air)
    a = d["award"]
    def cover_html(cid, dur, size):
        return (f'<div class="burst" id="{cid}-bu" style="top:230px">{_burst()}</div>'
                f'<img class="logo" id="{cid}-lg" src="{src("logo")}" style="top:390px" />'
                f'<div class="kick" style="top:130px; font-size:40px">Congratulations</div>'
                f'<div class="award" id="{cid}-a" style="top:1150px; font-size:160px">{d["name"]}</div>'
                f'<div class="ribbon" id="{cid}-r" style="top:1330px; font-size:48px">{a["year"]} {a["title"]}</div>'
                f'<div class="kick" id="{cid}-by" style="top:1450px; color:#fff; letter-spacing:6px; font-size:30px">{a["by"]}</div>'
                + _confetti(cid, accent=acc).replace("top:-", "top:"))
    def cover_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-bu", {{ rotation:0, scale:0.96 }}, {{ rotation:24, scale:1.04, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-lg", {{ scale:1 }}, {{ scale:1.06, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-r", {{ scale:1 }}, {{ scale:1.08, duration:0.3, yoyo:true, repeat:1, ease:"power2.out" }}, 0.6);'
                f'tl.fromTo("#{cid}-spot", {{ opacity:0.7 }}, {{ opacity:1, duration:0.4, yoyo:true, repeat:3, ease:"sine.inOut" }}, 0);'
                + _confetti_js(cid, dur))
    add("s0-award", 3.6, cover_html, cover_js, a["say"])

    h = d["hero"]
    def hero_html(cid, dur, size):
        return (f'<div class="frame" style="left:60px; right:60px; top:180px; height:1000px"><img id="{cid}-im" src="{src(h["photo"])}" /></div>'
                f'<div class="tag" id="{cid}-t" style="top:1250px">{d["name"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:1300px">{h["line"]}</div>')
    def hero_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-im", {{ scale:1.12 }}, {{ scale:1.0, duration:{dur:.2f}, ease:"none" }}, 0);'
                + S.rise(cid, "t", 0.15, dy=24) + S.rise(cid, "l", 0.3, dy=40, dur=0.5))
    add("s1-hero", 3.4, hero_html, hero_js, h["say"])

    p = d["prints"]
    def prints_html(cid, dur, size):
        xy = [(60, 200, 460, 560, -4), (560, 330, 460, 560, 5), (230, 840, 620, 480, -2)]
        out = ""
        for k, (x, y, w, hh, r) in enumerate(xy):
            out += (f'<div class="print" id="{cid}-p{k}" style="left:{x}px; top:{y}px; width:{w}px; height:{hh}px; '
                    f'transform:rotate({r}deg); opacity:0"><img src="{src(p["photos"][k])}" /></div>')
        return out + f'<div class="line" id="{cid}-l" style="top:1400px">{p["line"]}</div>'
    def prints_js(cid, dur, size=None):
        out = ""
        for k in range(3):
            out += (f'tl.fromTo("#{cid}-p{k}", {{ autoAlpha:0, y:300, scale:0.8 }}, '
                    f'{{ autoAlpha:1, y:0, scale:1, duration:0.6, ease:"back.out(1.5)" }}, {0.1 + 0.55 * k:.2f});')
        return out + S.rise(cid, "l", 0.5, dy=40, dur=0.5)
    add("s2-prints", 3.8, prints_html, prints_js, p["say"])

    pl = d["place"]
    def place_html(cid, dur, size):
        return (f'<div class="frame" style="left:60px; right:60px; top:180px; height:620px"><img id="{cid}-a" src="{src(pl["photos"][0])}" /></div>'
                f'<div class="frame" id="{cid}-bf" style="left:60px; right:60px; top:850px; height:520px"><img id="{cid}-b" src="{src(pl["photos"][1])}" /></div>'
                f'<div class="line" id="{cid}-l" style="top:1420px">{pl["line"]}</div>')
    def place_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-a", {{ x:-40, scale:1.12 }}, {{ x:40, scale:1.12, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-bf", {{ autoAlpha:0, y:200 }}, {{ autoAlpha:1, y:0, duration:0.6, ease:"back.out(1.4)" }}, 0.35);'
                f'tl.fromTo("#{cid}-b", {{ scale:1.0 }}, {{ scale:1.1, duration:{dur:.2f}, ease:"none" }}, 0);'
                + S.rise(cid, "l", 0.6, dy=40, dur=0.5))
    add("s3-place", 3.4, place_html, place_js, pl["say"])

    e = d["end"]
    def end_html(cid, dur, size):
        return (f'<div class="burst" id="{cid}-bu" style="top:120px">{_burst()}</div>'
                f'<img class="logo" id="{cid}-lg" src="{src("logo")}" style="top:280px" />'
                f'<div class="award" id="{cid}-a" style="top:1030px; font-size:96px">{e["line"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; text-align:center; top:1330px"><span class="pill">{e["url"]}</span></div>'
                + _confetti(cid, accent=acc))
    def end_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-bu", {{ rotation:-10, scale:0.6, autoAlpha:0 }}, {{ rotation:20, scale:1, autoAlpha:1, duration:{dur:.2f}, ease:"power2.out" }}, 0);'
                f'tl.fromTo("#{cid}-lg", {{ scale:0.7, autoAlpha:0 }}, {{ scale:1, autoAlpha:1, duration:0.7, ease:"back.out(1.6)" }}, 0.05);'
                + S.rise(cid, "a", 0.5, dy=40, dur=0.55) + S.pop(cid, "u", 1.0, scale=1.15, dur=0.45)
                + _confetti_js(cid, dur, start=0.3))
    add("s4-end", 4.2, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "MEMBER AWARD"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.1, fade_out=1.2)],
                 note="Award congrats: glowing logo, turning gold starburst, confetti; member photos as prints.")
