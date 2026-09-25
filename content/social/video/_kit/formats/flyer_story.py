"""THE FLYER — one object, one idea, no narrator.

A typed flyer ages through four shots (pole, wallet, fridge, drawer); between
the generated object shots we cut to close-ups of the same designed flyer —
crisp, creased, faded with a pen note, yellowed and torn. Then the phone: the
real search, a real member's page. Typewriter captions with synced clacks.

    python3 _kit/make.py flyer-story --data @out/flyer/story.json --out out/flyer

Data: slug, assets, beats [ {kind: clip|prop|phone|end, media, media2?, dur, cap?, zoom?, origin?} ],
number {big, small}, url.  No vo_lines: the video is silent but for the bed and the clacks.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _clip_len, _media_src, _video_layers
from .master_story import CAPTURE_H, CAPTURE_W, FIELD

FILM = "filter:contrast(1.03) brightness(0.94) saturate(0.96)"
BAR = 10
TYPE_AT, TYPE_STEP = 0.40, 0.055      # first key, seconds per character


def _css(cid, size):
    g = B.geom(size); s = f'[data-composition-id="{cid}"]'; tall = g["h"] > 1400
    pw = round(g["w"] * (0.58 if tall else 0.26)); pad = round(pw * 0.028)
    ph = round((pw - 2 * pad) * CAPTURE_H / CAPTURE_W) + 2 * pad
    ptop = round(g["h"] * (0.06 if tall else 0.10))
    return f"""
      {s} .mark {{ display:none }}
      {s} .bar {{ position:absolute; left:0; right:0; height:{BAR}%; background:#07040a; z-index:33; }}
      {s} .bar.top {{ top:0 }} {s} .bar.bot {{ bottom:0 }}
      {s} .type {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["safe_bottom_pct"] + 3}%; z-index:38;
        font-family:"Courier New",Courier,monospace; font-weight:700; color:#efe3c4; font-size:{54 if tall else 40}px; line-height:1.25;
        text-shadow:0 2px 0 rgba(0,0,0,0.6), 0 6px 24px rgba(0,0,0,0.6); letter-spacing:1px; }}
      {s} .type span {{ opacity:0 }}
      {s} .type .cur {{ display:inline-block; width:0.55em; height:1.05em; vertical-align:-0.15em; background:#efe3c4; margin-left:2px; opacity:0 }}
      {s} .desk {{ position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 60%, #2a1630 0%, #150a19 55%, #07040a 100%); }}
      {s} .phone {{ position:absolute; box-sizing:border-box; left:{round((g["w"] - pw) / 2)}px; top:{ptop}px; width:{pw}px; height:{ph}px; z-index:34;
        background:#0b0b0d; border-radius:{round(pw * 0.14)}px; padding:{pad}px; box-shadow:0 40px 90px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.08); }}
      {s} .screen {{ position:relative; width:100%; height:100%; overflow:hidden; border-radius:{round(pw * 0.115)}px; background:#000; }}
      {s} .screen img {{ position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; object-position:top; display:block; }}
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .centre {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"26%" if tall else "14%"}; z-index:36; text-align:center; }}
      {s} .big {{ display:block; color:{B.GOLD}; font-weight:800; line-height:1.0; letter-spacing:-8px; font-size:{250 if tall else 180}px; text-shadow:0 10px 40px rgba(10,6,12,0.5); }}
      {s} .title {{ display:block; color:#fff; font-weight:800; line-height:1.04; letter-spacing:-2px; font-size:{64 if tall else 50}px; margin-top:{34 if tall else 22}px; }}
    """


def _typed(cid, text):
    """Markup for a typewriter line: one span per character, plus a cursor."""
    spans = "".join(f'<span id="{cid}-c{i}">{("&nbsp;" if ch == " " else ch)}</span>' for i, ch in enumerate(text))
    return f'<div class="type" id="{cid}-type">{spans}<span class="cur" id="{cid}-cur"></span></div>'


def _type_js(cid, text, at=TYPE_AT):
    out = f'tl.set("#{cid}-cur", {{ opacity:1 }}, {at - 0.15:.2f});'
    for i, ch in enumerate(text):
        out += f'tl.set("#{cid}-c{i}", {{ opacity:1 }}, {at + i * TYPE_STEP:.3f});'
    # blink the cursor a couple of times after the line, then leave it
    end = at + len(text) * TYPE_STEP
    for k in range(4):
        out += f'tl.set("#{cid}-cur", {{ opacity:{k % 2} }}, {end + 0.15 + k * 0.3:.2f});'
    return out


def char_times(d):
    """(t, ch) for every typed character, on the final timeline — for the clack track."""
    out, at = [], 0.0
    for bt in d["beats"]:
        cap = bt.get("cap")
        if cap:
            for i, ch in enumerate(cap):
                out.append((round(at + TYPE_AT + i * TYPE_STEP, 3), ch))
        at = round(at + bt["dur"] - B.X, 2)
    return out


def build(d):
    assets = dict(d.get("assets") or {})
    scenes = []

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    for i, bt in enumerate(d["beats"]):
        kind = bt.get("kind", "clip"); cap = bt.get("cap", "")
        if kind in ("clip", "prop"):
            def html(cid, dur, size, bt=bt, kind=kind, cap=cap):
                src, mk = _media_src(assets, bt["media"])
                art = (_video_layers(cid, src, dur, bt.get("at", 0.0), _clip_len(assets, bt["media"]), FILM)
                       if mk == "video" else f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{FILM}" />')
                return f'{art}<div class="scrim" style="opacity:{0.45 if cap else 0.15}"></div><div class="bar top"></div><div class="bar bot"></div>{_typed(cid, cap) if cap else ""}'
            def js(cid, dur, size=None, bt=bt, cap=cap):
                z0, z1 = bt.get("zoom", [1.0, 1.06])
                out = f'tl.fromTo("#{cid}-bg", {{ scale:{z0} }}, {{ scale:{z1}, duration:{dur:.2f}, ease:"{bt.get("ease", "none")}", transformOrigin:"{bt.get("origin", "50% 50%")}" }}, 0);'
                return out + (_type_js(cid, cap) if cap else "")
        elif kind == "phone":
            def html(cid, dur, size, bt=bt, cap=cap):
                a, _ = _media_src(assets, bt["media"]); b_, _ = _media_src(assets, bt["media2"]) if bt.get("media2") else (None, None)
                img2 = f'<img id="{cid}-ui2" src="{b_}" alt="" style="opacity:0" />' if b_ else ""
                return f'<div class="desk"></div><div class="phone"><div class="screen"><img id="{cid}-ui" src="{a}" alt="" />{img2}</div></div><div class="bar top"></div><div class="bar bot"></div>{_typed(cid, cap) if cap else ""}'
            def js(cid, dur, size=None, bt=bt, cap=cap):
                out = ""
                if bt.get("media2"):
                    out += f'tl.fromTo("#{cid}-ui2", {{ opacity:0, y:40 }}, {{ opacity:1, y:0, duration:0.5, ease:"power2.out" }}, {dur * 0.5:.2f});'
                return out + (_type_js(cid, cap) if cap else "")
        elif kind == "end":
            def html(cid, dur, size, bt=bt):
                return f'''<div class="field"></div>
      <div class="centre">
        <span class="big" id="{cid}-big" style="opacity:0">{bt["big"]}</span>
        <span class="title" id="{cid}-t" style="opacity:0">{bt["small"]}</span>
        <span class="pill" id="{cid}-url" style="margin-top:44px; opacity:0">{bt["url"]}</span>
      </div>'''
            def js(cid, dur, size=None):
                return (S.pop(cid, "big", 0.15, scale=1.4, dur=0.45) + S.rise(cid, "t", 0.65, dy=18, dur=0.44)
                        + f'tl.fromTo("#{cid}-url", {{ autoAlpha:0, y:18, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.5)" }}, 1.15);')
        else:
            raise ValueError(kind)
        scenes.append(Scene(f"s{i}-{kind}", 0.0, float(bt["dur"]), styled(html), js))

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "THE FLYER"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=[], vo_lines=[], assets=assets,
                 audio=[Audio("public/bed.wav", "music", 0.0, total, volume=0.55, fade_in=0.3, fade_out=1.6),
                        Audio("public/sfx.wav", "sfx", 0.0, total, volume=0.9)],
                 note="Silent film: no narrator. Ray is fictional and stays in the past; every 'now' frame is the live site.")
