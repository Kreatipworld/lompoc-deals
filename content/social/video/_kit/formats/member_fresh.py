"""MEMBER FRESH — a Member Spotlight built on the member's own phone clips.

Built for Bowl & Soul (Oct 1 2026): the owner sent kitchen clips and photos
from the trailer. Same filled-frame bones as member-fiesta, but calm instead of
festive: the member's two colours, a soft leaf band, and their footage playing
inside the prints. Any member who sends us video can reuse it.

    python3 _kit/make.py member-fresh --data @spot.json --out out/<project> --vo out/<project>/public

Data contract (a media key may name a staged .mp4 or an image):
    slug, name, colors {a, b, paper, ink}
    assets   staged filename -> URL/path (clips, photos, logo, fonts)
    open     {media, kicker, say}
    story    {media, quote, say}
    montage  {media: [k, k, k, k], labels: [..4], say}
    visit    {media, chips: [..], say}
    end      {line, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src


def build(d):
    assets = dict(d.get("assets") or {})
    c = d["colors"]
    A, Bc, P, INK = c["a"], c["b"], c.get("paper", "#F6EFE2"), c.get("ink", "#3B2E22")
    scenes, subs = [], []

    def media(k, el_id, dur, start=0.0):
        src, kind = _media_src(assets, k)
        if kind == "video":
            return (f'<video id="{el_id}" src="{src}" data-start="0" data-media-start="{start:.2f}" '
                    f'data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video>')
        return f'<img id="{el_id}" src="{src}" />'

    def css(cid, size):
        s = f'[data-composition-id="{cid}"]'
        # deco "stripes": a flag-like band of diagonal stripes for trades/patriotic brands (Arthur A. Wise, Oct 2026)
        if d.get("deco") == "stripes":
            leaves = "".join(f'<i style="left:{x}px;width:60px;height:80px;border-radius:0;transform:skewX(-25deg);background:{[A, Bc, "#ffffff"][i % 3]}"></i>'
                             for i, x in enumerate(range(-20, 1100, 70)))
        else:
          leaves = "".join(
              f'<i style="left:{x}px;transform:rotate({[-30, 25, -10, 35, -25][i % 5]}deg);background:{[A, Bc][i % 2]}"></i>'
              for i, x in enumerate(range(10, 1080, 118)))
        return f"""<style>
          @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces.ttf") format("truetype"); font-weight:100 900; }}
          @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces-Italic.ttf") format("truetype"); font-weight:100 900; font-style:italic; }}
          {s} .vig, {s} .mark {{ display:none; }}
          {s} .grain {{ opacity:0.05; }}
          {s} .fr-paper {{ position:absolute; inset:0; background:{P}; }}
          {s} .fr-band {{ position:absolute; left:0; right:0; top:0; height:52px; background:{A}; }}
          {s} .fr-leaves {{ position:absolute; left:0; right:0; top:62px; height:80px; }}
          {s} .fr-leaves i {{ position:absolute; top:6px; width:44px; height:70px; border-radius:0 100% 0 100%; opacity:0.85; }}
          {s} .fr-kick {{ position:absolute; left:80px; font-weight:800; letter-spacing:7px; font-size:30px; color:{A}; text-transform:uppercase; }}
          {s} .fr-name {{ position:absolute; left:76px; right:76px; font-family:"Fraunces",serif; font-weight:900; font-size:150px; line-height:0.92; letter-spacing:-4px; color:{INK}; }}
          {s} .fr-name em {{ color:{A}; font-style:italic; }}
          {s} .fr-print {{ position:absolute; border:14px solid #fff; border-radius:34px; overflow:hidden; background:#fff; box-shadow:0 30px 60px rgba(40,30,20,0.25); }}
          {s} .fr-print img, {s} .fr-print video {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .fr-logo {{ position:absolute; border-radius:50%; background:#fff; box-shadow:0 16px 36px rgba(0,0,0,0.2); object-fit:cover; }}
          {s} .fr-quote {{ position:absolute; left:80px; right:80px; font-family:"Fraunces",serif; font-style:italic; font-weight:600; font-size:80px; line-height:1.06; color:{INK}; }}
          {s} .fr-quote b {{ color:{A}; font-style:normal; font-weight:900; }}
          {s} .fr-label {{ position:absolute; background:{A}; color:#fff; font-weight:800; font-size:34px; padding:12px 24px; border-radius:999px; box-shadow:0 10px 24px rgba(0,0,0,0.18); }}
          {s} .fr-chip {{ display:inline-block; background:#fff; color:{INK}; font-weight:800; font-size:46px; padding:20px 34px; border-radius:999px; box-shadow:0 12px 28px rgba(0,0,0,0.14); margin:0 14px 16px 0; }}
          {s} .fr-chip b {{ color:{A}; }}
          {s} .fr-pill {{ display:inline-block; background:{A}; color:#fff; font-weight:800; font-size:42px; padding:22px 38px; border-radius:999px; }}
          {s} .fr-partner {{ display:inline-block; background:{Bc}; color:{INK}; font-weight:800; letter-spacing:5px; font-size:28px; padding:12px 26px; border-radius:10px; text-transform:uppercase; }}
        </style>
        <div class="fr-paper"></div><div class="fr-band"></div><div class="fr-leaves">{leaves}</div><div class="fr-band" style="top:auto;bottom:0;height:60px"></div>"""

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, lambda c_, du, sz, h=html: css(c_, sz) + h(c_, du, sz), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    def zoom(cid, el, dur, to=1.07):
        return f'tl.fromTo("#{cid}-{el}", {{ scale:1.0 }}, {{ scale:{to}, duration:{dur:.2f}, ease:"none" }}, 0);'

    o = d["open"]
    def open_html(cid, dur, size):
        return (f'<div class="fr-print" style="left:60px; right:60px; top:180px; height:1200px; transform:rotate(-1.6deg)">{media(o["media"], cid + "-im", dur, o.get("start", 0))}</div>'
                f'<img class="fr-logo" src="{_media_src(assets, "logo")[0]}" style="right:90px; top:1150px; width:230px; height:230px" />'
                f'<div class="fr-kick" style="top:1430px">{o["kicker"]}</div>'
                f'<div class="fr-name" style="top:1480px">{d["name_html"]}</div>')
    add("s0-open", d["open"].get("dur", 3.8), open_html, lambda cid, dur, size=None: zoom(cid, "im", dur, 1.05), o["say"])

    st = d["story"]
    def story_html(cid, dur, size):
        return (f'<div class="fr-print" id="{cid}-p" style="left:70px; right:70px; top:180px; height:1230px; transform:rotate(1.8deg)">{media(st["media"], cid + "-im", dur, st.get("start", 0))}</div>'
                f'<div class="fr-quote" id="{cid}-q" style="top:1500px">{st["quote"]}</div>')
    def story_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-p", {{ autoAlpha:0, y:90, rotation:6 }}, {{ autoAlpha:1, y:0, rotation:1.8, duration:0.6, ease:"expo.out" }}, 0.05);'
                + zoom(cid, "im", dur) + S.rise(cid, "q", 0.4, dy=24, dur=0.5))
    add("s1-story", st.get("dur", 4.6), story_html, story_js, st["say"])

    m = d["montage"]
    pos = [(50, 210, -3), (550, 240, 3), (70, 860, 2), (560, 890, -2.5)]
    def mont_html(cid, dur, size):
        h = ""
        for k, (x, y, r) in enumerate(pos):
            h += (f'<div class="fr-print" id="{cid}-p{k}" style="left:{x}px; top:{y}px; width:470px; height:600px; transform:rotate({r}deg); opacity:0">{media(m["media"][k], f"{cid}-m{k}", dur)}</div>'
                  f'<div class="fr-label" id="{cid}-l{k}" style="left:{x + 30}px; top:{y + 550}px; opacity:0">{m["labels"][k]}</div>')
        return h
    def mont_js(cid, dur, size=None):
        out = ""
        for k in range(4):
            at = 0.1 + k * 0.45
            out += S.pop(cid, f"p{k}", at, scale=1.15, dur=0.45) + S.pop(cid, f"l{k}", at + 0.2, scale=1.2, dur=0.35)
        return out
    add("s2-montage", m.get("dur", 4.4), mont_html, mont_js, m["say"])

    v = d["visit"]
    def visit_html(cid, dur, size):
        chips = "".join(f'<span class="fr-chip">{t}</span>' for t in v["chips"])
        return (f'<div class="fr-print" style="left:60px; right:60px; top:180px; height:1260px; transform:rotate(-1.4deg)">{media(v["media"], cid + "-im", dur, v.get("start", 0))}</div>'
                f'<div id="{cid}-c" style="position:absolute; left:80px; right:80px; top:1520px; opacity:0">{chips}</div>')
    add("s3-visit", v.get("dur", 4.0), visit_html, lambda cid, dur, size=None: zoom(cid, "im", dur) + S.rise(cid, "c", 0.35, dy=22, dur=0.45), v["say"])

    e = d["end"]
    def end_html(cid, dur, size):
        return (f'<img class="fr-logo" id="{cid}-lg" src="{_media_src(assets, "logo")[0]}" style="left:330px; top:300px; width:420px; height:420px; opacity:0" />'
                f'<div id="{cid}-t" style="position:absolute; left:0; right:0; top:790px; text-align:center; opacity:0"><span class="fr-partner">Official Partner</span></div>'
                f'<div class="fr-name" id="{cid}-n" style="top:880px; text-align:center; opacity:0">{d["name_html"]}</div>'
                f'<div class="fr-quote" id="{cid}-l" style="top:1030px; text-align:center; font-size:56px; opacity:0">{e["line"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; top:1190px; text-align:center; opacity:0"><span class="fr-pill">{e["url"]}</span></div>'
                + "".join(f'<div class="fr-print" id="{cid}-t{k}" style="left:{80 + k * 320}px; top:1400px; width:290px; height:330px; transform:rotate({[-4, 2, 5][k]}deg); opacity:0"><img src="{_media_src(assets, ph)[0]}" /></div>' for k, ph in enumerate(e["strip"])))
    def end_js(cid, dur, size=None):
        return (S.pop(cid, "lg", 0.05, scale=1.2, dur=0.5) + S.rise(cid, "t", 0.3, dy=12, dur=0.35)
                + S.rise(cid, "n", 0.45, dy=20, dur=0.45) + S.rise(cid, "l", 0.65, dy=16, dur=0.4) + S.pop(cid, "u", 0.85, scale=1.12, dur=0.4)
                + "".join(S.pop(cid, f"t{k}", 1.05 + 0.15 * k, scale=1.15, dur=0.4) for k in range(3)))
    add("s4-end", e.get("dur", 3.8), end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=f'MEMBER SPOTLIGHT — {d["name"]}', total=total, size=B.SIZES["9x16"], scenes=scenes, subs=subs,
                 vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.20, fade_in=0.2, fade_out=1.2)],
                 note="Member colors, their own clips and photos only, logo mandatory. No captions; bed 0.20.")
