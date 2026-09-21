"""SEASON SO FAR — the Sunday night recap. Both schools, equal time.

The town has two teams and their seasons rarely look alike. This format gives
each the same real estate and the same honesty: the record as it stands, the
scores as they happened, and the next game. A losing season is reported, not
spun and not softened into meaninglessness.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

ORDER = ["Lompoc", "Cabrillo"]
NICK = {"Lompoc": "Braves", "Cabrillo": "Conquistadores"}
SHORT = {"Lompoc": "Braves", "Cabrillo": "Conqs"}
BADGE = {"Lompoc": "badge-braves.png", "Cabrillo": "badge-conqs.png"}


def _row(g: dict) -> str:
    win = g["result"] == "W"
    mark = B.GREEN if win else "rgba(255,255,255,0.35)"
    where = "vs" if g["home"] else "at"
    return (
        f'<div style="display:flex; align-items:center; gap:22px; margin-top:20px">'
        f'<span style="width:14px; height:14px; border-radius:99px; background:{mark}; flex:none"></span>'
        f'<span style="flex:1; color:rgba(255,255,255,0.92); font-weight:700; font-size:40px; letter-spacing:-1px">{where} {g["opponent"]}</span>'
        f'<span style="color:{B.GOLD if win else "rgba(255,255,255,0.72)"}; font-weight:800; font-size:44px; letter-spacing:-1px">{g["us"]}–{g["them"]}</span>'
        f"</div>"
    )


def _team_scene(team: str, t: dict):
    badge, nick = BADGE[team], NICK[team]
    rows = "".join(_row(g) for g in t["games"])
    diff = t["pointsFor"] - t["pointsAgainst"]

    # These are sixteen-year-olds. A season going badly is reported honestly in
    # the results list above, which is enough. Printing a huge negative margin
    # under it is piling on, so a team under water gets its best night instead.
    best = max((g for g in t["games"] if g["result"] == "W"),
               key=lambda g: g["us"] - g["them"], default=None)
    if diff >= 0:
        third = (f'<div><span style="display:block; color:rgba(255,255,255,0.55); font-weight:700; font-size:26px; letter-spacing:3px">MARGIN</span>'
                 f'<span style="display:block; margin-top:6px; color:{B.GREEN}; font-weight:800; font-size:74px; letter-spacing:-2px">+{diff}</span></div>')
    elif best:
        third = (f'<div><span style="display:block; color:rgba(255,255,255,0.55); font-weight:700; font-size:26px; letter-spacing:3px">BEST NIGHT</span>'
                 f'<span style="display:block; margin-top:6px; color:{B.GREEN}; font-weight:800; font-size:74px; letter-spacing:-2px">{best["us"]}–{best["them"]}</span></div>')
    else:
        third = ""

    def html(cid, dur, size):
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(175deg, #23103080 0%, {B.BG} 62%)"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:13%; z-index:36">
        <div style="display:flex; align-items:center; gap:28px">
          <img id="{cid}-badge" src="public/{badge}" alt="" style="width:132px; height:auto; opacity:0; flex:none" />
          <div style="flex:1">
            <span id="{cid}-name" style="display:block; color:#fff; font-weight:800; font-size:62px; letter-spacing:-2px; opacity:0">{nick}</span>
            <span id="{cid}-rec" style="display:inline-block; margin-top:12px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:40px; padding:8px 22px; border-radius:10px; opacity:0">{t["record"]}</span>
          </div>
        </div>
        <div id="{cid}-rows" style="margin-top:56px; opacity:0">{rows}</div>
        <div id="{cid}-pts" style="margin-top:52px; display:flex; gap:56px; opacity:0">
          <div><span style="display:block; color:rgba(255,255,255,0.55); font-weight:700; font-size:26px; letter-spacing:3px">SCORED</span>
               <span style="display:block; margin-top:6px; color:{B.GOLD}; font-weight:800; font-size:74px; letter-spacing:-2px">{t["pointsFor"]}</span></div>
          <div><span style="display:block; color:rgba(255,255,255,0.55); font-weight:700; font-size:26px; letter-spacing:3px">ALLOWED</span>
               <span style="display:block; margin-top:6px; color:#fff; font-weight:800; font-size:74px; letter-spacing:-2px">{t["pointsAgainst"]}</span></div>
          {third}
        </div>
      </div>'''

    def js(cid, dur):
        return (S.pop(cid, "badge", 0.12, scale=1.35, dur=0.40)
                + S.rise(cid, "name", 0.30, dy=14, dur=0.36)
                + S.rise(cid, "rec", 0.55, dy=12, dur=0.34)
                + S.rise(cid, "rows", 0.90, dy=20, dur=0.50)
                + S.rise(cid, "pts", 1.70, dy=18, dur=0.45))

    return html, js


def build(d: dict) -> Video:
    teams = d.get("teams") or {}
    missing = [t for t in ORDER if t not in teams]
    if missing:
        raise ValueError(f"season_recap needs teams {missing}; got {sorted(teams)}")
    site = d.get("site", "lompoclocals.com/football")
    # Deliberately no week number: the schools have played a different number of
    # games, so any single "Week N" label is wrong for one of them.
    week = d.get("label") or "The season so far"

    open_d, team_d, next_d, end_d = 3.60, 7.40, 5.20, 5.00
    x = B.X

    def opener(cid, dur, size):
        return f'''<img class="cover" src="public/huyck-goalposts.jpg" alt="" style="filter:brightness(0.45) saturate(0.9)" />
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; top:15%; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:1">{week}</span></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:132px; opacity:1">TWO SCHOOLS<br />ONE TOWN</span>
        <span id="{cid}-h2" style="display:block; margin-top:26px; color:{B.GOLD}; font-weight:800; font-size:56px; letter-spacing:-1px; opacity:0">Where both teams stand</span>
      </div>'''

    def opener_js(cid, dur):
        return (f'tl.fromTo("#{cid}-h1", {{ scale:1.05 }}, {{ scale:1, duration:1.5, ease:"power2.out" }}, 0);'
                + S.rise(cid, "h2", 1.30, dy=16, dur=0.40))

    nxt = {t: teams[t].get("next") for t in ORDER}

    def upnext(cid, dur, size):
        cards = ""
        for t in ORDER:
            n = nxt[t]
            if not n:
                continue
            where = "vs" if n["home"] else "at"
            cards += (
                f'<div style="margin-top:34px; padding:30px 34px; border-radius:22px; background:rgba(255,255,255,0.07); display:flex; align-items:center; gap:26px">'
                f'<img src="public/{BADGE[t]}" alt="" style="width:86px; height:auto; flex:none" />'
                f'<div style="flex:1"><span style="display:block; color:#fff; font-weight:800; font-size:46px; letter-spacing:-1px">{SHORT[t]} {where} {n["opponent"]}</span>'
                f'<span style="display:block; margin-top:8px; color:rgba(255,255,255,0.72); font-weight:600; font-size:32px">{n["kickoff"]} · {B.venue_name(n["venue"])}</span></div></div>'
            )
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(180deg, #1d0b23 0%, {B.BG} 100%)"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:22%; z-index:36">
        <span id="{cid}-t" style="display:block; color:{B.GOLD}; font-weight:800; font-size:62px; letter-spacing:-2px; opacity:0">This Friday</span>
        <div id="{cid}-cards" style="opacity:0">{cards}</div>
      </div>'''

    def upnext_js(cid, dur):
        return S.rise(cid, "t", 0.15, dy=14, dur=0.38) + S.rise(cid, "cards", 0.55, dy=22, dur=0.50)

    def end(cid, dur, size):
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(180deg, {B.PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:30%; z-index:20; text-align:center">
        <span id="{cid}-t1" style="display:block; color:#fff; font-weight:800; font-size:88px; line-height:1.02; letter-spacing:-3px; opacity:0">We follow both.<br />All season.</span>
        <span class="pill" id="{cid}-pill" style="margin-top:46px; opacity:0">{site}</span>
        <span id="{cid}-t2" style="display:block; margin-top:30px; color:rgba(255,255,255,0.85); font-weight:600; font-size:32px; opacity:0">Every score · both schools · every Friday</span>
      </div>'''

    def end_js(cid, dur):
        return (S.rise(cid, "t1", 0.20, dy=20, dur=0.45)
                + S.rise(cid, "pill", 0.85, dy=14, dur=0.38)
                + S.rise(cid, "t2", 1.25, dy=10, dur=0.34))

    scenes, at = [], 0.0
    scenes.append(Scene("s1-open", at, open_d, opener, opener_js, lines=(0,))); at += open_d - x
    for i, t in enumerate(ORDER):
        h, j = _team_scene(t, teams[t])
        scenes.append(Scene(f"s{i+2}-{t.lower()}", at, team_d, h, j,
                            lines=(1, 2) if t == "Lompoc" else (3, 4))); at += team_d - x
    scenes.append(Scene("s4-next", at, next_d, upnext, upnext_js, lines=(5,))); at += next_d - x
    scenes.append(Scene("s5-end", at, end_d, end, end_js, lines=(6,)))
    total = round(at + end_d, 2)

    lom, cab = teams["Lompoc"], teams["Cabrillo"]
    cab_win = next((g for g in cab["games"] if g["result"] == "W"), None)
    # Name the bright spot without restating the record the previous line just gave.
    cab_line = (f"Their win came over {cab_win['opponent']}, {cab_win['us']} to {cab_win['them']}."
                if cab_win else "Still chasing the first one.")

    subs = [
        Sub(0.45, 3.30, week),
        Sub(4.00, 7.40, f"Lompoc {NICK['Lompoc']} · {lom['record']}"),
        Sub(7.80, 10.60, f"{lom['pointsFor']} scored · {lom['pointsAgainst']} allowed"),
        Sub(11.40, 15.00, f"Cabrillo {NICK['Cabrillo']} · {cab['record']}"),
        Sub(15.40, 18.20, cab_line),
        Sub(19.00, 22.40, "Both teams are back Friday."),
        Sub(23.00, total - 0.4, f"Every score at {site}"),
    ]
    say = {
        0: "Here is where both Lompoke teams stand.",
        1: f"The Lompoke Braves are {lom['record'].replace('-', ' and ')}.",
        2: f"{lom['pointsFor']} points scored. {lom['pointsAgainst']} allowed.",
        3: f"The Cabrillo Conquistadores are {cab['record'].replace('-', ' and ')}.",
        4: cab_line,
        5: "Both teams are back on Friday.",
        6: f"Every score at {B.spoken_url(site)}.",
    }
    for i, s in enumerate(subs):
        s.say = say[i]

    return Video(
        slug="season-recap",
        title=f"SEASON SO FAR — Braves {lom['record']}, Conqs {cab['record']}",
        total=total,
        size=B.SIZES["9x16"],
        scenes=scenes,
        subs=subs,
        vo_lines=[B.for_tts(s.spoken) for s in subs],
        audio=[
            Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.20),
            Audio("public/bed.wav", "music", 0.0, total, volume=0.26, fade_in=0.4, fade_out=1.2),
        ],
        note="Both schools get equal time. A losing record is reported, never spun.",
    )
