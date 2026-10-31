"""HALLOWEEN NIGHT — what is on tonight, as one haunted evening.

Built Oct 31 2026. Own drawn art only, every scene has its own device:

    cover    full moon, town skyline, bats (frame 0 is the thumbnail)
    pumpkin  a patch of pumpkins pops up, the big one lights its face
    rain     a cloud slides over the moon, rain falls
    bag      a candy bag drops in and pops candy
    trunk    a car trunk flies open on a burst of candy, then the two stops
    ghosts   a flashlight sweeps a dark building, the meter climbs, a ghost shows
    candy    candy rains into a pile, a ghost holds the sign
    end      a door swings open on the logo and the link

    python3 _kit/make.py halloween-night --data @night.json --out out/<project> --vo out/<project>/public --gap 0.16

Data contract: slug, title
    cover   {kick, line, say}
    pumpkin {photo, name, what, until, say}
    trunk   {time, line, stops: [{name, where, tag}], say}
    rain    {line, sub, say}
    bag     {time, line, name, where, say}
    ghosts  {time, line, name, tag, say}
    candy   {line, sub, say}
    end     {line, url, say}
"""
import random

from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

OR, GOLD, PUR, GRN = "#ff7a1a", "#efc618", "#650c75", "#0b992f"
CANDY = ["#ff7a1a", "#efc618", "#b14fd0", "#3fd46a", "#ff4f7a"]


def _pumpkin(cid, key, face=False):
    glow = (f'<g id="{cid}-{key}f" fill="#ffe27a"><polygon points="62,74 88,74 75,50"/><polygon points="112,74 138,74 125,50"/>'
            f'<path d="M52 98 Q100 150 148 98 L132 106 L122 96 L110 108 L100 98 L90 108 L78 96 L68 106 Z"/></g>') if face else ""
    return (f'<svg viewBox="0 0 200 180" style="width:100%;height:100%"><rect x="90" y="4" width="20" height="34" rx="6" fill="#3f7a2c"/>'
            f'<ellipse cx="42" cy="100" rx="38" ry="62" fill="#d9590c"/><ellipse cx="158" cy="100" rx="38" ry="62" fill="#d9590c"/>'
            f'<ellipse cx="72" cy="100" rx="42" ry="72" fill="#ee6c12"/><ellipse cx="128" cy="100" rx="42" ry="72" fill="#ee6c12"/>'
            f'<ellipse cx="100" cy="100" rx="38" ry="74" fill="#ff8420"/>{glow}</svg>')


def _ghost():
    return ('<svg viewBox="0 0 300 360" style="width:100%;height:100%"><path fill="#f6f2ff" d="M30 340V140a120 120 0 01240 0v200l-40-34-40 34-40-34-40 34-40-34z"/>'
            '<ellipse cx="110" cy="130" rx="22" ry="32" fill="#160620"/><ellipse cx="190" cy="130" rx="22" ry="32" fill="#160620"/><ellipse cx="150" cy="200" rx="20" ry="26" fill="#160620"/></svg>')


def _bag():
    return ('<svg viewBox="0 0 300 380" style="width:100%;height:100%"><path fill="#c98f52" d="M30 70h240l14 300H16z"/><path fill="#b27a42" d="M30 70h240l-20 36H50z"/>'
            '<path fill="#160620" d="M100 170l30 44h-60zM200 170l30 44h-60zM90 262q60 56 120 0l-20 8-14-14-14 16-12-16-14 16-14-16-14 14z"/></svg>')


def _skyline():
    # Low town silhouette with a water tower and a mission-style bell gable.
    return ('<svg viewBox="0 0 1080 520" preserveAspectRatio="none" style="position:absolute;left:0;bottom:0;width:100%;height:520px">'
            '<path fill="#1c0a2a" d="M0 520V300h70v-50h90v70h60v-130l50-50 50 50v130h70v-90h120v60h50v-40h20v-70h70v70h20v80h110V210h24v-40l40-40 40 40v40h24v110h102v200z"/>'
            + "".join(f'<rect x="{x}" y="{y}" width="26" height="36" rx="3" fill="#ffc24a"/>' for x, y in [(90, 330), (130, 400), (250, 300), (300, 380), (440, 340), (480, 410), (620, 390), (700, 330), (790, 430), (900, 300), (960, 400)]) +
            '</svg>')


def build(d: dict) -> Video:
    scenes, subs = [], []
    src = lambda k: f"public/{k}"

    def css(cid):
        s = f'[data-composition-id="{cid}"]'
        return f"""<style>
          @font-face {{ font-family:'Creepster'; src:url('public/Creepster.ttf'); }}
          {s} .mark {{ display:none; }}
          {s} .bg {{ position:absolute; inset:0; background:radial-gradient(ellipse 100% 60% at 50% 30%, #3a1050 0%, #170724 55%, #07030c 100%); }}
          {s} .scare {{ position:absolute; left:50px; right:50px; text-align:center; font-family:'Creepster'; color:{OR}; line-height:0.95; letter-spacing:3px;
                        text-shadow:0 8px 0 #000, 0 0 50px rgba(255,122,26,0.55); }}
          {s} .scare em {{ font-style:normal; color:{GOLD}; }}
          {s} .kick {{ position:absolute; left:0; right:0; text-align:center; font-weight:800; font-size:44px; letter-spacing:8px; color:#fff; text-transform:uppercase; text-shadow:0 4px 18px #000; }}
          {s} .line {{ position:absolute; left:70px; right:70px; text-align:center; color:#fff; font-weight:800; line-height:1.05; letter-spacing:-1.5px; text-shadow:0 4px 18px #000; }}
          {s} .line em {{ font-style:normal; color:{GOLD}; }}
          {s} .frame {{ position:absolute; left:70px; right:70px; overflow:hidden; border-radius:22px; border:6px solid {OR}; box-shadow:0 0 70px rgba(255,122,26,0.45); }}
          {s} .frame img {{ width:100%; height:100%; object-fit:cover; display:block; }}
          {s} .card {{ position:absolute; left:70px; right:70px; padding:30px 40px; border-radius:22px; background:rgba(16,6,26,0.92); border:5px solid {OR}; }}
          {s} .card b {{ display:block; color:#fff; font-size:64px; font-weight:800; letter-spacing:-1.5px; line-height:1.05; }}
          {s} .card span {{ display:block; color:{GOLD}; font-size:44px; font-weight:700; margin-top:8px; }}
          {s} .card i {{ position:absolute; right:30px; top:26px; font-style:normal; background:{GRN}; color:#fff; font-weight:800; font-size:44px; padding:8px 26px; border-radius:999px; }}
          {s} .pill {{ display:inline-block; background:{OR}; color:#160620; font-weight:800; font-size:54px; padding:22px 42px; border-radius:999px; }}
          {s} .piece {{ position:absolute; width:52px; height:52px; border-radius:50%; }}
          {s} .piece:before, {s} .piece:after {{ content:''; position:absolute; top:10px; border-top:16px solid transparent; border-bottom:16px solid transparent; }}
          {s} .piece:before {{ left:-22px; border-right:28px solid currentColor; }}
          {s} .piece:after {{ right:-22px; border-left:28px solid currentColor; }}
        </style><div class="bg"></div>"""

    def add(cid, html, js, say, text=None):
        scenes.append(Scene(cid, 0.0, 4.0, lambda c, du, sz, h=html: css(c) + h(c, du, sz), js, lines=(len(subs),)))
        subs.append(Sub(0.0, 4.0, text or say, say=say))

    def bats(cid, n=3):
        return "".join(f'<img id="{cid}-b{i}" src="{src("bat.png")}" style="position:absolute; width:{[300, 190, 240][i % 3]}px; left:{[640, 90, 420][i % 3]}px; top:{[120, 1010, 1150][i % 3]}px" />' for i in range(n))

    def bats_js(cid, dur, n=3):
        out = ""
        for i in range(n):
            sign = -1 if i % 2 else 1
            out += (f'tl.fromTo("#{cid}-b{i}", {{ x:{sign * 60}, y:0 }}, {{ x:{sign * -260}, y:-50, duration:{dur:.2f}, ease:"none" }}, 0);'
                    f'tl.fromTo("#{cid}-b{i}", {{ scaleY:1 }}, {{ scaleY:0.65, duration:0.14, yoyo:true, repeat:{int(dur / 0.14)}, ease:"sine.inOut" }}, 0);')
        return out

    c = d["cover"]
    def cover_html(cid, dur, size):
        return (f'<div id="{cid}-m" style="position:absolute; left:140px; top:190px; width:800px; height:800px; border-radius:50%; '
                f'background:radial-gradient(circle at 42% 40%, #fff3b8 0%, #f7c948 55%, #e08a16 100%); box-shadow:0 0 170px 60px rgba(247,180,60,0.5)"></div>'
                + _skyline() + bats(cid) +
                f'<div class="kick" style="top:300px; color:#2a0a36; text-shadow:none">{c["kick"]}</div>'
                f'<div class="scare" id="{cid}-t" style="top:420px; font-size:230px; color:#1a0822; text-shadow:0 0 30px rgba(255,240,180,0.6)">{c["line"]}</div>')
    def cover_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-m", {{ scale:1 }}, {{ scale:1.08, duration:{dur:.2f}, ease:"none" }}, 0);'
                f'tl.fromTo("#{cid}-t", {{ scale:1 }}, {{ scale:1.05, duration:{dur:.2f}, ease:"none" }}, 0);' + bats_js(cid, dur))
    add("s0-cover", cover_html, cover_js, c["say"])

    r = d["rain"]
    random.seed(5)
    drops = [(random.randint(0, 1160), random.randint(-300, 1700), random.uniform(0.35, 0.6)) for _ in range(70)]
    def rain_html(cid, dur, size):
        ds = "".join(f'<div id="{cid}-r{i}" style="position:absolute; left:{x}px; top:{y}px; width:6px; height:90px; border-radius:3px; background:linear-gradient(180deg,rgba(190,215,255,0),#bcd7ff); transform:rotate(12deg)"></div>' for i, (x, y, _) in enumerate(drops))
        cloud = ('<svg viewBox="0 0 700 300" style="width:100%;height:100%"><g fill="#40374f"><circle cx="190" cy="180" r="110"/><circle cx="350" cy="130" r="130"/><circle cx="520" cy="185" r="105"/><rect x="100" y="180" width="510" height="105" rx="50"/></g></svg>')
        return (f'<div style="position:absolute; left:290px; top:230px; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle at 42% 40%, #fff3b8, #f7c948 60%, #e08a16); box-shadow:0 0 110px 30px rgba(247,180,60,0.4)"></div>'
                f'<div id="{cid}-cl" style="position:absolute; left:190px; top:380px; width:760px; height:330px">{cloud}</div>{ds}'
                f'<div class="scare" id="{cid}-t" style="top:800px; font-size:170px; color:#bcd7ff; text-shadow:0 8px 0 #000, 0 0 40px rgba(120,170,255,0.5)">{r["line"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:1010px; font-size:80px">{r["sub"]}</div>')
    def rain_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-cl", {{ x:-720 }}, {{ x:0, duration:1.0, ease:"power2.out" }}, 0);'
               + S.pop(cid, "t", 0.3, scale=1.5, dur=0.3) + S.rise(cid, "l", 0.8, dy=40))
        for i, (_, y, sp) in enumerate(drops):
            n = int(dur / sp) + 1
            out += f'tl.fromTo("#{cid}-r{i}", {{ y:{-y - 200}, x:0 }}, {{ y:{2000 - y}, x:-230, duration:{sp:.2f}, ease:"none", repeat:{n} }}, {i % 7 * 0.05:.2f});'
        return out
    add("s1-rain", rain_html, rain_js, r["say"], text=r["line"])

    p = d["pumpkin"]
    def pumpkin_html(cid, dur, size):
        spots = [(40, 300), (760, 300), (280, 270), (560, 260)]
        small = "".join(f'<div id="{cid}-p{i}" style="position:absolute; left:{x}px; bottom:{y}px; width:{270 if i < 2 else 240}px; height:{240 if i < 2 else 216}px">{_pumpkin(cid, f"s{i}")}</div>' for i, (x, y) in enumerate(spots))
        return (f'<div class="frame" style="top:190px; height:470px"><img id="{cid}-im" src="{src(p["photo"])}" /></div>'
                f'<div class="kick" id="{cid}-k" style="top:700px; color:{GOLD}">{p["what"]}</div>'
                f'<div class="scare" id="{cid}-t" style="top:770px; font-size:150px">{p["name"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:930px; font-size:84px">{p["until"]}</div>'
                f'<div style="position:absolute; left:0; right:0; bottom:0; height:320px; background:linear-gradient(180deg,#12301a,#07030c)"></div>{small}'
                f'<div id="{cid}-big" style="position:absolute; left:340px; bottom:60px; width:400px; height:360px">{_pumpkin(cid, "big", True)}</div>')
    def pumpkin_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-im", {{ scale:1.14 }}, {{ scale:1.02, duration:{dur:.2f}, ease:"none" }}, 0);'
               + S.rise(cid, "k", 0.1) + S.pop(cid, "t", 0.25, scale=1.5, dur=0.3) + S.rise(cid, "l", 0.6, dy=40))
        for i in range(4):
            out += f'tl.fromTo("#{cid}-p{i}", {{ y:300, autoAlpha:0 }}, {{ y:0, autoAlpha:1, duration:0.32, ease:"back.out(2)" }}, {0.15 + i * 0.15:.2f});'
        return (out + f'tl.fromTo("#{cid}-big", {{ y:400 }}, {{ y:0, duration:0.4, ease:"back.out(1.8)" }}, 0.7);'
                f'tl.fromTo("#{cid}-bigf", {{ opacity:0 }}, {{ opacity:1, duration:0.1, yoyo:true, repeat:6, ease:"none" }}, 1.0);')
    add("s2-pumpkin", pumpkin_html, pumpkin_js, p["say"], text=f'{p["name"]} {p["until"]}')

    b = d["bag"]
    random.seed(9)
    pop = [(random.randint(-430, 430), random.randint(-520, -120), random.randint(-300, 300), CANDY[i % 5]) for i in range(20)]
    def bag_html(cid, dur, size):
        cand = "".join(f'<div class="piece" id="{cid}-c{i}" style="left:515px; top:1000px; background:{col}; color:{col}"></div>' for i, (_, _, _, col) in enumerate(pop))
        return (f'<div class="scare" id="{cid}-tm" style="top:170px; font-size:200px">{b["time"]}</div>'
                f'<div class="scare" id="{cid}-t" style="top:370px; font-size:136px; color:#fff">{b["line"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:520px; font-size:70px">{b["name"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; text-align:center; top:620px"><span class="pill">{b["where"]}</span></div>'
                f'{cand}<div id="{cid}-b" style="position:absolute; left:340px; top:800px; width:400px; height:506px">{_bag()}</div>')
    def bag_js(cid, dur, size=None):
        out = (S.pop(cid, "tm", 0.1, scale=1.6, dur=0.3) + S.pop(cid, "t", 0.35, scale=1.5, dur=0.3) + S.rise(cid, "l", 0.6, dy=40) + S.pop(cid, "u", 0.9, scale=1.3, dur=0.3) +
               f'tl.fromTo("#{cid}-b", {{ y:900 }}, {{ y:0, duration:0.45, ease:"back.out(1.5)" }}, 0.25);'
               f'tl.to("#{cid}-b", {{ rotation:4, duration:0.12, yoyo:true, repeat:5, ease:"sine.inOut" }}, 0.8);')
        for i, (x, y, rr, _) in enumerate(pop):
            at = 0.85 + i * 0.05
            out += (f'tl.fromTo("#{cid}-c{i}", {{ x:0, y:0, rotation:0 }}, {{ x:{x}, y:{y}, rotation:{rr}, duration:0.5, ease:"power2.out" }}, {at:.2f});'
                    f'tl.to("#{cid}-c{i}", {{ y:{y + 1300}, rotation:{rr * 2}, duration:0.9, ease:"power2.in" }}, {at + 0.5:.2f});')
        return out
    add("s3-bag", bag_html, bag_js, b["say"], text=b["line"])

    t = d["trunk"]
    random.seed(31)
    pieces = [(random.randint(-470, 470), random.randint(-640, -160), random.randint(-300, 300), CANDY[i % 5]) for i in range(26)]
    def trunk_html(cid, dur, size):
        cand = "".join(f'<div class="piece" id="{cid}-c{i}" style="left:505px; top:760px; background:{col}; color:{col}"></div>' for i, (_, _, _, col) in enumerate(pieces))
        cards = "".join(f'<div class="card" id="{cid}-s{i}" style="top:{880 + i * 230}px"><b>{s["name"]}</b><span>{s["where"]}</span>' + (f'<i>{s["tag"]}</i>' if s.get("tag") else "") + '</div>' for i, s in enumerate(t["stops"]))
        return (f'<div class="scare" id="{cid}-tm" style="top:170px; font-size:200px">{t["time"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:360px; font-size:88px">{t["line"]}</div>'
                f'<div id="{cid}-car" style="position:absolute; left:190px; top:700px; width:700px; height:150px; background:linear-gradient(180deg,#c21f2c,#7a0f18); border-radius:26px 26px 12px 12px; z-index:3">'
                f'<div style="position:absolute; left:40px; top:44px; width:92px; height:42px; background:#ffb000; border-radius:8px; box-shadow:0 0 30px #ffb000"></div>'
                f'<div style="position:absolute; right:40px; top:44px; width:92px; height:42px; background:#ffb000; border-radius:8px; box-shadow:0 0 30px #ffb000"></div>'
                f'<div style="position:absolute; left:250px; top:60px; width:200px; height:60px; background:#f4f1e6; border-radius:8px; color:#20102a; font-weight:800; font-size:38px; text-align:center; line-height:60px">L0MP0C</div></div>'
                f'<div id="{cid}-gl" style="position:absolute; left:210px; top:560px; width:660px; height:150px; background:radial-gradient(ellipse at 50% 100%, #ffe27a 0%, rgba(255,160,40,0.75) 45%, rgba(255,120,20,0) 75%); z-index:1"></div>'
                f'<div id="{cid}-lid" style="position:absolute; left:190px; top:560px; width:700px; height:150px; background:linear-gradient(180deg,#a01824,#d62a38); border-radius:30px 30px 6px 6px; z-index:4; transform-origin:50% 0%"></div>'
                f'{cand}{cards}')
    def trunk_js(cid, dur, size=None):
        c1 = 1.9
        c2 = max(c1 + 1.4, dur - 2.2)
        out = (S.pop(cid, "tm", 0.1, scale=1.6, dur=0.3) + S.rise(cid, "l", 0.35, dy=40) +
               f'tl.fromTo("#{cid}-gl", {{ opacity:0 }}, {{ opacity:1, duration:0.25 }}, 0.75);'
               f'tl.fromTo("#{cid}-lid", {{ rotationX:0, y:0 }}, {{ rotationX:-72, y:-40, duration:0.4, ease:"back.out(1.6)", transformPerspective:900 }}, 0.7);')
        for i, (x, y, r, _) in enumerate(pieces):
            at = 0.78 + i * 0.012
            out += (f'tl.fromTo("#{cid}-c{i}", {{ x:0, y:0, autoAlpha:1, rotation:0 }}, {{ x:{x}, y:{y}, rotation:{r}, duration:0.6, ease:"power2.out" }}, {at:.2f});'
                    f'tl.to("#{cid}-c{i}", {{ y:{y + 2100}, rotation:{r * 2}, duration:1.1, ease:"power2.in" }}, {at + 0.6:.2f});')
        out += f'tl.fromTo("#{cid}-s0", {{ autoAlpha:0, x:-900 }}, {{ autoAlpha:1, x:0, duration:0.35, ease:"power3.out" }}, {c1:.2f});'
        out += f'tl.fromTo("#{cid}-s1", {{ autoAlpha:0, x:900 }}, {{ autoAlpha:1, x:0, duration:0.35, ease:"power3.out" }}, {c2:.2f});'
        return out
    add("s4-trunk", trunk_html, trunk_js, t["say"], text=t["line"])

    m = d["ghosts"]
    def ghosts_html(cid, dur, size):
        house = ('<svg viewBox="0 0 1080 760" style="width:100%;height:100%"><path fill="#2b1a3a" d="M120 760V300h220v-90h400v90h220v460z"/><path fill="#3a2650" d="M340 210l200-120 200 120z"/>'
                 + "".join(f'<rect x="{x}" y="{y}" width="80" height="120" rx="40" fill="#120718"/>' for x in (190, 380, 620, 810) for y in (360, 540)) +
                 '<rect x="480" y="560" width="120" height="200" fill="#120718"/></svg>')
        meter = "".join(f'<div id="{cid}-m{i}" style="position:absolute; left:{i * 62}px; bottom:0; width:48px; height:{50 + i * 11}px; border-radius:6px; background:{GRN if i < 5 else (GOLD if i < 8 else "#e0202a")}"></div>' for i in range(10))
        return (f'<div style="position:absolute; left:0; right:0; top:560px; height:760px">{house}</div>'
                f'<div id="{cid}-g" style="position:absolute; left:610px; top:900px; width:230px; height:276px">{_ghost()}</div>'
                f'<div id="{cid}-dk" style="position:absolute; inset:0; background:radial-gradient(circle 300px at 50% 50%, rgba(0,0,0,0) 0%, rgba(4,1,8,0.15) 55%, rgba(4,1,8,0.95) 100%); width:3000px; height:3000px; left:-960px; top:-420px"></div>'
                f'<div class="scare" id="{cid}-tm" style="top:170px; font-size:200px">{m["time"]}</div>'
                f'<div class="scare" id="{cid}-t" style="top:370px; font-size:136px; color:#fff">{m["line"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:520px; font-size:70px">{m["name"]}</div>'
                f'<div style="position:absolute; left:230px; top:1340px; width:620px; height:150px">{meter}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; text-align:center; top:1520px"><span class="pill">{m["tag"]}</span></div>')
    def ghosts_js(cid, dur, size=None):
        out = (S.pop(cid, "tm", 0.1, scale=1.6, dur=0.3) + S.pop(cid, "t", 0.35, scale=1.5, dur=0.3) + S.rise(cid, "l", 0.6, dy=40) + S.pop(cid, "u", max(1.2, dur - 1.5), scale=1.3, dur=0.3) +
               f'tl.fromTo("#{cid}-dk", {{ x:-320, y:60 }}, {{ x:270, y:-40, duration:{dur * 0.6:.2f}, ease:"sine.inOut" }}, 0);'
               f'tl.fromTo("#{cid}-g", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.25, ease:"back.out(2)" }}, {dur * 0.55:.2f});')
        for i in range(10):
            hit = dur * 0.2 + i * dur * 0.035
            out += f'tl.fromTo("#{cid}-m{i}", {{ opacity:0.15 }}, {{ opacity:1, duration:0.06 }}, {hit:.2f});'
        return out
    add("s5-ghosts", ghosts_html, ghosts_js, m["say"], text=m["line"])

    k = d["candy"]
    random.seed(13)
    rain = [(random.randint(20, 1000), random.randint(1380, 1800), random.randint(-200, 200), CANDY[i % 5], random.uniform(0, 1.6)) for i in range(60)]
    def candy_html(cid, dur, size):
        pc = "".join(f'<div class="piece" id="{cid}-c{i}" style="left:{x}px; top:-80px; background:{col}; color:{col}"></div>' for i, (x, _, _, col, _) in enumerate(rain))
        ghost = _ghost()
        return (f'<div id="{cid}-g" style="position:absolute; left:365px; top:170px; width:350px; height:420px">{ghost}</div>'
                f'<div class="scare" id="{cid}-t" style="top:620px; font-size:240px">{k["line"]}</div>'
                f'<div class="line" id="{cid}-l" style="top:880px; font-size:88px">{k["sub"]}</div>{pc}')
    def candy_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-g", {{ y:-40 }}, {{ y:30, duration:0.9, yoyo:true, repeat:{int(dur / 0.9)}, ease:"sine.inOut" }}, 0);'
               + S.pop(cid, "t", 0.15, scale=1.5, dur=0.3) + S.rise(cid, "l", 0.7, dy=40))
        for i, (_, y, r, _, at) in enumerate(rain):
            out += f'tl.fromTo("#{cid}-c{i}", {{ y:0, rotation:0 }}, {{ y:{y}, rotation:{r}, duration:0.8, ease:"power2.in" }}, {min(at, max(0.1, dur - 1.0)):.2f});'
        return out
    add("s6-candy", candy_html, candy_js, k["say"], text=k["line"])

    e = d["end"]
    def end_html(cid, dur, size):
        return (f'<div style="position:absolute; left:190px; top:230px; width:700px; height:900px; border-radius:350px 350px 0 0; background:radial-gradient(ellipse at 50% 45%, #ffe9a8 0%, #f7a93c 70%, #c7650f 100%)"></div>'
                f'<img id="{cid}-lg" src="{src("ll-logo.png")}" style="position:absolute; left:260px; top:430px; width:560px" />'
                f'<div id="{cid}-d" style="position:absolute; left:190px; top:230px; width:700px; height:900px; border-radius:350px 350px 0 0; transform-origin:0% 50%; '
                f'background:repeating-linear-gradient(90deg,#3a1d10 0 110px,#2a130a 110px 118px); border:10px solid #150a05"></div>'
                f'<div class="scare" id="{cid}-t" style="top:1170px; font-size:128px">{e["line"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; text-align:center; top:1310px"><span class="pill">{e["url"]}</span></div>')
    def end_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-d", {{ rotationY:0 }}, {{ rotationY:-105, duration:0.8, ease:"power2.inOut", transformPerspective:1400 }}, 0.2);'
                f'tl.to("#{cid}-d", {{ autoAlpha:0, duration:0.1 }}, 0.95);'
                f'tl.fromTo("#{cid}-lg", {{ scale:0.8 }}, {{ scale:1.04, duration:{dur:.2f}, ease:"power1.out" }}, 0);'
                + S.pop(cid, "t", 0.8, scale=1.4, dur=0.3) + S.pop(cid, "u", 1.1, scale=1.2, dur=0.35))
    add("s7-end", end_html, end_js, e["say"], text=e["url"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "HALLOWEEN NIGHT"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets={}, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.1, fade_out=1.2)],
                 note="Halloween night: moon, pumpkin patch, trunk of candy, ghost hunt, candy rain, door.")
