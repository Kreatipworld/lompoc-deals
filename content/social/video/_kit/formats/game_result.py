"""FINAL — the post-game score post. Recurs every Saturday morning in season.

Same brand furniture as game_night; the payload is the scoreline. Written so a
loss reads with the same respect as a win, because the town reads both.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .game_night import SCHOOLS

REQUIRED = ("school", "opponent", "us", "them", "venue")


def build(d: dict) -> Video:
    missing = [k for k in REQUIRED if d.get(k) in (None, "")]
    if missing:
        raise ValueError(f"game_result needs {missing}; got {sorted(d)}")

    school = d["school"]
    if school not in SCHOOLS:
        raise ValueError(f"unknown school {school!r}; known: {sorted(SCHOOLS)}")
    meta = SCHOOLS[school]
    badge = meta["badge"]
    opponent = d["opponent"]
    venue = B.venue_name(d["venue"])
    us, them = int(d["us"]), int(d["them"])
    record = d.get("record", "")
    site = d.get("site", "lompoclocals.com/football")

    won = us > them
    tied = us == them
    # The word on screen. A loss is stated plainly, never spun.
    verdict = "FINAL" if tied else ("BRAVES WIN" if won and school == "Lompoc" else
                                    "CONQS WIN" if won else "FINAL")
    line = (f"{school} {us}, {opponent} {them}." if not tied
            else f"{school} and {opponent} finish level at {us}.")
    nick = meta["nick"]
    closer = ("That's a Friday night in Lompoc." if won
              else "They'll be back next Friday." if not tied
              else "Level at the whistle.")

    s1, s2, s3 = 4.20, 4.60, 4.90
    total = 13.10

    def opener(cid, dur, size):
        return f'''<img class="cover" src="public/huyck-goalposts.jpg" alt="" style="filter:brightness(0.55) saturate(0.95)" />
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; top:16%; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:1">{d.get("week", "Friday night")} · Final</span></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:150px; opacity:1">{verdict}</span>
        <span id="{cid}-h2" style="display:block; margin-top:26px; color:{B.GOLD}; font-weight:800; font-size:64px; letter-spacing:-1px; opacity:0">{venue}</span>
      </div>'''

    def opener_js(cid, dur):
        return (f'tl.fromTo("#{cid}-h1", {{ scale:1.06 }}, {{ scale:1, duration:1.4, ease:"power2.out" }}, 0);'
                + S.rise(cid, "h2", 1.40, dy=16, dur=0.40))

    def score(cid, dur, size):
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(180deg, #1d0b23 0%, {B.BG} 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:26%; z-index:36; text-align:center">
        <img id="{cid}-badge" src="public/{badge}" alt="" style="width:210px; height:auto; opacity:0" />
        <div style="display:flex; align-items:center; justify-content:center; gap:44px; margin-top:40px">
          <span id="{cid}-us" style="color:{B.GOLD}; font-weight:800; font-size:190px; line-height:1; letter-spacing:-8px; opacity:0">{us}</span>
          <span id="{cid}-dash" style="color:rgba(255,255,255,0.45); font-weight:800; font-size:90px; opacity:0">–</span>
          <span id="{cid}-them" style="color:#fff; font-weight:800; font-size:190px; line-height:1; letter-spacing:-8px; opacity:0">{them}</span>
        </div>
        <span id="{cid}-opp" style="display:block; margin-top:34px; color:rgba(255,255,255,0.88); font-weight:700; font-size:52px; letter-spacing:-1px; opacity:0">{school} · {opponent}</span>
        {f'<span id="{cid}-rec" style="display:inline-block; margin-top:28px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:44px; padding:10px 26px; border-radius:12px; opacity:0">{record}</span>' if record else ''}
      </div>'''

    def score_js(cid, dur):
        js = (S.rise(cid, "badge", 0.12, dur=0.38)
              + S.pop(cid, "us", 0.55, scale=1.3, dur=0.42)
              + f'tl.fromTo("#{cid}-dash", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.25 }}, 0.85);'
              + S.pop(cid, "them", 1.05, scale=1.3, dur=0.42)
              + S.rise(cid, "opp", 1.60, dy=14, dur=0.36))
        if record:
            js += S.rise(cid, "rec", 2.05, dy=12, dur=0.34)
        return js

    def end(cid, dur, size):
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(180deg, {B.PURPLE} 0%, #2a0533 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:30%; z-index:20; text-align:center">
        <span id="{cid}-t1" style="display:block; color:#fff; font-weight:800; font-size:86px; line-height:1.02; letter-spacing:-3px; opacity:0">{closer}</span>
        <span class="pill" id="{cid}-pill" style="margin-top:48px; opacity:0">{site}</span>
        <span id="{cid}-t2" style="display:block; margin-top:30px; color:rgba(255,255,255,0.85); font-weight:600; font-size:32px; opacity:0">Every score · both schools · the morning after</span>
      </div>'''

    def end_js(cid, dur):
        return (S.rise(cid, "t1", 0.20, dy=20, dur=0.45)
                + S.rise(cid, "pill", 0.85, dy=14, dur=0.38)
                + S.rise(cid, "t2", 1.25, dy=10, dur=0.34))

    subs = [
        Sub(0.40, 1.60, "Final."),
        Sub(1.85, 3.60, f"{venue}."),
        Sub(4.30, 7.20, line),
        Sub(7.50, 8.90, record, say=B.spoken_record(record, f"The {nick}")) if record
        else Sub(7.50, 8.90, closer),
        Sub(9.20, 12.20, f"Every score at {site}", say=f"Every score at {B.spoken_url(site)}."),
    ]
    subs = [s for s in subs if s.text]

    return Video(
        slug="game-result",
        title=f"FINAL — {school} {us}, {opponent} {them} at {venue}",
        total=total,
        size=B.SIZES["9x16"],
        scenes=[
            Scene("s1-final", 0.00, s1, opener, opener_js),
            Scene("s2-score", s1 - B.X, s2, score, score_js),
            Scene("s3-end", s1 - B.X + s2 - B.X, s3, end, end_js),
        ],
        subs=subs,
        vo_lines=[B.for_tts(s.spoken) for s in subs],
        audio=[
            Audio("public/vo.wav", "voiceover", 0.40, 12.00, volume=0.76, fade_in=0.05, fade_out=0.10),
            Audio("public/bed.wav", "music", 0.00, total, volume=0.28, fade_in=0.4, fade_out=1.2),
            Audio("public/shield-hit.wav", "sfx", s1 - B.X, 1.40, volume=0.30, fade_out=0.4),
        ],
        note="Score must match /football before this posts. A loss is stated plainly.",
    )
