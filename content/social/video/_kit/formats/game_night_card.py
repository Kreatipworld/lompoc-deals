"""GAME NIGHT — the card. One poster, no captions, no entrance animation:
GAME NIGHT and the date up top, then each team as a row — badge, who they
play, where, what time — and the /football line. The voice reads it once.
Owner, Sep 25 2026: "don't add the repetitive animation… put day/night, then
the Braves, then the Conquistadors… what time, and who they are fighting."

    python3 _kit/make.py game-night-card --auto --out out/<project> --vo out/<project>/public
"""
from .. import brand as B
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

FIELD = f"radial-gradient(ellipse 90% 70% at 50% 30%, #7d1590 0%, {B.PURPLE} 45%, #3a0743 100%)"


def _css(cid, size):
    g = B.geom(size); s = f'[data-composition-id="{cid}"]'; tall = g["h"] > 1400
    return f"""
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .wrap {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"9%" if tall else "6%"}; bottom:{"9%" if tall else "6%"}; z-index:36; display:flex; flex-direction:column; justify-content:space-between; }}
      {s} .top {{ text-align:center; }}
      {s} .kick {{ display:block; color:#fff; font-weight:800; line-height:0.9; letter-spacing:-6px; font-size:{176 if tall else 120}px; text-shadow:0 10px 40px rgba(10,6,12,0.6); }}
      {s} .date {{ display:inline-block; margin-top:{22 if tall else 12}px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:{36 if tall else 28}px; letter-spacing:3px; text-transform:uppercase; padding:12px 26px; border-radius:12px; }}
      {s} .rows {{ display:flex; flex-direction:column; gap:{28 if tall else 16}px; }}
      {s} .row {{ display:flex; align-items:center; gap:{30 if tall else 20}px; background:rgba(20,10,23,0.42); border-radius:30px; padding:{"26px 30px" if tall else "18px 22px"}; border-left:10px solid {B.GOLD}; }}
      {s} .badge {{ width:{190 if tall else 130}px; height:{190 if tall else 130}px; object-fit:contain; background:#fff; border-radius:30px; padding:14px; flex:none; }}
      {s} .team {{ display:block; color:{B.GOLD}; font-weight:800; font-size:{30 if tall else 24}px; letter-spacing:3px; text-transform:uppercase; }}
      {s} .opp {{ display:block; color:#fff; font-weight:800; font-size:{76 if tall else 54}px; line-height:1.02; letter-spacing:-2px; margin-top:6px; }}
      {s} .when {{ display:block; color:#fff; font-weight:800; font-size:{66 if tall else 48}px; line-height:1; letter-spacing:-1px; margin-top:12px; }}
      {s} .where {{ display:block; color:rgba(255,255,255,0.8); font-weight:600; font-size:{34 if tall else 26}px; margin-top:8px; }}
      {s} .foot {{ text-align:center; }}
      {s} .site {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:{44 if tall else 34}px; padding:18px 36px; border-radius:999px; }}
      {s} .live {{ display:block; color:rgba(255,255,255,0.85); font-weight:700; font-size:{30 if tall else 24}px; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px; }}
    """


def build(d):
    assets = dict(d.get("assets") or {}); games = d["games"]
    lines = [d["open"]["say"]] + [g["say"] for g in games] + [d["end"]["say"]]
    total = 4.0 + 4.2 * len(games) + 4.6   # placeholder; the read re-times it

    def html(cid, dur, size):
        rows = "".join(
            f'''<div class="row"><img class="badge" src="{_media_src(assets, g["badge"])[0]}" alt="" />
          <div><span class="team">{g["nick"]}</span><span class="opp">{"vs" if g["home"] else "at"} {g["opponent"]}</span>
          <span class="when">{g["kickoff"]}</span><span class="where">{g["venue"] if g["home"] else "Away"}{(" · " + g["record"]) if g.get("record") else ""}</span></div></div>'''
            for g in games)
        return f'''<style>{_css(cid, size)}</style>
      <div class="field"></div>
      <div class="wrap">
        <div class="top"><span class="kick">GAME<br>NIGHT</span><span class="date">{d["week"]}</span></div>
        <div class="rows">{rows}</div>
        <div class="foot"><span class="live">{d["end"]["chip"]}</span><span class="site">{d["end"]["site"]}</span></div>
      </div>'''

    def js(cid, dur, size=None):
        # One slow drift of the field, nothing else moves.
        return f'tl.fromTo(".field", {{ scale:1.0 }}, {{ scale:1.05, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 30%" }}, 0);'

    scene = Scene("s0-card", 0.0, total, html, js, lines=tuple(range(len(lines))))
    subs = [Sub(0.0, total, ln, say=ln) for ln in lines]
    return Video(slug=d["slug"], title=d.get("title", "GAME NIGHT"), total=total, size=B.SIZES["9x16"],
                 scenes=[scene], subs=subs, vo_lines=[B.for_tts(ln) for ln in lines], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.82, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.30, fade_in=0.3, fade_out=1.2)],
                 note="One card. Facts from football_games. No captions by the owner's call.")
