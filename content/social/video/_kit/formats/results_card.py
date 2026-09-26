"""RESULTS — the card, over the lights. Saturday's twin of game-night-card:
FINAL and the date; one row per game with the score, W/L, where, the record;
next up for each team; the /football line. Same look, same rules: no captions,
one push, breathing flares.

    python3 _kit/make.py results-card --data @out/<project>/story.json --out out/<project> --vo out/<project>/public
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .game_night_card import _bg, _css, _flare_js, _push
from .member_spotlight import _media_src


def build(d):
    assets = dict(d.get("assets") or {}); games = d["games"]
    scenes, subs = [], []
    still_assets = {k: v for k, v in assets.items() if k != "lights.mp4"} if "lights.jpg" in assets else dict(assets)

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, say=None, lines=None):
        idx = lines if lines is not None else (len(subs),)
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=idx))
        if lines is None:
            subs.append(Sub(0.0, dur, say, say=say))

    # s0 — lights up, FINAL
    def open_html(cid, dur, size):
        return (f'{_bg(cid, assets, dur)}<div class="wrap"><div class="top">'
                f'<span class="kick" id="{cid}-k" style="opacity:0">FINAL</span>'
                f'<span class="date" id="{cid}-d" style="opacity:0">{d["week"]}</span></div></div>')
    def open_js(cid, dur, size=None):
        return _push(cid, dur, 1.0, 1.10) + _flare_js(cid, dur) + S.pop(cid, "k", 1.0, scale=1.18, dur=0.6) + S.rise(cid, "d", 1.6, dy=14, dur=0.4)
    add("s0-lights", 4.4, open_html, open_js, d["open"]["say"])

    # s1 — the scores, one row per spoken line
    def score_html(cid, dur, size):
        rows = ""
        for i, g in enumerate(games):
            won = g["result"] == "W"
            pips = "".join(f'<span class="pip {r["result"]}">{r["result"]}</span>' for r in g.get("results", []))
            rows += (f'<div class="row" id="{cid}-r{i}" style="opacity:0; border-left-color:{B.GREEN if won else "#8a1e2c"}">'
                     f'<img class="badge" src="{_media_src(assets, g["badge"])[0]}" alt="" />'
                     f'<div><span class="team">{g["nick"]}</span>'
                     f'<span class="opp"><span style="color:{B.GREEN if won else "#e0707f"}">{"W" if won else "L"}</span> {g["us"]}–{g["them"]}</span>'
                     f'<span class="where">{"vs" if g["home"] else "at"} {g["opponent"]} · {g["record"]}</span>'
                     f'<div class="form">{pips}</div></div></div>')
        return f'{_bg(cid, still_assets, dur)}<div class="wrap"><div class="rows">{rows}</div></div>'
    def score_js(cid, dur, size=None):
        out = _push(cid, dur, 1.10, 1.16) + _flare_js(cid, dur)
        for i in range(len(games)):
            at = 0.2 + i * (dur / max(1, len(games))) * 0.9
            out += f'tl.fromTo("#{cid}-r{i}", {{ autoAlpha:0, x:90 }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"power3.out" }}, {at:.2f});'
        return out
    first = len(subs)
    for g in games:
        subs.append(Sub(0.0, 4.4, g["say"], say=g["say"]))
    add("s1-scores", 4.4 * len(games), score_html, score_js, lines=tuple(range(first, first + len(games))))

    # s2 — next up
    def next_html(cid, dur, size):
        rows = ""
        for i, g in enumerate(games):
            n = g.get("next")
            line = (f'{"vs" if n["home"] else "at"} {n["opponent"]}' if n else "Season complete")
            sub = (f'{n["day"]} · {n["kickoff"]} · {n["venue"]}' if n else "")
            rows += (f'<div class="row" id="{cid}-r{i}" style="opacity:0"><img class="badge" src="{_media_src(assets, g["badge"])[0]}" alt="" />'
                     f'<div><span class="team">{g["nick"]}</span><span class="opp">{line}</span><span class="where">{sub}</span></div></div>')
        return (f'{_bg(cid, still_assets, dur)}<div class="wrap"><div class="top" style="margin-bottom:30px">'
                f'<span class="date" id="{cid}-t" style="opacity:0">Next up</span></div><div class="rows">{rows}</div></div>')
    def next_js(cid, dur, size=None):
        out = _push(cid, dur, 1.16, 1.22) + _flare_js(cid, dur) + S.rise(cid, "t", 0.1, dy=10, dur=0.35)
        for i in range(len(games)):
            out += f'tl.fromTo("#{cid}-r{i}", {{ autoAlpha:0, x:-90 }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"power3.out" }}, {0.35 + 0.45 * i:.2f});'
        return out
    add("s2-next", 5.5, next_html, next_js, d["next_say"])

    # s3 — end
    def end_html(cid, dur, size):
        return (f'{_bg(cid, still_assets, dur)}<div class="wrap"><div class="foot">'
                f'<span class="live" id="{cid}-l" style="opacity:0">{d["end"]["chip"]}</span><span class="site" id="{cid}-s" style="opacity:0">{d["end"]["site"]}</span>'
                f'<span class="last" id="{cid}-d" style="margin-top:30px; opacity:0">{d["end"]["sub"]}</span></div></div>')
    def end_js(cid, dur, size=None):
        return (_push(cid, dur, 1.22, 1.28) + _flare_js(cid, dur)
                + S.rise(cid, "l", 0.1, dy=10, dur=0.35) + S.pop(cid, "s", 0.35, scale=1.15, dur=0.45) + S.rise(cid, "d", 1.0, dy=10, dur=0.35))
    add("s3-end", 4.6, end_html, end_js, d["end"]["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "RESULTS"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.78, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.20, fade_in=0.3, fade_out=1.2)],
                 note="Scores from football_games. No captions; bed at 0.20.")
