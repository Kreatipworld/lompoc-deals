"""MASTER STORY — the platform commercial, told as a film.

Then: how a town used to find a business, in objects (generated clips, no
people, no hands, no readable text) under a warm film grade with letterbox
bars. The turn: a phone lights up with the real home page. Now: real captures
of the live site inside a phone frame, dead-center, scrolled to land on whole
cards. Then the members' own photos, the number, the end card.

    python3 _kit/make.py master-story --data "$(cat out/master-story/story.json)" --out out/master-story --vo out/master-story/public

Data contract:

    slug, title
    assets      staged public/ filename -> path or URL
    then        [ {media, say, cap?, kicker?, brightness?} ]      generated clips, one sentence each
    turn        {media, say, cap?}                                  the phone lights up (a UI capture)
    ui          [ {media, media2?, scroll:[y0,y1], scroll2?, say, cap?} ]   capture px, 1179-wide images
    montage     {photos:[{media, name}], say, cap?}                 their own photos, name chips
    stat        {chip, big, title, rows:[[big,small],...], say}
    end         {chip, title, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _clip_len, _exit, _media_src, _video_layers

FIELD = f"radial-gradient(ellipse 90% 70% at 50% 40%, #7d1590 0%, {B.PURPLE} 45%, #3a0743 100%)"
FILM = "filter:contrast(1.03) brightness(0.94) saturate(0.96)"
CAPTURE_W, CAPTURE_H = 1179, 1980   # Playwright "iPhone 14 Pro" viewport is 393×660 css (no browser chrome), at 3x
BAR = 10              # letterbox bar height, % of frame

THEN, TURN, UI, MONTAGE, STAT, END = 4.2, 3.8, 4.0, 8.0, 6.0, 4.5


def _css(cid: str, size) -> str:
    g = B.geom(size)
    s = f'[data-composition-id="{cid}"]'
    tall = g["h"] > 1400
    # The phone: centred by computed left, never a transform. Screen is 393:852.
    pw = round(g["w"] * (0.58 if tall else 0.26))
    pad = round(pw * 0.028)
    # The screen inside the bezel has exactly the capture's shape, so a viewport
    # capture fills it edge to edge — no strip at the bottom, no crop at the sides.
    ph = round((pw - 2 * pad) * CAPTURE_H / CAPTURE_W) + 2 * pad
    ptop = round(g["h"] * (0.06 if tall else 0.10))
    return f"""
      {s} .bar {{ position:absolute; left:0; right:0; height:{BAR}%; background:#07040a; z-index:33; }}
      {s} .bar.top {{ top:0 }} {s} .bar.bot {{ bottom:0 }}
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .bloom {{ position:absolute; left:50%; top:40%; width:1100px; height:1100px; margin-left:-550px; margin-top:-550px; border-radius:50%; background:radial-gradient(circle, rgba(239,198,24,0.16), rgba(239,198,24,0) 60%); opacity:0; }}
      {s} .block {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36; }}
      {s} .centre {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"22%" if tall else "12%"}; z-index:36; text-align:center; }}
      {s} .kicker {{ display:inline-block; color:{B.GOLD}; font-weight:800; font-size:{34 if tall else 28}px; letter-spacing:8px; text-transform:uppercase; background:rgba(20,10,23,0.78); padding:12px 22px 12px 26px; border-radius:10px; }}
      {s} .big {{ display:block; color:{B.GOLD}; font-weight:800; line-height:0.9; letter-spacing:-8px; text-shadow:0 10px 40px rgba(10,6,12,0.5); }}
      {s} .title {{ display:block; color:#fff; font-weight:800; line-height:1.04; letter-spacing:-2px; text-shadow:0 8px 34px rgba(10,6,12,0.6); }}
      {s} .sub {{ display:block; color:rgba(255,255,255,0.86); font-weight:600; line-height:1.25; }}
      {s} .row {{ display:flex; align-items:baseline; justify-content:center; gap:20px; opacity:0; }}
      {s} .rowbig {{ color:{B.GOLD}; font-weight:800; font-size:{96 if tall else 72}px; line-height:1; letter-spacing:-3px; }}
      {s} .rowsmall {{ color:#fff; font-weight:700; font-size:{40 if tall else 32}px; }}
      {s} .cardchip {{ display:inline-block; background:{B.GREEN}; color:#fff; font-weight:800; font-size:30px; letter-spacing:4px; padding:12px 26px; border-radius:10px; text-transform:uppercase; }}
      {s} .desk {{ position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 60%, #2a1630 0%, #150a19 55%, #07040a 100%); }}
      {s} .phone {{ position:absolute; box-sizing:border-box; left:{round((g["w"] - pw) / 2)}px; top:{ptop}px; width:{pw}px; height:{ph}px; z-index:34;
        background:#0b0b0d; border-radius:{round(pw * 0.14)}px; padding:{pad}px; box-shadow:0 40px 90px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.08); }}
      {s} .screen {{ position:relative; width:100%; height:100%; overflow:hidden; border-radius:{round(pw * 0.115)}px; background:#000; }}
      {s} .screen img {{ position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; object-position:top; display:block; will-change:transform; }}
      {s} .glow {{ position:absolute; left:50%; top:{ptop + round(ph / 2)}px; width:{round(pw * 1.9)}px; height:{round(pw * 1.9)}px; margin-left:-{round(pw * 0.95)}px; margin-top:-{round(pw * 0.95)}px; border-radius:50%;
        background:radial-gradient(circle, rgba(239,198,24,0.22), rgba(101,12,117,0.18) 45%, rgba(0,0,0,0) 68%); opacity:0; z-index:32; }}
      {s} .namechip {{ display:inline-block; background:rgba(20,10,23,0.72); color:#fff; font-weight:800; font-size:{44 if tall else 36}px; letter-spacing:-0.5px; padding:16px 30px; border-radius:14px; border-left:8px solid {B.GOLD}; }}
    """


def _styled(html):
    return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)


def _bars():
    return '<div class="bar top"></div><div class="bar bot"></div>'


def _phone(cid: str, assets: dict, key: str, extra_id: str = "") -> tuple:
    """(markup, scale factor capture-px -> screen-px) for one capture inside the phone."""
    src, _ = _media_src(assets, key)
    img_id = f"{cid}-{extra_id or 'ui'}"
    return f'<img id="{img_id}" src="{src}" alt="" data-layout-allow-overflow />', img_id


def build(d: dict) -> Video:
    for k in ("slug", "then", "turn", "ui", "montage", "stat", "end"):
        if not d.get(k):
            raise ValueError(f"master_story needs {k!r}")
    assets = dict(d.get("assets") or {})
    scenes, subs = [], []

    def add(cid, dur, html, js, say, cap):
        scenes.append(Scene(cid, 0.0, dur, _styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, cap, say=say))

    # ── THEN: filmed clips under bars; a designed close-up can cut in mid-beat ──
    for i, bt in enumerate(d["then"]):
        def html(cid, dur, size, bt=bt, i=i):
            g = B.geom(size)
            tall = g["h"] > 1400
            src, kind = _media_src(assets, bt["media"])
            head = float(bt.get("title_hold", 0.0))          # a title card before the clip
            body = dur - head
            art = (_video_layers(cid, src, body, bt.get("at", 0.0), _clip_len(assets, bt["media"]), FILM)
                   if kind == "video" else f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{FILM}" />')
            if head:
                art = art.replace('data-start="0"', f'data-start="{head:.2f}"', 1)
            insert = ""
            if bt.get("insert"):
                isrc, _ = _media_src(assets, bt["insert"])
                insert = f'<img id="{cid}-ins" class="cover" src="{isrc}" alt="" style="opacity:0; z-index:32; {FILM}" />'
            title = ""
            if bt.get("title"):
                title = (f'<div id="{cid}-card" style="position:absolute; inset:0; z-index:40; opacity:0; background:#07040a; display:flex; align-items:center; justify-content:center; text-align:center">'
                         f'<span style="font-family:Georgia,\'Times New Roman\',serif; color:#e8dcc0; font-size:{72 if tall else 56}px; letter-spacing:6px; text-transform:uppercase; line-height:1.3; padding:0 {g["side"]}px">{bt["title"]}</span></div>')
            return f'''<style>[data-composition-id="{cid}"] .mark {{ display:none }}</style>
      {art}{insert}
      <div class="scrim" style="opacity:0.5"></div>
      {_bars()}
      {title}'''

        def js(cid, dur, size=None, bt=bt):
            head = float(bt.get("title_hold", 0.0))
            out = f'tl.fromTo("#{cid}-bg", {{ scale:1.0 }}, {{ scale:1.06, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
            if bt.get("title"):
                # A real opacity tween at t=0 so the checker knows the card is meant to be the first frame.
                out += (f'tl.fromTo("#{cid}-card", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.06, ease:"none" }}, 0);'
                        f'tl.to("#{cid}-card", {{ autoAlpha:0, duration:0.10, ease:"none" }}, {head:.2f});')
            if bt.get("insert"):
                at = float(bt.get("cut_at", dur * 0.45))
                out += (f'tl.set("#{cid}-ins", {{ opacity:1 }}, {at:.2f});'
                        f'tl.fromTo("#{cid}-ins", {{ scale:{bt.get("insert_zoom", [1.0, 1.22])[0]} }}, {{ scale:{bt.get("insert_zoom", [1.0, 1.22])[1]}, duration:{dur - at:.2f}, ease:"power1.inOut", transformOrigin:"{bt.get("insert_origin", "50% 42%")}" }}, {at:.2f});')
            return out
        add(f"s{i}-then", THEN, html, js, bt["say"], bt.get("cap", bt["say"]))

    n = len(d["then"])

    # ── THE TURN: a dark desk, the phone lights up with the home page ───────
    tn = d["turn"]

    def turn_html(cid, dur, size):
        img, _ = _phone(cid, assets, tn["media"])
        return f'''<div class="desk"></div>
      <div class="glow" id="{cid}-glow" data-layout-allow-overflow></div>
      <div class="phone" id="{cid}-phone"><div class="screen" id="{cid}-scr" style="opacity:0">{img}</div></div>
      {_bars()}'''

    def turn_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-phone", {{ scale:0.96, y:14 }}, {{ scale:1, y:0, duration:1.0, ease:"power2.out", transformOrigin:"50% 50%" }}, 0);'
                f'tl.to("#{cid}-scr", {{ opacity:1, duration:0.55, ease:"power2.out" }}, 0.55);'
                f'tl.to("#{cid}-glow", {{ opacity:1, duration:0.9, ease:"power2.out" }}, 0.6);')
    add(f"s{n}-turn", TURN, turn_html, turn_js, tn["say"], tn.get("cap", tn["say"]))
    n += 1

    # ── NOW: captures in the phone, scrolled to whole cards ────────────────
    for i, bt in enumerate(d["ui"]):
        def html(cid, dur, size, bt=bt):
            g = B.geom(size)
            img1, _ = _phone(cid, assets, bt["media"], "ui")
            img2 = ""
            if bt.get("media2"):
                img2, _ = _phone(cid, assets, bt["media2"], "ui2")
                img2 = img2.replace('alt=""', 'alt="" style="opacity:0"')
            return f'''<div class="desk"></div>
      <div class="glow" id="{cid}-glow" data-layout-allow-overflow style="opacity:1"></div>
      <div class="phone"><div class="screen">{img1}{img2}</div></div>
      {_bars()}'''

        def js(cid, dur, size=None, bt=bt):
            g = B.geom(size or B.SIZES["9x16"])
            tall = g["h"] > 1400
            pw = round(g["w"] * (0.58 if tall else 0.26)) - 2 * round(g["w"] * (0.58 if tall else 0.26) * 0.028)
            k = pw / CAPTURE_W
            y0, y1 = bt.get("scroll", [0, 0])
            hold = 0.7
            travel = max(0.8, dur - hold - 0.9)
            out = (f'tl.set("#{cid}-ui", {{ y:{-y0 * k:.1f} }}, 0);'
                   f'tl.to("#{cid}-ui", {{ y:{-y1 * k:.1f}, duration:{travel:.2f}, ease:"power2.inOut" }}, {hold});')
            if bt.get("media2") and not bt.get("scroll") and not bt.get("scroll2"):
                half = dur / 2
                return (f'tl.fromTo("#{cid}-ui", {{ scale:1.0 }}, {{ scale:1.0, duration:0.1 }}, 0);'
                        f'tl.fromTo("#{cid}-ui2", {{ opacity:0, y:40 }}, {{ opacity:1, y:0, duration:0.55, ease:"power2.out" }}, {half:.2f});')
            if bt.get("media2"):
                z0, z1 = bt.get("scroll2", [0, 0])
                half = dur / 2
                out = (f'tl.set("#{cid}-ui", {{ y:{-y0 * k:.1f} }}, 0);'
                       f'tl.to("#{cid}-ui", {{ y:{-y1 * k:.1f}, duration:{max(0.6, half - 0.9):.2f}, ease:"power2.inOut" }}, 0.5);'
                       f'tl.set("#{cid}-ui2", {{ y:{-z0 * k:.1f} }}, 0);'
                       f'tl.to("#{cid}-ui2", {{ opacity:1, duration:0.35, ease:"power1.inOut" }}, {half:.2f});'
                       f'tl.to("#{cid}-ui2", {{ y:{-z1 * k:.1f}, duration:{max(0.6, half - 0.9):.2f}, ease:"power2.inOut" }}, {half + 0.4:.2f});')
            return out
        add(f"s{n + i}-ui", UI, html, js, bt["say"], bt.get("cap", bt["say"]))
    n += len(d["ui"])

    # ── MONTAGE: their own photos, one name chip each ──────────────────────
    mo = d["montage"]

    def montage_html(cid, dur, size):
        g = B.geom(size)
        layers, chips = [], []
        for i, ph in enumerate(mo["photos"]):
            src, _ = _media_src(assets, ph["media"])
            layers.append(f'<img id="{cid}-p{i}" class="cover" src="{src}" alt="" style="opacity:{1 if i == 0 else 0}; filter:brightness(0.92) saturate(1.05)" />')
            # Tall frames: chip in the text block above the caption band. Square and wide frames
            # have no room there — the band swallows it — so the chip goes top-left under the bars.
            anchor = "bottom:0" if g["h"] > 1400 else "top:0"
            chips.append(f'<span class="namechip" id="{cid}-n{i}" style="opacity:0; position:absolute; left:0; {anchor}">{ph["name"]}</span>')
        return f'''{"".join(layers)}
      <div class="scrim" style="opacity:0.7"></div>
      {_bars()}
      {f'<div class="block" style="height:120px">{"".join(chips)}</div>' if g["h"] > 1400 else f'<div style="position:absolute; left:{g["side"]}px; top:{BAR + 6}%; height:120px; z-index:36">{"".join(chips)}</div>'}'''

    def montage_js(cid, dur, size=None):
        n_ = len(mo["photos"])
        each = dur / n_
        out = ""
        for i in range(n_):
            t0 = i * each
            out += f'tl.fromTo("#{cid}-p{i}", {{ scale:1.0 }}, {{ scale:1.07, duration:{each + 0.4:.2f}, ease:"none", transformOrigin:"50% 50%" }}, {t0:.2f});'
            if i:
                out += f'tl.to("#{cid}-p{i}", {{ opacity:1, duration:0.32, ease:"power1.inOut" }}, {t0:.2f});'
            out += S.rise(cid, f"n{i}", t0 + 0.18, dy=14, dur=0.34)
            out += S.out(cid, f"n{i}", t0 + each - 0.22, dur=0.20)
        return out
    add(f"s{n}-montage", MONTAGE, montage_html, montage_js, mo["say"], mo.get("cap", mo["say"]))
    n += 1

    # ── THE NUMBER ─────────────────────────────────────────────────────────
    st = d["stat"]

    def stat_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        rows = "".join(
            f'<div class="row" id="{cid}-r{i}" style="margin-top:{(26 if tall else 14) if i else 44}px">'
            f'<span class="rowbig">{big}</span><span class="rowsmall">{small}</span></div>'
            for i, (big, small) in enumerate(st.get("rows", []))
        )
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre" style="top:{"16%" if tall else "8%"}">
        <span class="chip" id="{cid}-chip" style="opacity:0">{st["chip"]}</span>
        <span class="big" id="{cid}-big" style="margin-top:{34 if tall else 22}px; font-size:{230 if tall else 170}px; line-height:1.05; opacity:0">{st["big"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:{56 if tall else 36}px; font-size:{64 if tall else 50}px; opacity:0">{st["title"]}</span>
        {rows}
      </div>'''

    def stat_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
               + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
               + S.pop(cid, "big", 0.26, scale=1.5, dur=0.42)
               + S.rise(cid, "t", 0.80, dy=18, dur=0.44))
        els = ["chip", "big", "t"]
        for i in range(len(st.get("rows", []))):
            out += S.pop(cid, f"r{i}", 1.30 + 0.36 * i, scale=1.25, dur=0.34); els.append(f"r{i}")
        return out + _exit(cid, dur, tuple(els))
    add(f"s{n}-stat", STAT, stat_html, stat_js, st["say"], st.get("cap", st["title"]))
    n += 1

    # ── END CARD ───────────────────────────────────────────────────────────
    en = d["end"]

    def end_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre" style="top:{"22%" if tall else "12%"}">
        <div id="{cid}-logo" style="opacity:0"><img src="public/mark-end.png" alt="" style="width:{round(g["w"] * (0.16 if tall else 0.08))}px; height:auto; display:inline-block" />
          <span class="title" style="margin-top:{18 if tall else 10}px; font-size:{58 if tall else 44}px; letter-spacing:6px">LOMPOC <span style="color:{B.GOLD}">LOCALS</span></span></div>
        <span class="title" id="{cid}-t" style="margin-top:{40 if tall else 24}px; font-size:{en.get("size", 84 if tall else 62)}px; opacity:0">{en["title"]}</span>
        <span class="pill" id="{cid}-url" style="margin-top:{48 if tall else 30}px; opacity:0; box-shadow:0 16px 40px rgba(10,6,12,0.4)">{en["url"]}</span>
      </div>'''

    def end_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.10);'
                + S.pop(cid, "logo", 0.15, scale=1.12, dur=0.5)
                + S.rise(cid, "t", 0.55, dy=20, dur=0.46)
                + f'tl.fromTo("#{cid}-url", {{ autoAlpha:0, y:18, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.5)" }}, 1.05);')
    scenes.append(Scene(f"s{n}-end", 0.0, END, _styled(end_html), end_js, lines=(len(subs),)))
    subs.append(Sub(0.0, END, en["url"], say=en["say"]))

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)

    return Video(
        slug=d["slug"], title=d.get("title", f"MASTER STORY — {d['slug']}"), total=total,
        size=B.SIZES["9x16"], scenes=scenes, subs=subs,
        vo_lines=[B.for_tts(s.spoken) for s in subs], assets=assets,
        audio=[
            Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.20),
            Audio("public/bed.wav", "music", 0.0, total, volume=0.26, fade_in=0.4, fade_out=1.4),
        ],
        note=d.get("note", "Generated clips are objects only. Every 'now' frame is the live site or a member's own photo."),
    )
