"""MEMBER FIESTA — a Member Spotlight in the member's own colors.

Built for Taqueria Don Tacho (Sep 29 2026, claimed the same day): their red and
green, their Tachito logo, a papel-picado string across the top, their own food
photos as prints. Any member with a strong two-colour identity can reuse it by
passing `colors`.

    python3 _kit/make.py member-fiesta --data @spot.json --out out/<project> --vo out/<project>/public

Data contract:
    slug, name, colors {a, b, paper}
    assets   staged filename -> URL/path (photos, logo, fonts)
    open     {photo, kicker, say}
    story    {photo, quote, say}
    montage  {photos: [k, k, k, k], labels: [..4], say}
    visit    {photo, address, note, say}
    end      {line, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src


def build(d):
    assets = dict(d.get("assets") or {})
    A, Bc, P = d["colors"]["a"], d["colors"]["b"], d["colors"].get("paper", "#FFF7EC")
    scenes, subs = [], []

    def src(k):
        return _media_src(assets, k)[0]

    def css(cid, size):
        s = f'[data-composition-id="{cid}"]'
        flags = "".join(
            f'<i style="left:{x}px;background:{[A, Bc, "#F2B705", "#E86A92", "#2E86C1"][i % 5]}"></i>'
            for i, x in enumerate(range(-20, 1100, 92)))
        return f"""<style>
          @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces.ttf") format("truetype"); font-weight:100 900; }}
          @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces-Italic.ttf") format("truetype"); font-weight:100 900; font-style:italic; }}
          {s} .vig, {s} .mark {{ display:none; }}
          {s} .grain {{ opacity:0.05; }}
          {s} .paper {{ position:absolute; inset:0; background:{P}; }}
          {s} .band {{ position:absolute; left:0; right:0; top:0; height:40px; background:{A}; }}
          {s} .picado {{ position:absolute; left:0; right:0; top:40px; height:110px; }}
          {s} .picado i {{ position:absolute; top:0; width:78px; height:96px; clip-path:polygon(0 0,100% 0,100% 70%,50% 100%,0 70%); opacity:0.92; }}
          {s} .rope {{ position:absolute; left:0; right:0; top:40px; height:4px; background:{Bc}; }}
          {s} .kick {{ position:absolute; left:80px; font-weight:800; letter-spacing:8px; font-size:30px; color:{Bc}; text-transform:uppercase; }}
          {s} .name {{ position:absolute; left:76px; right:76px; font-family:"Fraunces",serif; font-weight:900; font-size:124px; line-height:0.92; letter-spacing:-4px; color:{A}; }}
          {s} .print {{ position:absolute; border:14px solid #fff; border-radius:30px; overflow:hidden; background:#fff; box-shadow:0 30px 60px rgba(60,20,20,0.25); }}
          {s} .print img {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .logo {{ position:absolute; border-radius:50%; background:#fff; box-shadow:0 16px 36px rgba(0,0,0,0.2); object-fit:contain; padding:10px; }}
          {s} .quote {{ position:absolute; left:80px; right:80px; font-family:"Fraunces",serif; font-style:italic; font-weight:600; font-size:66px; line-height:1.1; color:#3a2320; }}
          {s} .quote b {{ color:{A}; font-style:normal; font-weight:900; }}
          {s} .label {{ position:absolute; background:{Bc}; color:#fff; font-weight:800; font-size:34px; padding:12px 24px; border-radius:999px; box-shadow:0 10px 24px rgba(0,0,0,0.18); }}
          {s} .chip {{ display:inline-block; background:#fff; color:#3a2320; font-weight:800; font-size:40px; padding:18px 30px; border-radius:999px; box-shadow:0 12px 28px rgba(0,0,0,0.14); margin:0 14px 16px 0; }}
          {s} .chip b {{ color:{A}; }}
          {s} .pill {{ display:inline-block; background:{A}; color:#fff; font-weight:800; font-size:42px; padding:22px 38px; border-radius:999px; }}
          {s} .partner {{ display:inline-block; background:{Bc}; color:#fff; font-weight:800; letter-spacing:5px; font-size:28px; padding:12px 26px; border-radius:10px; text-transform:uppercase; }}
        </style>
        <div class="paper"></div><div class="band"></div><div class="picado">{flags}</div><div class="rope"></div><div class="band" style="top:auto;bottom:0;height:56px;background:{Bc}"></div><div class="picado" style="top:auto;bottom:56px;transform:scaleY(-1)">{flags}</div>"""

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, lambda c, du, sz, h=html: css(c, sz) + h(c, du, sz), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    o = d["open"]
    def open_html(cid, dur, size):
        return (f'<div class="print" id="{cid}-p" style="left:60px; right:60px; top:190px; height:1180px; transform:rotate(-1.8deg)"><img id="{cid}-im" src="{src(o["photo"])}" /></div>'
                f'<img class="logo" src="{src("logo")}" style="right:90px; top:1130px; width:240px; height:240px" />'
                f'<div class="kick" style="top:1420px">{o["kicker"]}</div>'
                f'<div class="name" style="top:1470px">{d["name"]}</div>')
    def open_js(cid, dur, size=None):
        return f'tl.fromTo("#{cid}-im", {{ scale:1.0 }}, {{ scale:1.08, duration:{dur:.2f}, ease:"none" }}, 0);'
    add("s0-open", 3.6, open_html, open_js, o["say"])

    st = d["story"]
    def story_html(cid, dur, size):
        return (f'<div class="print" id="{cid}-p" style="left:70px; right:70px; top:200px; height:1130px; transform:rotate(2deg)"><img id="{cid}-im" src="{src(st["photo"])}" /></div>'
                f'<div class="quote" id="{cid}-q" style="top:1420px">{st["quote"]}</div>')
    def story_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-p", {{ autoAlpha:0, y:90, rotation:7 }}, {{ autoAlpha:1, y:0, rotation:2, duration:0.6, ease:"expo.out" }}, 0.05);'
                f'tl.fromTo("#{cid}-im", {{ scale:1.0 }}, {{ scale:1.07, duration:{dur:.2f}, ease:"none" }}, 0);'
                + S.rise(cid, "q", 0.4, dy=24, dur=0.5))
    add("s1-story", 4.8, story_html, story_js, st["say"])

    m = d["montage"]
    pos = [(50, 220, -3), (550, 250, 3), (70, 870, 2), (560, 900, -2.5)]
    def mont_html(cid, dur, size):
        h = ""
        for k, (x, y, r) in enumerate(pos):
            h += (f'<div class="print" id="{cid}-p{k}" style="left:{x}px; top:{y}px; width:470px; height:590px; transform:rotate({r}deg); opacity:0"><img src="{src(m["photos"][k])}" /></div>'
                  f'<div class="label" id="{cid}-l{k}" style="left:{x + 30}px; top:{y + 540}px; opacity:0">{m["labels"][k]}</div>')
        return h
    def mont_js(cid, dur, size=None):
        out = ""
        for k in range(4):
            at = 0.1 + k * 0.45
            out += S.pop(cid, f"p{k}", at, scale=1.15, dur=0.45) + S.pop(cid, f"l{k}", at + 0.2, scale=1.2, dur=0.35)
        return out
    add("s2-montage", 4.4, mont_html, mont_js, m["say"])

    v = d["visit"]
    def visit_html(cid, dur, size):
        return (f'<div class="print" id="{cid}-p" style="left:60px; right:60px; top:190px; height:1210px; transform:rotate(-1.5deg)"><img id="{cid}-im" src="{src(v["photo"])}" /></div>'
                f'<div id="{cid}-c" style="position:absolute; left:80px; right:80px; top:1470px; opacity:0"><span class="chip">📍 <b>{v["address"]}</b></span><span class="chip">{v["note"]}</span></div>')
    def visit_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-im", {{ scale:1.0 }}, {{ scale:1.07, duration:{dur:.2f}, ease:"none" }}, 0);'
                + S.rise(cid, "c", 0.35, dy=22, dur=0.45))
    add("s3-visit", 3.8, visit_html, visit_js, v["say"])

    e = d["end"]
    def end_html(cid, dur, size):
        return (f'<img class="logo" id="{cid}-lg" src="{src("logo")}" style="left:305px; top:330px; width:470px; height:470px; opacity:0" />'
                f'<div id="{cid}-t" style="position:absolute; left:0; right:0; top:870px; text-align:center; opacity:0"><span class="partner">Official Partner</span></div>'
                f'<div class="name" id="{cid}-n" style="top:960px; text-align:center; opacity:0">{d["name"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; top:1260px; text-align:center; opacity:0"><span class="pill">{e["url"]}</span></div>'
                + "".join(f'<div class="print" id="{cid}-t{k}" style="left:{80 + k * 320}px; top:1430px; width:290px; height:290px; transform:rotate({[-4, 2, 5][k]}deg); opacity:0"><img src="{src(ph)}" /></div>' for k, ph in enumerate(m["photos"][:3])))
    def end_js(cid, dur, size=None):
        return (S.pop(cid, "lg", 0.05, scale=1.2, dur=0.5) + S.rise(cid, "t", 0.3, dy=12, dur=0.35)
                + S.rise(cid, "n", 0.45, dy=20, dur=0.45) + S.pop(cid, "u", 0.8, scale=1.12, dur=0.4)
                + "".join(S.pop(cid, f"t{k}", 1.0 + 0.15 * k, scale=1.15, dur=0.4) for k in range(3)))
    add("s4-end", 3.6, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=f'MEMBER SPOTLIGHT — {d["name"]}', total=total, size=B.SIZES["9x16"], scenes=scenes, subs=subs,
                 vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.20, fade_in=0.2, fade_out=1.2)],
                 note="Member colors, their own photos only, logo mandatory. No captions; bed 0.20.")
