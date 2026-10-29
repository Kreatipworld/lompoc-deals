"""HOMETOWN PROS — Lompoc's own who made it to the pros, one card each.

Built Oct 29 2026 when the owner asked to "hype the NFL, local" and picked
"Lompoc's own in the NFL". No player photos (those belong to news outlets and
teams) and no league or team logos: a turf field, the two school badges and
type carry it. Every player gets a different device so no shot repeats:

    count   a number that counts up (one-game yards)
    tally   a grid of tiles that fills to a total (games played)
    ticket  a draft card stamped DRAFTED
    run     a rushing bar that sprints across the field
    stamps  contract stamps that slam down

    python3 _kit/make.py hometown-pros --data @pros.json --out out/<project> --vo out/<project>/public

Data contract (every figure sourced in the post file):
    slug, title
    cover   {kick, top, bottom, say}
    players [{device, name, school ("braves"|"conqs"), tag, say, ...device keys}]
        count:  {value, label, sub}
        tally:  {value, label, path:[...]}
        ticket: {year, team, stamp, sub}
        run:    {value, label, sub}
        stamps: {stamps:[{team, year}]}
    end     {title, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

SCHOOL = {
    "braves": {"badge": "badge-braves.png", "name": "Lompoc High", "c": "#2d34c4", "ink": "#ffffff", "glow": "45,52,196"},
    "conqs": {"badge": "badge-conqs.png", "name": "Cabrillo", "c": "#f2c200", "ink": "#111111", "glow": "242,194,0"},
}


def _field(cid):
    """Turf stripes, yard lines and hash marks, seen from above at an angle."""
    lines = "".join(f'<i class="yl" style="top:{y}px"></i>' for y in range(60, 1920, 180))
    hashes = "".join(f'<i class="hs" style="top:{y}px; left:300px"></i><i class="hs" style="top:{y}px; left:760px"></i>'
                     for y in range(60, 1920, 36))
    return f'<div class="field" id="{cid}-fd">{lines}{hashes}</div><div class="night"></div>'


def _css(cid, glow="239,198,24"):
    s = f'[data-composition-id="{cid}"]'
    return f"""<style>
      {s} .mark {{ display:none; }}
      {s} .field {{ position:absolute; left:-80px; right:-80px; top:-200px; height:2400px;
                    background:repeating-linear-gradient(180deg, #1d6b2c 0px, #1d6b2c 90px, #217631 90px, #217631 180px); }}
      {s} .yl {{ position:absolute; left:0; right:0; height:6px; background:rgba(255,255,255,0.55); }}
      {s} .hs {{ position:absolute; width:40px; height:5px; background:rgba(255,255,255,0.45); }}
      {s} .night {{ position:absolute; inset:0; background:
                    radial-gradient(ellipse 80% 55% at 50% 40%, rgba({glow},0.30) 0%, rgba(8,10,14,0.55) 55%, rgba(4,5,8,0.94) 100%); }}
      {s} .badge {{ position:absolute; object-fit:contain; filter:drop-shadow(0 18px 40px rgba(0,0,0,0.6)); }}
      {s} .kick {{ position:absolute; left:0; right:0; text-align:center; font-weight:800; font-size:34px; letter-spacing:10px;
                   color:{B.GOLD}; text-transform:uppercase; }}
      {s} .big {{ position:absolute; left:60px; right:60px; text-align:center; color:#fff; font-weight:800; line-height:0.9;
                  letter-spacing:-5px; text-shadow:0 10px 40px rgba(0,0,0,0.7); }}
      {s} .big em {{ font-style:normal; color:{B.GOLD}; }}
      {s} .name {{ position:absolute; left:84px; right:84px; color:#fff; font-weight:800; font-size:96px; line-height:0.92;
                   letter-spacing:-3px; text-transform:uppercase; text-shadow:0 8px 30px rgba(0,0,0,0.7); }}
      {s} .tag {{ position:absolute; left:84px; display:inline-block; font-weight:800; font-size:32px; letter-spacing:5px;
                  padding:14px 26px; border-radius:12px; text-transform:uppercase; }}
      {s} .lbl {{ position:absolute; left:84px; right:84px; color:#fff; font-weight:800; font-size:54px; line-height:1.05; letter-spacing:-1px; }}
      {s} .lbl em {{ font-style:normal; color:{B.GOLD}; }}
      {s} .num {{ position:absolute; left:0; right:0; text-align:center; font-weight:800; color:#fff; font-size:420px;
                  line-height:0.85; letter-spacing:-20px; text-shadow:0 20px 60px rgba(0,0,0,0.7); }}
      {s} .tile {{ position:absolute; width:86px; height:86px; border-radius:14px; }}
      {s} .step {{ position:absolute; left:84px; right:84px; font-weight:800; font-size:50px; color:#fff; letter-spacing:-1px; }}
      {s} .step b {{ display:inline-block; width:22px; height:22px; border-radius:50%; background:{B.GOLD}; margin-right:24px; vertical-align:middle; }}
      {s} .ticket {{ position:absolute; left:90px; right:90px; background:#f4eedd; border-radius:30px; color:#1b1b1b;
                     box-shadow:0 40px 90px rgba(0,0,0,0.65); overflow:hidden; }}
      {s} .stamp {{ position:absolute; border:10px solid #d4202c; color:#d4202c; font-weight:800; text-transform:uppercase;
                    border-radius:18px; padding:10px 34px; letter-spacing:6px; text-align:center; background:rgba(244,238,221,0.06); }}
      {s} .bar {{ position:absolute; left:84px; height:120px; border-radius:0 60px 60px 0; background:linear-gradient(90deg, {B.GOLD}, #ffe680);
                  box-shadow:0 0 60px rgba(239,198,24,0.6); transform-origin:left center; }}
      {s} .pill {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:48px; padding:22px 44px; border-radius:999px; }}
    </style>"""


def _school_tag(cid, sch, top):
    return (f'<div class="tag" id="{cid}-tg" style="top:{top}px; background:{sch["c"]}; color:{sch["ink"]}">'
            f'{sch["name"]}</div>')


def build(d: dict) -> Video:
    scenes, subs = [], []

    def add(cid, dur, html, js, say, glow="239,198,24"):
        scenes.append(Scene(cid, 0.0, dur, lambda c, du, sz, h=html, g=glow: _css(c, g) + _field(c) + h(c, du, sz),
                            js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    def drift(cid, dur, dy=-120):
        return f'tl.fromTo("#{cid}-fd", {{ y:0 }}, {{ y:{dy}, duration:{dur:.2f}, ease:"none" }}, 0);'

    # ── cover: frame 0 is the thumbnail, fully composed
    c = d["cover"]
    def cover_html(cid, dur, size):
        return (f'<img class="badge" id="{cid}-b1" src="public/badge-braves.png" style="left:110px; top:250px; width:380px; height:380px" />'
                f'<img class="badge" id="{cid}-b2" src="public/badge-conqs.png" style="left:590px; top:250px; width:380px; height:380px" />'
                f'<div class="kick" style="top:740px">{c["kick"]}</div>'
                f'<div class="big" id="{cid}-t1" style="top:820px; font-size:132px; letter-spacing:-4px; white-space:nowrap">{c["top"]}</div>'
                f'<div class="big" id="{cid}-t2" style="top:960px; font-size:150px; white-space:nowrap"><em>{c["bottom"]}</em></div>')
    def cover_js(cid, dur, size=None):
        return (drift(cid, dur, -90)
                + f'tl.fromTo("#{cid}-b1", {{ x:0, rotation:0 }}, {{ x:-20, rotation:-4, duration:{dur:.2f}, ease:"none" }}, 0);'
                + f'tl.fromTo("#{cid}-b2", {{ x:0, rotation:0 }}, {{ x:20, rotation:4, duration:{dur:.2f}, ease:"none" }}, 0);'
                + f'tl.fromTo("#{cid}-t2", {{ scale:1 }}, {{ scale:1.06, duration:0.35, yoyo:true, repeat:1, ease:"power2.out" }}, 0.5);')
    add("s0-cover", 3.4, cover_html, cover_js, c["say"])

    for i, p in enumerate(d["players"]):
        sch = SCHOOL[p["school"]]
        cid = f"s{i + 1}-{p['device']}"
        dev = p["device"]

        def head(cid, sch=sch, p=p, name_top=330):
            return (f'<img class="badge" id="{cid}-bg" src="public/{sch["badge"]}" style="right:84px; top:{name_top - 205}px; width:150px; height:150px" />'
                    + _school_tag(cid, sch, name_top - 80)
                    + f'<div class="name" id="{cid}-nm" style="top:{name_top}px">{p["name"]}</div>')

        def head_js(cid):
            return S.pop(cid, "bg", 0.05, scale=1.4) + S.rise(cid, "tg", 0.1) + S.rise(cid, "nm", 0.18, dy=40, dur=0.5)

        if dev == "count":
            def html(cid, dur, size, p=p, head=head):
                return (head(cid) + f'<div class="num" id="{cid}-n" style="top:620px">0</div>'
                        f'<div class="kick" id="{cid}-l" style="top:1090px; color:#fff; font-size:44px; letter-spacing:8px">{p["label"]}</div>'
                        f'<div class="lbl" id="{cid}-s" style="top:1200px; text-align:center">{p["sub"]}</div>')
            def js(cid, dur, size=None, p=p, head_js=head_js):
                v = int(p["value"])
                return (drift(cid, dur) + head_js(cid)
                        + f'(() => {{ const o = {{v:0}}; const el = document.getElementById("{cid}-n");'
                          f'tl.to(o, {{ v:{v}, duration:1.6, ease:"power2.out", onUpdate:() => {{ el.textContent = Math.round(o.v); }} }}, 0.45); }})();'
                        + f'tl.fromTo("#{cid}-n", {{ scale:0.7 }}, {{ scale:1, duration:1.6, ease:"power2.out" }}, 0.45);'
                        + f'tl.fromTo("#{cid}-n", {{ color:"#ffffff" }}, {{ color:"{B.GOLD}", duration:0.3 }}, 2.0);'
                        + S.rise(cid, "l", 1.2) + S.rise(cid, "s", 2.1, dy=30))

        elif dev == "tally":
            def html(cid, dur, size, p=p, head=head, sch=sch):
                n, cols, out = int(p["value"]), 9, ""
                for k in range(n):
                    x, y = 84 + (k % cols) * 102, 520 + (k // cols) * 102
                    out += f'<i class="tile" id="{cid}-t{k}" style="left:{x}px; top:{y}px; background:{sch["c"]}; opacity:0"></i>'
                rows = (n + cols - 1) // cols
                top = 520 + rows * 102 + 10
                steps = "".join(f'<div class="step" id="{cid}-p{j}" style="top:{top + 120 + j * 72}px"><b></b>{s}</div>'
                                for j, s in enumerate(p["path"]))
                return (head(cid) + out
                        + f'<div class="num" id="{cid}-n" style="top:{520 + rows * 51 - 150}px; font-size:300px; letter-spacing:-12px; opacity:0">{n}</div>'
                        + f'<div class="kick" id="{cid}-l" style="top:{top}px; color:#fff; font-size:44px">{p["label"]}</div>' + steps)
            def js(cid, dur, size=None, p=p, head_js=head_js):
                n = int(p["value"])
                out = drift(cid, dur) + head_js(cid)
                out += (f'tl.fromTo(Array.from({{length:{n}}}, (_, k) => "#{cid}-t" + k), {{ autoAlpha:0, scale:0.2 }}, '
                        f'{{ autoAlpha:0.9, scale:1, duration:0.25, stagger:0.018, ease:"back.out(2)" }}, 0.4);')
                out += S.pop(cid, "n", 1.6, scale=1.5, dur=0.5) + S.rise(cid, "l", 1.8)
                for j in range(len(p["path"])):
                    out += S.rise(cid, f"p{j}", 2.3 + 0.35 * j, dy=24)
                return out

        elif dev == "ticket":
            def html(cid, dur, size, p=p, head=head, sch=sch):
                return (head(cid)
                        + f'<div class="ticket" data-layout-allow-overlap id="{cid}-tk" style="top:560px; height:560px">'
                          f'<div style="background:{sch["c"]}; color:{sch["ink"]}; font-weight:800; font-size:40px; letter-spacing:10px; padding:28px 50px">NFL DRAFT · {p["year"]}</div>'
                          f'<div data-layout-allow-overlap style="padding:40px 50px 0; font-size:34px; letter-spacing:6px; font-weight:800; color:#777">SELECTED BY</div>'
                          f'<div data-layout-allow-overlap style="padding:30px 50px 0; font-size:84px; line-height:0.95; font-weight:800; letter-spacing:-2px">{p["team"]}</div>'
                          f'<div style="position:absolute; left:50px; right:50px; bottom:44px; border-top:4px dashed #bbb; padding-top:24px; '
                          f'font-size:38px; font-weight:800">{p["name"]} · {sch["name"]}</div></div>'
                        + f'<div class="stamp" id="{cid}-st" style="left:560px; top:870px; font-size:64px; transform:rotate(-12deg)">{p["stamp"]}</div>'
                        + f'<div class="lbl" id="{cid}-s" style="top:1220px">{p["sub"]}</div>')
            def js(cid, dur, size=None, head_js=head_js):
                return (drift(cid, dur) + head_js(cid)
                        + f'tl.fromTo("#{cid}-tk", {{ autoAlpha:0, y:400, rotation:6 }}, {{ autoAlpha:1, y:0, rotation:-2, duration:0.7, ease:"back.out(1.3)" }}, 0.35);'
                        + f'tl.fromTo("#{cid}-st", {{ autoAlpha:0, scale:3 }}, {{ autoAlpha:1, scale:1, duration:0.28, ease:"power4.in" }}, 1.3);'
                        + f'tl.fromTo("#{cid}-tk", {{ x:0 }}, {{ x:10, duration:0.05, yoyo:true, repeat:3 }}, 1.58);'
                        + S.rise(cid, "s", 2.2, dy=30))

        elif dev == "run":
            def html(cid, dur, size, p=p, head=head):
                return (head(cid)
                        + f'<div class="bar" id="{cid}-br" style="top:700px; width:912px"></div>'
                        + f'<div class="num" id="{cid}-n" style="top:850px; font-size:300px; letter-spacing:-12px">0</div>'
                        + f'<div class="kick" id="{cid}-l" style="top:1170px; color:#fff; font-size:44px">{p["label"]}</div>'
                        + f'<div class="lbl" id="{cid}-s" style="top:1260px; text-align:center">{p["sub"]}</div>')
            def js(cid, dur, size=None, p=p, head_js=head_js):
                v = int(p["value"])
                return (drift(cid, dur, -260) + head_js(cid)
                        + f'tl.fromTo("#{cid}-br", {{ scaleX:0 }}, {{ scaleX:1, duration:1.5, ease:"power3.out" }}, 0.45);'
                        + f'(() => {{ const o = {{v:0}}; const el = document.getElementById("{cid}-n");'
                          f'tl.to(o, {{ v:{v}, duration:1.5, ease:"power3.out", onUpdate:() => {{ el.textContent = Math.round(o.v).toLocaleString("en-US"); }} }}, 0.45); }})();'
                        + S.rise(cid, "l", 1.4) + S.rise(cid, "s", 2.2, dy=30))

        elif dev == "stamps":
            def html(cid, dur, size, p=p, head=head):
                out = ""
                for j, st in enumerate(p["stamps"]):
                    rot = -8 if j % 2 == 0 else 6
                    out += (f'<div class="stamp" id="{cid}-st{j}" style="left:{70 + j * 40}px; top:{560 + j * 360}px; width:860px; '
                            f'font-size:64px; line-height:1.15; color:#fff; border-color:{B.GOLD}; background:rgba(0,0,0,0.45); transform:rotate({rot}deg)">'
                            f'<div style="color:{B.GOLD}; font-size:40px">SIGNED · {st["year"]}</div>{st["team"]}</div>')
                return head(cid) + out
            def js(cid, dur, size=None, p=p, head_js=head_js):
                out = drift(cid, dur) + head_js(cid)
                for j in range(len(p["stamps"])):
                    out += (f'tl.fromTo("#{cid}-st{j}", {{ autoAlpha:0, scale:2.6 }}, '
                            f'{{ autoAlpha:1, scale:1, duration:0.26, ease:"power4.in" }}, {0.6 + 0.9 * j:.2f});')
                return out
        else:
            raise SystemExit(f"unknown device {dev}")

        add(cid, 4.0, html, js, p["say"], glow=sch["glow"])

    e = d["end"]
    def end_html(cid, dur, size):
        return (f'<div class="big" id="{cid}-t" style="top:330px; font-size:140px; white-space:nowrap">{e["title"]}</div>'
                f'<img class="badge" id="{cid}-b1" src="public/badge-braves.png" style="left:130px; top:640px; width:360px; height:360px" />'
                f'<img class="badge" id="{cid}-b2" src="public/badge-conqs.png" style="left:590px; top:640px; width:360px; height:360px" />'
                f'<div class="kick" id="{cid}-k" style="top:1090px; color:#fff">{e["kick"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; text-align:center; top:1180px"><span class="pill">{e["url"]}</span></div>')
    def end_js(cid, dur, size=None):
        return (drift(cid, dur, -80) + S.pop(cid, "t", 0.1, scale=1.4, dur=0.5)
                + f'tl.fromTo("#{cid}-b1", {{ autoAlpha:0, x:-300 }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"back.out(1.4)" }}, 0.45);'
                + f'tl.fromTo("#{cid}-b2", {{ autoAlpha:0, x:300 }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"back.out(1.4)" }}, 0.45);'
                + S.rise(cid, "k", 0.9) + S.pop(cid, "u", 1.2, scale=1.15, dur=0.45))
    add(f"s{len(d['players']) + 1}-end", 4.2, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "HOMETOWN PROS"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets={}, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.1, fade_out=1.2)],
                 note="Hometown pros: turf field, school badges, one device per player; no player photos or team logos.")
