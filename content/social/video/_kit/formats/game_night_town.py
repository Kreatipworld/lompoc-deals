"""GAME NIGHT — the town edition: every Lompoc team playing this Friday in one
spot, the road trip when both are away, and where locals stop on the way out.

    python3 _kit/make.py game-night-town --data @out/<project>/story.json --out out/<project> --vo out/<project>/public

Data: slug, assets, week, games [ {school, nick, badge, clip, opponent, kickoff, venue, record, home, miles?, drive?, say} ],
stops [ {media, name, line} ] with `stops_say`, open {say}, end {say, site}.
Every fact comes from /football's table and the businesses table; nothing is typed by hand.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _clip_len, _media_src, _video_layers

OPEN, GAME, STOPS, END = 4.0, 5.2, 5.0, 4.6
FIELD = f"radial-gradient(ellipse 90% 70% at 50% 40%, #7d1590 0%, {B.PURPLE} 45%, #3a0743 100%)"


def _css(cid, size):
    g = B.geom(size); s = f'[data-composition-id="{cid}"]'; tall = g["h"] > 1400
    return f"""
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .block {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36; }}
      {s} .centre {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"20%" if tall else "10%"}; z-index:36; text-align:center; }}
      {s} .badges {{ display:flex; justify-content:center; align-items:center; gap:{40 if tall else 28}px; }}
      {s} .badge {{ width:{300 if tall else 200}px; height:{300 if tall else 200}px; object-fit:contain; background:#fff; border-radius:44px; padding:22px; box-shadow:0 24px 60px rgba(10,6,12,0.5); }}
      {s} .vs {{ color:{B.GOLD}; font-weight:800; font-size:{90 if tall else 64}px; letter-spacing:-3px; }}
      {s} .kick {{ display:block; color:#fff; font-weight:800; line-height:0.92; letter-spacing:-6px; font-size:{200 if tall else 150}px; text-shadow:0 10px 40px rgba(10,6,12,0.6); }}
      {s} .title {{ display:block; color:#fff; font-weight:800; line-height:1.04; letter-spacing:-2px; font-size:{86 if tall else 64}px; text-shadow:0 8px 34px rgba(10,6,12,0.6); }}
      {s} .sub {{ display:block; color:rgba(255,255,255,0.88); font-weight:600; line-height:1.25; font-size:{42 if tall else 34}px; }}
      {s} .gold {{ color:{B.GOLD}; }}
      {s} .stop {{ position:absolute; left:0; right:0; height:50%; overflow:hidden; }}
      {s} .stop img {{ width:100%; height:100%; object-fit:cover; display:block; filter:brightness(0.8); }}
      {s} .stopname {{ position:absolute; left:{g["side"]}px; bottom:{"10%" if tall else "8%"}; z-index:36; }}
      {s} .name {{ display:inline-block; background:rgba(20,10,23,0.78); color:#fff; font-weight:800; font-size:{50 if tall else 38}px; padding:16px 28px; border-radius:14px; border-left:8px solid {B.GOLD}; }}
      {s} .what {{ display:block; margin-top:10px; color:{B.GOLD}; font-weight:700; font-size:{34 if tall else 28}px; letter-spacing:1px; text-transform:uppercase; }}
    """


def build(d):
    assets = dict(d.get("assets") or {}); scenes, subs = [], []
    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)
    def add(cid, dur, html, js, say, cap=""):
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=(len(subs),))); subs.append(Sub(0.0, dur, cap or say, say=say))

    games = d["games"]

    # ── open: both badges, GAME NIGHT ───────────────────────────────────
    def open_html(cid, dur, size):
        g = B.geom(size); tall = g["h"] > 1400
        badges = "".join(f'<img class="badge" id="{cid}-b{i}" src="{_media_src(assets, gm["badge"])[0]}" alt="" style="opacity:0" />' for i, gm in enumerate(games))
        return f'''<div class="field"></div>
      <div class="centre">
        <span class="chip" id="{cid}-chip" style="opacity:0">{d["week"]}</span>
        <div class="badges" style="margin-top:{40 if tall else 24}px">{badges}</div>
        <span class="kick" id="{cid}-k" style="margin-top:{50 if tall else 30}px; opacity:0">GAME<br>NIGHT</span>
        <span class="sub gold" id="{cid}-s" style="margin-top:{26 if tall else 16}px; opacity:0">{d["open"]["sub"]}</span>
      </div>'''
    def open_js(cid, dur, size=None):
        out = S.rise(cid, "chip", 0.05, dy=10, dur=0.3)
        for i in range(len(games)): out += S.pop(cid, f"b{i}", 0.15 + 0.18 * i, scale=1.3, dur=0.42)
        return out + S.pop(cid, "k", 0.6, scale=1.25, dur=0.45) + S.rise(cid, "s", 1.05, dy=14, dur=0.4)
    add("s0-open", OPEN, open_html, open_js, d["open"]["say"])

    # ── one scene per game ─────────────────────────────────────────────
    for i, gm in enumerate(games):
        def html(cid, dur, size, gm=gm):
            g = B.geom(size); tall = g["h"] > 1400
            src, kind = _media_src(assets, gm["clip"])
            art = _video_layers(cid, src, dur, gm.get("at", 0.0), _clip_len(assets, gm["clip"]), "filter:brightness(0.62) saturate(1.05)") if kind == "video" else f'<img id="{cid}-bg" class="cover" src="{src}" alt="" />'
            drive = f'<span class="sub" id="{cid}-d" style="margin-top:14px; opacity:0">{gm["miles"]} mi · about {gm["drive"]} from Lompoc</span>' if gm.get("miles") else ""
            return f'''{art}<div class="scrim"></div>
      <div style="position:absolute; left:{g["side"]}px; top:{"15%" if tall else "10%"}; z-index:36; display:flex; align-items:center; gap:20px">
        <img src="{_media_src(assets, gm["badge"])[0]}" alt="" style="width:{150 if tall else 100}px; height:{150 if tall else 100}px; object-fit:contain; background:#fff; border-radius:26px; padding:12px" />
        <span class="chip" id="{cid}-chip" style="opacity:0">{gm["record"]}</span>
      </div>
      <div class="block">
        <span class="sub gold" id="{cid}-n" style="font-weight:800; letter-spacing:3px; text-transform:uppercase; opacity:0">{gm["nick"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:10px; opacity:0">{"vs" if gm["home"] else "at"} {gm["opponent"]}</span>
        <span class="kick" id="{cid}-k" style="margin-top:14px; font-size:{150 if tall else 110}px; letter-spacing:-4px; opacity:0">{gm["kickoff"]}</span>{drive}
      </div>'''
        def js(cid, dur, size=None, gm=gm):
            out = f'tl.fromTo("#{cid}-bg", {{ scale:1.0 }}, {{ scale:1.07, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
            out += S.rise(cid, "chip", 0.1, dy=10, dur=0.3) + S.rise(cid, "n", 0.15, dy=12, dur=0.35) + S.rise(cid, "t", 0.3, dy=22, dur=0.45) + S.pop(cid, "k", 0.55, scale=1.3, dur=0.45)
            if gm.get("miles"): out += S.rise(cid, "d", 0.95, dy=12, dur=0.35)
            return out
        add(f"s{i + 1}-game", GAME, html, js, gm["say"])

    # ── the pit stops: two members, split frame ─────────────────────────
    stops = d["stops"]
    def stops_html(cid, dur, size):
        halves = ""
        for i, st in enumerate(stops):
            halves += (f'<div class="stop" style="top:{i * 50}%"><img id="{cid}-p{i}" src="{_media_src(assets, st["media"])[0]}" alt="" />'
                       f'<div class="stopname"><span class="name" id="{cid}-n{i}" style="opacity:0">{st["name"]}</span><span class="what" id="{cid}-w{i}" style="opacity:0">{st["line"]}</span></div></div>')
        return f'{halves}<div style="position:absolute; left:0; right:0; top:50%; height:6px; margin-top:-3px; background:{B.GOLD}; z-index:35"></div>'
    def stops_js(cid, dur, size=None):
        out = ""
        for i in range(len(stops)):
            out += f'tl.fromTo("#{cid}-p{i}", {{ scale:1.0 }}, {{ scale:1.08, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
            out += S.rise(cid, f"n{i}", 0.2 + 0.5 * i, dy=14, dur=0.4) + S.rise(cid, f"w{i}", 0.45 + 0.5 * i, dy=10, dur=0.35)
        return out
    add("s-stops", STOPS, stops_html, stops_js, d["stops_say"])

    # ── end: every score, live ─────────────────────────────────────────
    en = d["end"]
    def end_html(cid, dur, size):
        g = B.geom(size); tall = g["h"] > 1400
        return f'''<div class="field"></div>
      <div class="centre" style="top:{"26%" if tall else "14%"}">
        <span class="chip" id="{cid}-chip" style="opacity:0">{en["chip"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:{36 if tall else 22}px; opacity:0">{en["title"]}</span>
        <span class="pill" id="{cid}-url" style="margin-top:{44 if tall else 28}px; opacity:0">{en["site"]}</span>
        <span class="sub" id="{cid}-s" style="margin-top:{40 if tall else 24}px; opacity:0">{en["sub"]}</span>
      </div>'''
    def end_js(cid, dur, size=None):
        return (S.rise(cid, "chip", 0.1, dy=10, dur=0.3) + S.pop(cid, "t", 0.25, scale=1.2, dur=0.45)
                + f'tl.fromTo("#{cid}-url", {{ autoAlpha:0, y:18, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.5)" }}, 0.75);'
                + S.rise(cid, "s", 1.2, dy=12, dur=0.4))
    scenes.append(Scene("s-end", 0.0, END, styled(end_html), end_js, lines=(len(subs),))); subs.append(Sub(0.0, END, en["site"], say=en["say"]))

    at = 0.0
    for sc in scenes: sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "GAME NIGHT — town edition"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(s.spoken) for s in subs], assets=assets,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.82, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.30, fade_in=0.3, fade_out=1.2)],
                 note="Games from football_games; distances from Mapbox Directions; stops are paying members with their own photos.")
