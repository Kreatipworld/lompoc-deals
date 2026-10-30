"""SHOP LAUNCH — a local entrepreneur story for a new shop, drag-strip style.

Built Oct 30 2026 for Rock Brothers Performance (two brothers going from a home
garage to their own Lompoc shop). Not a member spot: their logo and the cars
from their own post carry it, and every scene has its own device:

    cover   logo on black with checkered bars (frame 0 is the thumbnail)
    tree    drag-strip starting lights count down to the names
    skills  their photo with the trades slamming in as plates
    tach    second photo while a tach needle sweeps into the red
    door    a roll-up shop door opens on the line
    flag    checkered flag waves over the opening date

    python3 _kit/make.py shop-launch --data @launch.json --out out/<project> --vo out/<project>/public

Data contract:
    slug, title, red (accent)
    cover  {kick, line, say}
    tree   {names: [{name, age}], say}
    skills {photo, line, plates: [..], say}
    tach   {photo, big, line, say}
    door   {line, say}
    flag   {date, sub, line, support, handle, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video


def _checker(cid, key, top, rows=3, cell=60):
    out = ""
    for r in range(rows):
        for c in range(20):
            if (r + c) % 2 == 0:
                out += f'<i style="position:absolute; left:{c * cell}px; top:{r * cell}px; width:{cell}px; height:{cell}px; background:#fff"></i>'
    return f'<div class="chk" id="{cid}-{key}" style="top:{top}px; height:{rows * cell}px">{out}</div>'


def _tach(cid):
    ticks = ""
    for i in range(11):
        a = -120 + i * 24
        col = RED if i >= 8 else "#fff"
        ticks += (f'<g transform="rotate({a} 300 300)"><rect x="294" y="34" width="12" height="46" fill="{col}"/>'
                  f'<text x="300" y="118" fill="{col}" font-size="40" font-weight="800" text-anchor="middle" '
                  f'transform="rotate({-a} 300 104)">{i}</text></g>')
    return (f'<svg viewBox="0 0 600 600" style="width:100%;height:100%"><circle cx="300" cy="300" r="290" fill="#0b0b0d" stroke="#fff" stroke-width="10"/>'
            f'{ticks}<g id="{cid}-nd"><polygon points="290,310 310,310 302,70 298,70" fill="{RED}"/></g>'
            f'<circle cx="300" cy="300" r="34" fill="#fff"/></svg>')


RED = "#e0202a"


def build(d: dict) -> Video:
    global RED
    RED = d.get("red", RED)
    scenes, subs = [], []
    src = lambda k: f"public/{k}"

    def css(cid):
        s = f'[data-composition-id="{cid}"]'
        return f"""<style>
          {s} .mark {{ display:none; }}
          {s} .bg {{ position:absolute; inset:0; background:radial-gradient(ellipse 90% 55% at 50% 38%, #2b0d10 0%, #0d0b0d 60%, #050505 100%); }}
          {s} .chk {{ position:absolute; left:-60px; width:1200px; background:#0a0a0a; overflow:hidden; }}
          {s} .kick {{ position:absolute; left:0; right:0; text-align:center; font-weight:800; font-size:40px; letter-spacing:9px; color:{RED}; text-transform:uppercase; }}
          {s} .big {{ position:absolute; left:84px; right:84px; color:#fff; font-weight:800; line-height:0.96; letter-spacing:-3px; }}
          {s} .big em {{ font-style:normal; color:{RED}; }}
          {s} .frame {{ position:absolute; left:60px; right:60px; overflow:hidden; border-radius:18px; border:6px solid #fff; box-shadow:0 30px 70px rgba(0,0,0,0.7); }}
          {s} .frame img {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .plate {{ position:absolute; font-weight:800; font-size:58px; color:#fff; background:{RED}; padding:16px 30px; border-radius:10px;
                        transform:skewX(-10deg); white-space:nowrap; box-shadow:0 14px 30px rgba(0,0,0,0.6); }}
          {s} .lamp {{ position:absolute; left:120px; width:150px; height:150px; border-radius:50%; background:#2a2620; border:8px solid #444; }}
          {s} .lamp i {{ position:absolute; inset:0; border-radius:50%; display:block; opacity:0; }}
          {s} .pole {{ position:absolute; left:186px; width:18px; top:420px; height:1050px; background:#333; }}
          {s} .nm {{ position:absolute; left:340px; right:60px; color:#fff; font-weight:800; font-size:150px; line-height:0.9; letter-spacing:-4px; text-transform:uppercase; }}
          {s} .nm b {{ display:block; font-size:80px; letter-spacing:-1px; color:{RED}; margin-top:12px; }}
          {s} .door {{ position:absolute; left:0; right:0; top:0; height:1500px; z-index:4;
                       background:repeating-linear-gradient(180deg, #8c9096 0px, #a9adb3 70px, #6a6e74 74px, #8c9096 78px); }}
          {s} .pill {{ display:inline-block; background:#fff; color:#111; font-weight:800; font-size:50px; padding:20px 38px; border-radius:999px; }}
        </style><div class="bg"></div>"""

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, lambda c, du, sz, h=html: css(c) + h(c, du, sz), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    # cover: fully composed at frame 0
    c = d["cover"]
    def cover_html(cid, dur, size):
        return (_checker(cid, "c1", 100) + f'<div class="kick" style="top:330px">{c["kick"]}</div>'
                f'<img id="{cid}-lg" src="{src("logo.png")}" style="position:absolute; left:50px; top:400px; width:980px" />'
                f'<div class="big" id="{cid}-l" style="top:1090px; font-size:104px; text-align:center">{c["line"]}</div>'
                + _checker(cid, "c2", 1500))
    def cover_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-c1", {{ x:0 }}, {{ x:-60, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-c2", {{ x:-60 }}, {{ x:0, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-lg", {{ scale:1 }}, {{ scale:1.05, duration:{dur:.2f}, ease:"none" }}, 0);')
    add("s0-cover", 3.0, cover_html, cover_js, c["say"])

    # tree: three ambers, then green, then the names
    t = d["tree"]
    def tree_html(cid, dur, size):
        lamps = ""
        for i, col in enumerate(["#ffb000", "#ffb000", "#ffb000", "#19e04b"]):
            lamps += (f'<div class="lamp" style="top:{400 + i * 220}px"><i id="{cid}-lp{i}" '
                      f'style="background:{col}; box-shadow:0 0 70px 24px {col}"></i></div>')
        names = ""
        for i, n in enumerate(t["names"]):
            names += f'<div class="nm" id="{cid}-n{i}" style="top:{450 + i * 460}px">{n["name"]}<b>Age {n["age"]}</b></div>'
        return f'<div class="pole"></div>{lamps}{names}'
    def tree_js(cid, dur, size=None):
        out = ""
        for i in range(4):
            out += f'tl.fromTo("#{cid}-lp{i}", {{ opacity:0 }}, {{ opacity:1, duration:0.05 }}, {0.15 + i * 0.28:.2f});'
        for i in range(len(t["names"])):
            out += (f'tl.fromTo("#{cid}-n{i}", {{ autoAlpha:0, x:500 }}, {{ autoAlpha:1, x:0, duration:0.3, ease:"power4.out" }}, {1.05 + i * 0.5:.2f});')
        return out
    add("s1-tree", 3.6, tree_html, tree_js, t["say"])

    # skills: the photo with trades slamming in
    k = d["skills"]
    def skills_html(cid, dur, size):
        xy = [(70, 860), (510, 860), (70, 1000), (510, 1000)]
        pl = "".join(f'<div class="plate" id="{cid}-p{i}" style="left:{xy[i][0]}px; top:{xy[i][1]}px">{x}</div>' for i, x in enumerate(k["plates"]))
        return (f'<div class="frame" style="top:230px; height:600px"><img id="{cid}-im" src="{src(k["photo"])}" /></div>'
                f'{pl}<div class="big" id="{cid}-l" style="top:1170px; font-size:84px">{k["line"]}</div>')
    def skills_js(cid, dur, size=None):
        out = f'tl.fromTo("#{cid}-im", {{ scale:1.16, x:-34 }}, {{ scale:1.04, x:20, duration:{dur:.2f}, ease:"none" }}, 0);' + S.rise(cid, "l", 0.1, dy=40)
        for i in range(len(k["plates"])):
            out += f'tl.fromTo("#{cid}-p{i}", {{ autoAlpha:0, scale:2.4 }}, {{ autoAlpha:1, scale:1, duration:0.2, ease:"power4.in" }}, {1.4 + i * 0.5:.2f});'
        return out
    add("s2-skills", 4.6, skills_html, skills_js, k["say"])

    # tach: needle sweeps to the redline over the second photo
    a = d["tach"]
    def tach_html(cid, dur, size):
        return (f'<div class="frame" style="top:150px; height:560px"><img id="{cid}-im" src="{src(a["photo"])}" /></div>'
                f'<div id="{cid}-t" style="position:absolute; left:60px; top:760px; width:470px; height:470px">{_tach(cid)}</div>'
                f'<div class="big" id="{cid}-b" style="left:555px; right:50px; top:830px; font-size:150px; letter-spacing:-6px; color:{RED}">{a["big"]}</div>'
                f'<div class="big" id="{cid}-l" style="top:1260px; font-size:72px">{a["line"]}</div>')
    def tach_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-im", {{ scale:1.04, x:26 }}, {{ scale:1.16, x:-26, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-nd", {{ rotation:-120, svgOrigin:"300 300" }}, {{ rotation:96, svgOrigin:"300 300", duration:1.5, ease:"power2.in" }}, 0.3);'
                f'tl.to("#{cid}-nd", {{ rotation:90, duration:0.08, yoyo:true, repeat:9, ease:"none" }}, 1.8);'
                + S.pop(cid, "b", 1.5, scale=1.6, dur=0.3) + S.rise(cid, "l", 0.5, dy=40))
    add("s3-tach", 4.2, tach_html, tach_js, a["say"])

    # door: the roll-up opens on the line and logo
    r = d["door"]
    def door_html(cid, dur, size):
        return (f'<div style="position:absolute; left:0; right:0; top:0; height:1920px; background:radial-gradient(ellipse 80% 45% at 50% 32%, #7a1418 0%, #3a0c0f 55%, rgba(13,11,13,0) 100%)"></div>'
                f'<img id="{cid}-lg" src="{src("logo.png")}" style="position:absolute; left:110px; top:300px; width:860px" />'
                f'<div class="big" id="{cid}-l" style="top:960px; font-size:112px; text-align:center">{r["line"]}</div>'
                f'<div class="door" id="{cid}-d"></div>')
    def door_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-d", {{ y:0 }}, {{ y:-1520, duration:1.3, ease:"power2.inOut" }}, 0.2);'
                f'tl.fromTo("#{cid}-lg", {{ scale:0.9 }}, {{ scale:1.03, duration:{dur:.2f}, ease:"none" }}, 0);'
                + S.rise(cid, "l", 1.2, dy=40))
    add("s4-door", 4.2, door_html, door_js, r["say"])

    # flag: checkered rows wave across the opening date
    f = d["flag"]
    def flag_html(cid, dur, size):
        rows = "".join(f'<div id="{cid}-r{i}" style="position:absolute; left:0; top:{i * 60}px; width:1200px; height:60px">' +
                       "".join(f'<i style="position:absolute; left:{c * 60}px; top:0; width:60px; height:60px; background:{"#fff" if (i + c) % 2 == 0 else "#0a0a0a"}"></i>' for c in range(20)) +
                       '</div>' for i in range(5))
        return (f'<div id="{cid}-fl" style="position:absolute; left:-60px; top:170px; width:1200px; height:300px">{rows}</div>'
                f'<div class="kick" id="{cid}-k" style="top:560px">{f["sub"]}</div>'
                f'<div class="big" id="{cid}-b" style="top:630px; font-size:170px; text-align:center; letter-spacing:-6px">{f["date"]}</div>'
                f'<div class="big" id="{cid}-l" style="top:830px; font-size:76px; text-align:center">{f["line"]}</div>'
                f'<div class="kick" id="{cid}-s" style="top:1110px; color:#fff; font-size:50px">{f["support"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; text-align:center; top:1200px"><span class="pill">{f["handle"]}</span></div>')
    def flag_js(cid, dur, size=None):
        out = ""
        for i in range(5):
            out += (f'tl.fromTo("#{cid}-r{i}", {{ x:-60 + {i * 6}, y:-16 }}, {{ x:0, y:16, duration:0.5, yoyo:true, repeat:{int(dur / 0.5)}, ease:"sine.inOut" }}, {i * 0.05:.2f});')
        return out + S.rise(cid, "k", 0.2) + S.pop(cid, "b", 0.4, scale=1.4, dur=0.4) + S.rise(cid, "l", 0.7, dy=40) + S.pop(cid, "s", 3.4, scale=1.4, dur=0.3) + S.pop(cid, "u", 4.6, scale=1.15, dur=0.4)
    add("s5-flag", 4.4, flag_html, flag_js, f["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "SHOP LAUNCH"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets={}, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.1, fade_out=1.2)],
                 note="Shop launch: drag tree, tach sweep, roll-up door, checkered flag; their logo and post photos.")
