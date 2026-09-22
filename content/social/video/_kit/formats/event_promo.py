"""EVENT PROMO — one upcoming event, told with history and numbers.

We run dozens of events a month and until now had no format for one: every
event video was a listing card read aloud. This one is a promo with a spine —
a cold open, the story so far, what it is today, what is new, and only then
the invitation — so a 40th anniversary reads like an anniversary and not
like a calendar row.

    python3 _kit/make.py event-promo --data "$(cat out/<project>/event.json)" --out out/<project>

Data contract (all copy is passed in; the format asserts nothing itself):

    slug            "aquarium-40"
    title           build title, for the report
    assets          staged public/ filename -> local path or URL. Generated
                    b-roll and our own designed cards only; never a photo we
                    do not own.
    open            {big, small, media, say, cap, chip?}
                    the cold open: one big figure ("40 years") over one clip
    beats           [ {kind: "clip",  media, chip, title, sub?, say, cap?, at?, zoom?}
                      {kind: "stat",  chip, big, title, sub?, span?, say, cap?}
                      {kind: "rows",  chip, rows: [[big, small], ...], say, cap?}
                      {kind: "card",  chip, title, sub?, media?, say, cap?}
                      {kind: "review", chip, big, title, quote, credit, say, cap?} ]
    invite          {chip, date, time, venue, address, note?, say, cap?}   optional
    end             {chip, title, line, venue?, url, note?, say}   the poster; carries
                    the invitation itself when `invite` is omitted

`say` is what the voice reads; `cap` is the burned-in caption. When `cap` is
omitted the caption is the scene's own title, which the kit then drops as a
duplicate of what the frame already prints — so a card that says everything
on screen gets no caption band, and a clip beat whose caption carries the
spoken sentence gets one.

Two rules this format exists to keep:

* Generated footage is mood, never evidence. A clip beat's chip and title
  state a sourced fact ("20+ live & static displays"); nothing on a generated
  clip may name the venue, its tanks or its artwork as the thing pictured.
  The venue's name appears only on designed cards — the invitation and the
  end card — which show no footage.
* A beat never outruns its clip. Clip beats go through the spotlight's
  `_video_layers`, which slows one continuous take to fit the sentence and
  refuses below 0.75x rather than replaying the shot.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _chip, _clip_len, _exit, _media_src, _pick, _video_layers

DEEP = "#3a0743"
FIELD = f"radial-gradient(ellipse 90% 70% at 50% 40%, #7d1590 0%, {B.PURPLE} 45%, {DEEP} 100%)"
OCEAN = "radial-gradient(ellipse 90% 70% at 50% 30%, #1c6f8a 0%, #0f3f55 48%, #08202c 100%)"

# Rough lengths before the read re-times them (silent preview builds only).
OPEN, BEAT, END = 3.6, 4.2, 5.0


def _css(cid: str, size) -> str:
    g = B.geom(size)
    s = f'[data-composition-id="{cid}"]'
    tall = g["h"] > 1400
    return f"""
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .ocean {{ position:absolute; inset:0; background:{OCEAN}; }}
      {s} .bloom {{ position:absolute; left:50%; top:40%; width:1100px; height:1100px; margin-left:-550px; margin-top:-550px; border-radius:50%; background:radial-gradient(circle, rgba(239,198,24,0.16), rgba(239,198,24,0) 60%); opacity:0; }}
      {s} .block {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36; }}
      {s} .centre {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"24%" if tall else "14%"}; z-index:36; text-align:center; }}
      {s} .big {{ display:block; color:{B.GOLD}; font-weight:800; line-height:0.9; letter-spacing:-8px; text-shadow:0 10px 40px rgba(10,6,12,0.5); }}
      {s} .title {{ display:block; color:#fff; font-weight:800; line-height:1.04; letter-spacing:-2px; text-shadow:0 8px 34px rgba(10,6,12,0.6); }}
      {s} .sub {{ display:block; color:rgba(255,255,255,0.86); font-weight:600; line-height:1.25; letter-spacing:0; }}
      {s} .rule {{ display:block; height:6px; background:{B.GOLD}; border-radius:3px; transform-origin:0% 50%; }}
      {s} .year {{ color:rgba(255,255,255,0.8); font-weight:800; font-size:34px; letter-spacing:3px; }}
      {s} .row {{ display:flex; align-items:baseline; justify-content:center; gap:22px; opacity:0; }}
      {s} .rowbig {{ color:{B.GOLD}; font-weight:800; font-size:{124 if tall else 96}px; line-height:1; letter-spacing:-4px; }}
      {s} .rowsmall {{ color:#fff; font-weight:700; font-size:{46 if tall else 38}px; letter-spacing:-0.5px; }}
      {s} .card {{ display:inline-block; background:rgba(20,10,23,0.66); border-radius:30px; padding:{"38px 46px" if tall else "26px 40px"}; box-shadow:0 24px 60px rgba(10,6,12,0.5); }}
      {s} .cardchip {{ display:inline-block; background:{B.GREEN}; color:#fff; font-weight:800; font-size:30px; letter-spacing:4px; padding:12px 26px; border-radius:10px; text-transform:uppercase; }}
    """


def _styled(html):
    return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)


def _art(cid: str, assets: dict, key: str, dur: float, at: float, grade: str) -> str:
    """The beat's picture: a slowed single take for a clip, a plain cover for a still."""
    src, kind = _media_src(assets, key)
    if kind == "video":
        return _video_layers(cid, src, dur, at, _clip_len(assets, key), grade)
    return f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{grade}" data-layout-allow-overflow />'


def build(d: dict) -> Video:
    for k in ("slug", "open", "beats", "end"):
        if not d.get(k):
            raise ValueError(f"event_promo needs {k!r}")
    assets = dict(d.get("assets") or {})
    scenes, subs = [], []

    def add(cid, dur, html, js, say, cap):
        scenes.append(Scene(cid, 0.0, dur, _styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, cap, say=say))

    # ── cold open: one figure, painted at t=0 because frame 0 is the thumbnail ──
    op = d["open"]

    def open_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        art = _art(cid, assets, op["media"], dur, op.get("at", 0.0),
                   f'filter:brightness({op.get("brightness", 0.82)}) saturate(1.1)')
        chip_top, chip_in = _chip(cid, g, op.get("chip", ""))
        chip_top, chip_in = chip_top.replace("opacity:0", "opacity:1"), chip_in.replace("opacity:0", "opacity:1")
        return f'''{art}
      <div class="scrim"></div>
      {chip_top}
      <div class="block">
        {chip_in}<span class="big" id="{cid}-big" style="font-size:{300 if tall else 220}px">{op["big"]}</span>
        <span class="title" id="{cid}-small" style="margin-top:18px; font-size:{72 if tall else 58}px">{op["small"]}</span>
      </div>'''

    def open_js(cid, dur, size=None):
        z = _pick(op.get("zoom"), size, [1.0, 1.08])
        return (f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
                f'tl.fromTo("#{cid}-big", {{ scale:1.06 }}, {{ scale:1, duration:1.2, ease:"power3.out", transformOrigin:"0% 100%" }}, 0);'
                f'tl.fromTo("#{cid}-small", {{ y:12 }}, {{ y:0, duration:0.9, ease:"power2.out" }}, 0);'
                + _exit(cid, dur, (("chip",) if op.get("chip") else ()) + ("big", "small")))

    add("s0-open", OPEN, open_html, open_js, op["say"], op.get("cap", op["say"]))

    # ── the beats ─────────────────────────────────────────────────────────
    def clip_beat(bt):
        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            art = _art(cid, assets, bt["media"], dur, bt.get("at", 0.0),
                       f'filter:brightness({bt.get("brightness", 0.9)}) saturate({bt.get("saturate", 1.08)})')
            chip_top, chip_in = _chip(cid, g, bt.get("chip", ""))
            sub = (f'<span class="sub" id="{cid}-sub" style="margin-top:20px; font-size:{40 if tall else 34}px; opacity:0">{bt["sub"]}</span>'
                   if bt.get("sub") else "")
            return f'''{art}
      <div class="scrim"></div>
      {chip_top}
      <div class="block">
        {chip_in}<span class="title" id="{cid}-t" style="font-size:{bt.get("size", 84 if tall else 68)}px; opacity:0">{bt["title"]}</span>{sub}
      </div>'''

        def js(cid, dur, size=None):
            z = _pick(bt.get("zoom"), size, [1.0, 1.07])
            out = f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
            els = []
            if bt.get("chip"):
                out += S.rise(cid, "chip", 0.10, dy=12, dur=0.34); els.append("chip")
            out += S.rise(cid, "t", 0.26, dy=22, dur=0.46); els.append("t")
            if bt.get("sub"):
                out += S.rise(cid, "sub", 0.62, dy=12, dur=0.36); els.append("sub")
            return out + _exit(cid, dur, tuple(els))
        return html, js

    def stat_beat(bt):
        """One big figure on the house field, with an optional span rule
        ("1986 ──── 2026") drawn underneath it."""
        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            span = ""
            if bt.get("span"):
                a, b = bt["span"]
                span = (f'<div id="{cid}-span" style="display:flex; align-items:center; gap:22px; margin-top:{38 if tall else 26}px; opacity:0">'
                        f'<span class="year">{a}</span><span class="rule" id="{cid}-rule" style="flex:1"></span><span class="year">{b}</span></div>')
            sub = (f'<span class="sub" id="{cid}-sub" style="margin-top:22px; font-size:{38 if tall else 32}px; opacity:0">{bt["sub"]}</span>'
                   if bt.get("sub") else "")
            return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre">
        <span class="chip" id="{cid}-chip" style="opacity:0">{bt["chip"]}</span>
        <span class="big" id="{cid}-big" style="margin-top:{34 if tall else 22}px; font-size:{250 if tall else 190}px; opacity:0">{bt["big"]}</span>
        {span}
        <span class="title" id="{cid}-t" style="margin-top:{36 if tall else 24}px; font-size:{68 if tall else 54}px; opacity:0">{bt["title"]}</span>{sub}
      </div>'''

        def js(cid, dur, size=None):
            out = (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
                   + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
                   + S.pop(cid, "big", 0.22, scale=1.42, dur=0.38))
            els = ["chip", "big", "t"]
            if bt.get("span"):
                out += (f'tl.fromTo("#{cid}-span", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.3 }}, 0.62);'
                        f'tl.fromTo("#{cid}-rule", {{ scaleX:0 }}, {{ scaleX:1, duration:0.9, ease:"power2.inOut" }}, 0.66);')
                els.append("span")
            out += S.rise(cid, "t", 0.95, dy=18, dur=0.44)
            if bt.get("sub"):
                out += S.rise(cid, "sub", 1.30, dy=12, dur=0.36); els.append("sub")
            return out + _exit(cid, dur, tuple(els))
        return html, js

    def rows_beat(bt):
        """Two or three figure-and-label rows: 'Hundreds / of students'."""
        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            rows = "".join(
                f'<div class="row" id="{cid}-r{i}" style="margin-top:{(34 if tall else 18) if i else 40}px">'
                f'<span class="rowbig">{big}</span><span class="rowsmall">{small}</span></div>'
                for i, (big, small) in enumerate(bt["rows"])
            )
            return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre">
        <span class="chip" id="{cid}-chip" style="opacity:0">{bt["chip"]}</span>
        {rows}
      </div>'''

        def js(cid, dur, size=None):
            out = (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
                   + S.rise(cid, "chip", 0.10, dy=12, dur=0.34))
            els = ["chip"]
            for i in range(len(bt["rows"])):
                out += S.pop(cid, f"r{i}", 0.26 + 0.42 * i, scale=1.3, dur=0.36); els.append(f"r{i}")
            return out + _exit(cid, dur, tuple(els))
        return html, js

    def review_beat(bt):
        """Social proof as a designed card: the rating big, the count, then one
        public review in quotation marks with its credit. Never footage."""
        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre" style="top:{"20%" if tall else "11%"}">
        <span class="chip" id="{cid}-chip" style="opacity:0">{bt["chip"]}</span>
        <span class="big" id="{cid}-big" style="margin-top:{30 if tall else 18}px; font-size:{230 if tall else 170}px; line-height:1.05; letter-spacing:-6px; opacity:0">{bt["big"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:{40 if tall else 24}px; font-size:{60 if tall else 48}px; opacity:0">{bt["title"]}</span>
        <span class="sub" id="{cid}-q" style="margin-top:{44 if tall else 26}px; font-size:{40 if tall else 32}px; font-style:italic; opacity:0">&ldquo;{bt["quote"]}&rdquo;</span>
        <span class="sub" id="{cid}-c" style="margin-top:14px; font-size:{28 if tall else 24}px; color:rgba(255,255,255,0.68); letter-spacing:1px; opacity:0">&mdash; {bt["credit"]}</span>
      </div>'''

        def js(cid, dur, size=None):
            return (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
                    + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
                    + S.pop(cid, "big", 0.22, scale=1.25, dur=0.38)
                    + S.rise(cid, "t", 0.62, dy=16, dur=0.40)
                    + S.rise(cid, "q", 0.95, dy=16, dur=0.44)
                    + S.rise(cid, "c", 1.25, dy=8, dur=0.30)
                    + _exit(cid, dur, ("chip", "big", "t", "q", "c")))
        return html, js

    def card_beat(bt):
        """A statement card on the ocean field: a chip and a headline, no footage."""
        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            sub = (f'<span class="sub" id="{cid}-sub" style="margin-top:24px; font-size:{38 if tall else 32}px; opacity:0">{bt["sub"]}</span>'
                   if bt.get("sub") else "")
            return f'''<div class="ocean"></div>
      <div style="position:absolute; left:0; right:0; top:10%; height:2px; z-index:20; background:linear-gradient(90deg, transparent, {B.GOLD}, transparent); opacity:0.5"></div>
      <div class="centre" style="top:{"28%" if tall else "18%"}">
        <span class="chip" id="{cid}-chip" style="opacity:0">{bt["chip"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:{40 if tall else 26}px; font-size:{bt.get("size", 76 if tall else 60)}px; opacity:0">{bt["title"]}</span>{sub}
      </div>'''

        def js(cid, dur, size=None):
            out = S.rise(cid, "chip", 0.10, dy=12, dur=0.34) + S.rise(cid, "t", 0.30, dy=24, dur=0.5)
            els = ["chip", "t"]
            if bt.get("sub"):
                out += S.rise(cid, "sub", 0.85, dy=12, dur=0.36); els.append("sub")
            return out + _exit(cid, dur, tuple(els))
        return html, js

    KINDS = {"clip": clip_beat, "stat": stat_beat, "rows": rows_beat, "card": card_beat, "review": review_beat}
    for i, bt in enumerate(d["beats"]):
        kind = bt.get("kind", "clip")
        if kind not in KINDS:
            raise ValueError(f"beat {i}: unknown kind {kind!r}; have {sorted(KINDS)}")
        html, js = KINDS[kind](bt)
        title = bt.get("title") or " ".join(x for r in bt.get("rows", []) for x in r) or bt.get("big", "")
        add(f"s{i + 1}-{kind}", BEAT, html, js, bt["say"], bt.get("cap", title))

    # ── the invitation: everything a person needs, on one designed card ────
    # Optional. When the end poster already prints the date, time, price and
    # address, a separate invite card says the same thing twice in a row —
    # seven seconds of purple to close a hype piece — so leave it out.
    iv = d.get("invite") or {}
    n = len(d["beats"]) + 1

    def invite_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        note = (f'<span class="sub" id="{cid}-note" style="margin-top:26px; font-size:{32 if tall else 28}px; color:rgba(255,255,255,0.72); opacity:0">{iv["note"]}</span>'
                if iv.get("note") else "")
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre" style="top:{"20%" if tall else "11%"}">
        <span class="cardchip" id="{cid}-chip" style="opacity:0">{iv["chip"]}</span>
        <span class="big" id="{cid}-date" style="margin-top:{52 if tall else 34}px; font-size:{150 if tall else 112}px; letter-spacing:-5px; opacity:0">{iv["date"]}</span>
        <span class="title" id="{cid}-time" style="margin-top:{18 if tall else 10}px; font-size:{104 if tall else 80}px; opacity:0">{iv["time"]}</span>
        <div id="{cid}-where" class="card" style="margin-top:{44 if tall else 28}px; opacity:0">
          <span class="title" style="font-size:{50 if tall else 42}px; letter-spacing:-1px">{iv["venue"]}</span>
          <span class="sub" style="margin-top:12px; font-size:{38 if tall else 32}px; color:{B.GOLD}; font-weight:700">{iv["address"]}</span>
        </div>{note}
      </div>'''

    def invite_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
               + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
               + S.pop(cid, "date", 0.24, scale=1.22, dur=0.40)
               + S.rise(cid, "time", 0.60, dy=18, dur=0.42)
               + S.rise(cid, "where", 0.95, dy=22, dur=0.46))
        els = ["chip", "date", "time", "where"]
        if iv.get("note"):
            out += S.rise(cid, "note", 1.40, dy=10, dur=0.34); els.append("note")
        return out + _exit(cid, dur, tuple(els))

    if iv:
        add(f"s{n}-invite", BEAT, invite_html, invite_js, iv["say"],
            iv.get("cap", f'{iv["date"]} {iv["time"]}'))
        n += 1

    # ── end card: a poster for the night, not a footer ─────────────────────
    en = d["end"]

    def end_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        venue = (f'<span class="sub" id="{cid}-venue" style="margin-top:{18 if tall else 10}px; font-size:{40 if tall else 34}px; color:rgba(255,255,255,0.9); font-weight:700; opacity:0">{en["venue"]}</span>'
                 if en.get("venue") else "")
        note = (f'<span id="{cid}-note" style="display:block; margin-top:{40 if tall else 24}px; color:rgba(255,255,255,0.74); font-weight:600; font-size:24px; letter-spacing:1.5px; text-transform:uppercase; opacity:0">{en["note"]}</span>'
                if en.get("note") else "")
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre" style="top:{"18%" if tall else "10%"}">
        <span class="cardchip" id="{cid}-chip" style="opacity:0">{en["chip"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:{34 if tall else 20}px; font-size:{en.get("size", 96 if tall else 72)}px; opacity:0">{en["title"]}</span>
        <span class="big" id="{cid}-line" style="margin-top:{30 if tall else 16}px; font-size:{en.get("line_size", 78 if tall else 60)}px; letter-spacing:-3px; opacity:0">{en["line"]}</span>{venue}
        <span class="pill" id="{cid}-url" style="margin-top:{48 if tall else 30}px; opacity:0; box-shadow:0 16px 40px rgba(10,6,12,0.4)">{en["url"]}</span>{note}
      </div>'''

    def end_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.10);'
               + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
               + S.pop(cid, "t", 0.24, scale=1.22, dur=0.42)
               + S.pop(cid, "line", 0.50, scale=1.18, dur=0.40))
        if en.get("venue"):
            out += S.rise(cid, "venue", 0.80, dy=12, dur=0.34)
        out += f'tl.fromTo("#{cid}-url", {{ autoAlpha:0, y:18, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.5)" }}, 1.05);'
        if en.get("note"):
            out += f'tl.fromTo("#{cid}-note", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.4 }}, 1.50);'
        return out

    scenes.append(Scene(f"s{n}-end", 0.0, END, _styled(end_html), end_js, lines=(len(subs),)))
    subs.append(Sub(0.0, END, en["url"], say=en["say"]))

    # Lay the scenes end to end for a silent preview; the read re-times them.
    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)

    return Video(
        slug=d["slug"],
        title=d.get("title", f"EVENT PROMO — {d['slug']}"),
        total=total,
        size=B.SIZES["9x16"],
        scenes=scenes,
        subs=subs,
        vo_lines=[B.for_tts(s.spoken) for s in subs],
        assets=assets,
        audio=[
            Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.20),
            Audio("public/bed.wav", "music", 0.0, total, volume=0.26, fade_in=0.4, fade_out=1.4),
        ],
        note=d.get("note", "Every figure is sourced in the post file. Generated clips are mood only: "
                           "no chip or title on a clip names the venue, its tanks or its artwork."),
    )
