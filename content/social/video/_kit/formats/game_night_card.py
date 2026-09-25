"""GAME NIGHT — the card, over the lights.

Stadium lights come up and the camera pushes in (a generated shot of an empty
field, objects only); GAME NIGHT lands; the games slide in one row at a time;
then how each team is doing (form pips + last result); then the /football line.
No captions, no repeating entrance choreography — one slow push and breathing
light flares are the only motion (owner, Sep 25 2026).

    python3 _kit/make.py game-night-card --auto --out out/<project> --vo out/<project>/public
Assets: the query's badges + `lights.mp4` (or `lights.jpg`) staged by the caller.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _clip_len, _media_src, _video_layers


def _css(cid, size):
    g = B.geom(size); s = f'[data-composition-id="{cid}"]'; tall = g["h"] > 1400
    return f"""
      {s} .tint {{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(58,7,67,0.55) 0%, rgba(58,7,67,0.35) 40%, rgba(20,6,24,0.88) 100%); z-index:31; }}
      {s} .flare {{ position:absolute; width:900px; height:900px; margin:-450px 0 0 -450px; border-radius:50%; z-index:32; pointer-events:none;
        background:radial-gradient(circle, rgba(255,246,200,0.55) 0%, rgba(255,240,180,0.18) 22%, rgba(255,240,180,0) 60%); mix-blend-mode:screen; opacity:0; }}
      {s} .wrap {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"9%" if tall else "6%"}; bottom:{"9%" if tall else "6%"}; z-index:36; display:flex; flex-direction:column; justify-content:center; }}
      {s} .top {{ text-align:center; }}
      {s} .kick {{ display:block; color:#fff; font-weight:800; line-height:0.9; letter-spacing:-6px; font-size:{176 if tall else 120}px; text-shadow:0 10px 40px rgba(10,6,12,0.7); }}
      {s} .date {{ display:inline-block; margin-top:{22 if tall else 12}px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:{36 if tall else 28}px; letter-spacing:3px; text-transform:uppercase; padding:12px 26px; border-radius:12px; }}
      {s} .rows {{ display:flex; flex-direction:column; gap:{28 if tall else 16}px; }}
      {s} .row {{ display:flex; align-items:center; gap:{30 if tall else 20}px; background:rgba(20,10,23,0.62); border-radius:30px; padding:{"26px 30px" if tall else "18px 22px"}; border-left:10px solid {B.GOLD}; }}
      {s} .badge {{ width:{190 if tall else 130}px; height:{190 if tall else 130}px; object-fit:contain; background:#fff; border-radius:30px; padding:14px; flex:none; }}
      {s} .team {{ display:block; color:{B.GOLD}; font-weight:800; font-size:{30 if tall else 24}px; letter-spacing:3px; text-transform:uppercase; }}
      {s} .opp {{ display:block; color:#fff; font-weight:800; font-size:{76 if tall else 54}px; line-height:1.02; letter-spacing:-2px; margin-top:6px; }}
      {s} .when {{ display:block; color:#fff; font-weight:800; font-size:{66 if tall else 48}px; line-height:1; letter-spacing:-1px; margin-top:12px; }}
      {s} .where {{ display:block; color:rgba(255,255,255,0.8); font-weight:600; font-size:{34 if tall else 26}px; margin-top:8px; }}
      {s} .form {{ display:flex; gap:10px; margin-top:14px; }}
      {s} .pip {{ width:{44 if tall else 32}px; height:{44 if tall else 32}px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:{24 if tall else 18}px; color:#fff; }}
      {s} .W {{ background:{B.GREEN}; }} {s} .L {{ background:#8a1e2c; }} {s} .T {{ background:#6b6b6b; }}
      {s} .last {{ display:block; color:rgba(255,255,255,0.86); font-weight:600; font-size:{32 if tall else 24}px; margin-top:12px; }}
      {s} .foot {{ text-align:center; }}
      {s} .site {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:{44 if tall else 34}px; padding:18px 36px; border-radius:999px; }}
      {s} .live {{ display:block; color:rgba(255,255,255,0.85); font-weight:700; font-size:{30 if tall else 24}px; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px; }}
    """


def _bg(cid, assets, dur):
    """The lights: the clip when there is one (slowed to fit, never replayed), else the still."""
    src, kind = _media_src(assets, "lights")
    if kind == "video":
        art = _video_layers(cid, src, dur, 0.0, _clip_len(assets, "lights"), "filter:brightness(0.9)")
    else:
        art = f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="filter:brightness(0.85)" />'
    flares = "".join(f'<div class="flare" id="{cid}-f{i}" style="left:{x}%; top:{y}%" data-layout-allow-overflow></div>'
                     for i, (x, y) in enumerate(((18, 14), (82, 12), (50, 8))))
    return f'{art}<div class="tint"></div>{flares}'


def _flare_js(cid, dur, n=3):
    out = ""
    for i in range(n):
        period = 2.6 + 0.7 * i
        reps = max(1, int(dur / period))
        out += (f'tl.fromTo("#{cid}-f{i}", {{ opacity:0.25, scale:0.9 }}, {{ opacity:0.7, scale:1.12, duration:{period / 2:.2f}, '
                f'ease:"sine.inOut", yoyo:true, repeat:{reps * 2 - 1}, transformOrigin:"50% 50%" }}, {0.3 * i:.2f});')
    return out


def _push(cid, dur, z0, z1):
    return f'tl.fromTo("#{cid}-bg", {{ scale:{z0} }}, {{ scale:{z1}, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 40%" }}, 0);'


def build(d):
    assets = dict(d.get("assets") or {}); games = d["games"]
    scenes, subs = [], []
    lights_clip = _media_src(assets, "lights")[1] == "video"
    still = {"lights.jpg": assets["lights.jpg"]} if "lights.jpg" in assets else {}

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, say, lines=None):
        idx = lines if lines is not None else (len(subs),)
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=idx))
        if lines is None:
            subs.append(Sub(0.0, dur, say, say=say))

    # s0 — the lights come up, GAME NIGHT lands. The generated clip plays here (and only here).
    def open_html(cid, dur, size):
        return (f'{_bg(cid, assets, dur)}'
                f'<div class="wrap"><div class="top"><span class="kick" id="{cid}-k" style="opacity:0">GAME<br>NIGHT</span>'
                f'<span class="date" id="{cid}-d" style="opacity:0">{d["week"]}</span></div></div>')
    def open_js(cid, dur, size=None):
        return _push(cid, dur, 1.0, 1.10) + _flare_js(cid, dur) + S.pop(cid, "k", 1.0, scale=1.18, dur=0.6) + S.rise(cid, "d", 1.6, dy=14, dur=0.4)
    add("s0-lights", 4.6, open_html, open_js, d["open"]["say"])

    # Later scenes sit on the clip's last frame (a still the caller staged) so nothing replays.
    still_assets = dict(assets)
    if still:
        still_assets = {k: v for k, v in assets.items() if k != "lights.mp4"}
        still_assets["lights.jpg"] = still["lights.jpg"]

    # s1 — the games slide in, one row per spoken line
    def rows_html(cid, dur, size):
        rows = "".join(
            f'<div class="row" id="{cid}-r{i}" style="opacity:0"><img class="badge" src="{_media_src(assets, g["badge"])[0]}" alt="" />'
            f'<div><span class="team">{g["nick"]}</span><span class="opp">{"vs" if g["home"] else "at"} {g["opponent"]}</span>'
            f'<span class="when">{g["kickoff"]}</span><span class="where">{g["venue"] if g["home"] else "Away"} · {g["record"]}</span></div></div>'
            for i, g in enumerate(games))
        return f'{_bg(cid, still_assets, dur)}<div class="wrap"><div class="rows">{rows}</div></div>'
    def rows_js(cid, dur, size=None):
        out = _push(cid, dur, 1.10, 1.16) + _flare_js(cid, dur)
        for i in range(len(games)):
            at = 0.2 + i * (dur / max(1, len(games))) * 0.9
            out += f'tl.fromTo("#{cid}-r{i}", {{ autoAlpha:0, x:90 }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"power3.out" }}, {at:.2f});'
        return out
    first = len(subs)
    for g in games:
        subs.append(Sub(0.0, 4.2, g["say"], say=g["say"]))
    add("s1-games", 4.2 * len(games), rows_html, rows_js, None, lines=tuple(range(first, first + len(games))))

    # s2 — how they're doing
    def form_html(cid, dur, size):
        rows = ""
        for i, g in enumerate(games):
            pips = "".join(f'<span class="pip {r["result"]}">{r["result"]}</span>' for r in g.get("results", []))
            last = g.get("last")
            last_line = f'{"Won" if last["result"] == "W" else "Lost"} {last["us"]}–{last["them"]} vs {last["opponent"]}' if last else "Season opener"
            rows += (f'<div class="row" id="{cid}-r{i}" style="opacity:0"><img class="badge" src="{_media_src(assets, g["badge"])[0]}" alt="" />'
                     f'<div><span class="team">{g["nick"]} · {g["record"]}</span><div class="form">{pips}</div><span class="last">Last: {last_line}</span></div></div>')
        return (f'{_bg(cid, still_assets, dur)}<div class="wrap"><div class="top" style="margin-bottom:30px">'
                f'<span class="date" id="{cid}-t" style="opacity:0">How they\'re doing</span></div><div class="rows">{rows}</div></div>')
    def form_js(cid, dur, size=None):
        out = _push(cid, dur, 1.16, 1.22) + _flare_js(cid, dur) + S.rise(cid, "t", 0.1, dy=10, dur=0.35)
        for i in range(len(games)):
            out += f'tl.fromTo("#{cid}-r{i}", {{ autoAlpha:0, x:-90 }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"power3.out" }}, {0.35 + 0.45 * i:.2f});'
        return out
    add("s2-form", 6.0, form_html, form_js, d["form_say"])

    # s3 — every score, live
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
    return Video(slug=d["slug"], title=d.get("title", "GAME NIGHT"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.78, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.20, fade_in=0.3, fade_out=1.2)],
                 note="Lights + card. Facts from football_games. No captions by the owner's call; bed at 0.20.")
