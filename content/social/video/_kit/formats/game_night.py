"""GAME NIGHT — the pre-game post. Recurs every home Friday in season.

Everything that changes week to week is data: who plays, when, where, the
record, and which school's badge. Nothing here is hand-edited per game.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

SCHOOLS = {
    "Lompoc":   {"badge": "badge-braves.png", "nick": "Braves",          "clip": "n2-brave-ready.mp4"},
    "Cabrillo": {"badge": "badge-conqs.png",  "nick": "Conquistadores",  "clip": "land-cabrillo.mp4"},
}

REQUIRED = ("school", "opponent", "kickoff", "venue", "record", "week")


def build(d: dict) -> Video:
    missing = [k for k in REQUIRED if not d.get(k)]
    if missing:
        raise ValueError(f"game_night needs {missing}; got {sorted(d)}")

    school = d["school"]
    if school not in SCHOOLS:
        raise ValueError(f"unknown school {school!r}; known: {sorted(SCHOOLS)}")
    meta = SCHOOLS[school]
    badge, clip = meta["badge"], meta["clip"]
    opponent = d["opponent"].upper()
    kickoff, record, week = d["kickoff"], d["record"], d["week"]
    venue = B.venue_name(d["venue"])
    home = d.get("home", True)
    when = d.get("when", "TONIGHT")
    # Say what actually happens. "Dublin is in town" only reads right at home.
    matchup_line = (f"And {d['opponent']} is in town." if home
                    else f"The {meta['nick']} travel to {venue}.")
    site = d.get("site", "lompoclocals.com/football")

    s1, s2, s3 = 4.35, 4.25, 5.30
    total = 13.50

    def hero(cid, dur, size):
        return f'''<video id="{cid}-v" class="clip" src="public/{clip}" data-start="0" data-media-start="0.30" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="filter:brightness(0.72)"></video>
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; top:16%; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:1">{"Friday night" if home else "On the road"} · {week}</span></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:158px; opacity:1">{when}</span>
        <span id="{cid}-h2" style="display:block; margin-top:26px; color:{B.GOLD}; font-weight:800; font-size:70px; letter-spacing:-1px; opacity:0">{kickoff} · {venue}</span>
      </div>'''

    def hero_js(cid, dur):
        return (f'tl.fromTo("#{cid}-h1", {{ scale:1.06 }}, {{ scale:1, duration:1.4, ease:"power2.out" }}, 0);'
                + S.rise(cid, "h2", 1.45, dy=16, dur=0.40))

    def matchup(cid, dur, size):
        # Only show Huyck when the game is actually at Huyck. Putting a Lompoc
        # stadium behind an away fixture claims something untrue about where to go.
        bg = (f'<img class="cover" src="public/huyck-stadium.jpg" alt="" style="filter:brightness(0.5) saturate(0.95)" />'
              if home else
              f'<div style="position:absolute; inset:0; background:linear-gradient(170deg, #241236 0%, {B.BG} 70%)"></div>')
        return f'''{bg}
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:31%; z-index:36; text-align:center">
        <img id="{cid}-badge" src="public/{badge}" alt="" style="width:270px; height:auto; opacity:0; filter:drop-shadow(0 10px 26px rgba(0,0,0,0.6))" />
        <span id="{cid}-rec" style="display:inline-block; margin-top:22px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:52px; padding:12px 30px; border-radius:12px; opacity:0">{record}</span>
        <span id="{cid}-vs" style="display:block; margin-top:34px; color:rgba(255,255,255,0.72); font-weight:800; font-size:36px; letter-spacing:8px; opacity:0">VS</span>
        <span id="{cid}-opp" style="display:block; margin-top:16px; color:#fff; font-weight:800; font-size:96px; letter-spacing:-3px; opacity:0">{opponent}</span>
      </div>'''

    def matchup_js(cid, dur):
        return (S.pop(cid, "badge", 0.15, scale=1.5, dur=0.42)
                + S.rise(cid, "rec", 0.60, dy=14, dur=0.35)
                + f'tl.fromTo("#{cid}-vs", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.3 }}, 1.85);'
                + S.pop(cid, "opp", 2.20))

    def end(cid, dur, size):
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(180deg, {B.PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:28%; z-index:20; text-align:center">
        <img id="{cid}-b" src="public/{badge}" alt="" style="width:200px; height:auto; opacity:0" />
        <span id="{cid}-t1" style="display:block; margin-top:34px; color:#fff; font-weight:800; font-size:92px; line-height:1.0; letter-spacing:-3px; opacity:0">Every score.<br />Every Friday.</span>
        <span class="pill" id="{cid}-pill" style="margin-top:44px; opacity:0">{site}</span>
        <span id="{cid}-t2" style="display:block; margin-top:30px; color:rgba(255,255,255,0.85); font-weight:600; font-size:32px; opacity:0">Both schools · schedules · scores · game stories</span>
      </div>'''

    def end_js(cid, dur):
        return (S.rise(cid, "b", 0.15, dur=0.40)
                + S.rise(cid, "t1", 0.30, dy=20, dur=0.45, extra="scale:1")
                + S.rise(cid, "pill", 0.95, dy=14, dur=0.38)
                + S.rise(cid, "t2", 1.35, dy=10, dur=0.34))

    subs = [
        Sub(0.40, 1.20, f"{when.title()}."),
        Sub(1.43, 2.55, f"{kickoff}."),
        Sub(2.92, 4.05, f"{venue}."),
        Sub(4.49, 6.60, f"{school} {meta['nick']} · {record}",
            say=B.spoken_record(record, f"The {school} {meta['nick']}")),
        Sub(6.78, 8.20, matchup_line),
        Sub(8.49, 12.40, f"Every score at {site}"),
    ]

    vo = [B.for_tts(s.spoken) for s in subs]

    return Video(
        slug="game-night",
        title=f"GAME NIGHT — {school} vs {d['opponent']}, {kickoff} at {venue}",
        total=total,
        size=B.SIZES["9x16"],
        scenes=[
            Scene("s1-tonight", 0.00, s1, hero, hero_js),
            Scene("s2-matchup", s1 - B.X, s2, matchup, matchup_js),
            Scene("s3-end", s1 - B.X + s2 - B.X, s3, end, end_js),
        ],
        subs=subs,
        vo_lines=vo,
        audio=[
            Audio("public/vo.wav", "voiceover", 0.40, 12.30, volume=0.76, fade_in=0.05, fade_out=0.10),
            Audio("public/bed.wav", "music", 0.00, total, volume=0.28, fade_in=0.4, fade_out=1.2),
            Audio("public/shield-hit.wav", "sfx", s1 - B.X, 1.40, volume=0.30, fade_out=0.4),
            Audio("public/whoosh.wav", "sfx", s1 - B.X + s2 - B.X, 1.20, volume=0.26, fade_out=0.3),
        ],
        note=f"{week}. Facts must match /football before this posts.",
    )
