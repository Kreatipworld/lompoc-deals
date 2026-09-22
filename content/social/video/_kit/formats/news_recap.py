"""LOMPOC LOCALS NEWS — the weekly recap edition.

The daily edition is 2–4 stories; the recap is the whole week: a headline
hook stack, football results for both schools, the stories that were
published on /news, one what's-on card, Friday's games, and the sign-off.
The house constants (FORMAT.md) are fixed here and never come from data:
the wordmark slam open, the date pill, the tagline, the topic chips, the
gold-rule wipe between segments, and the sign-off line with the /news pill.

Everything that changes week to week is data, passed as --data:

    date_pill     "SEPT 22 · 2026"
    week_label    "The week of Sept 15–21"
    hook          [three short headlines]              (visual only, silent)
    results       [{school, nick, badge, us, them, opponent, record,
                    venue, when, verdict, say, cap}]     one card per school
    stories       [{chip, headline, fact, photo, position, say, cap}]
    week          {photo, credit, rows: [{when, what, where}], say, cap}
    launch        {title, line, note, say, cap}
    friday        {label, date, rows: [{badge, line}], say, cap}
    credit        "Facts via …"                          sign-off credit line

`say` is what the voice reads, `cap` is the burned-in caption. They differ
because "41–7" belongs on screen and "forty-one to seven" in the read.
Photos are staged public/ filename -> local path or URL; only owned media.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

DEEP = "#3a0743"
FIELD = f"radial-gradient(ellipse 90% 70% at 50% 40%, #7d1590 0%, {B.PURPLE} 45%, {DEEP} 100%)"
CARD = f"linear-gradient(175deg, #23103080 0%, {B.BG} 62%)"

# Chips keep the FORMAT palette: gold for news, green for sports.
GREEN_CHIPS = ("SPORTS",)

# Rough scene lengths before the read re-times them (silent preview builds).
OPEN, HOOK, BEAT, END = 2.4, 2.0, 5.0, 5.0


def _chip_style(label: str) -> str:
    if label.split(" ")[0].split("·")[0].strip().upper() in GREEN_CHIPS:
        return f"background:{B.GREEN}; color:#fff;"
    return ""


def _wipe(cid: str) -> str:
    """The gold rule that sweeps across on every segment change."""
    return (f'<div id="{cid}-wipe" data-layout-allow-overflow style="position:absolute; top:0; bottom:0; left:-40px; '
            f'width:18px; background:{B.GOLD}; box-shadow:0 0 44px 14px rgba(239,198,24,0.55); '
            f'z-index:60; opacity:0"></div>')


def _wipe_js(cid: str, w: int) -> str:
    return (f'tl.fromTo("#{cid}-wipe", {{ autoAlpha:1, x:0 }}, {{ autoAlpha:1, x:{w + 80}, duration:0.48, ease:"power2.inOut" }}, 0);'
            f'tl.to("#{cid}-wipe", {{ autoAlpha:0, duration:0.10 }}, 0.50);')


def _exit(cid: str, dur: float, els) -> str:
    at = max(0.6, dur - B.X - 0.10)
    return "".join(S.out(cid, el, at, dur=0.20) for el in els)


def _photo(cid: str, src: str, size, position: str = "50% 50%") -> str:
    """One owned photo under a slow push. Landscape photos are shown whole on a
    tall frame over a blurred copy of themselves, rather than cropped to a strip."""
    g = B.geom(size)
    if g["h"] > g["w"] * 1.5:
        top = round(g["h"] * 0.20)
        return (f'<div id="{cid}-w0" class="pw" data-layout-allow-overflow>'
                f'<div class="pblur" style="background-image:url({src})"></div>'
                f'<img class="pwhole" src="{src}" alt="" style="top:{top}px" /></div>')
    return (f'<div id="{cid}-w0" class="pw" data-layout-allow-overflow>'
            f'<img class="cover" src="{src}" alt="" style="object-position:{position}; filter:contrast(1.06) saturate(1.08)" /></div>')


def _css(cid: str, size) -> str:
    g = B.geom(size)
    s = f'[data-composition-id="{cid}"]'
    return f"""
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .bloom {{ position:absolute; left:50%; top:42%; width:1100px; height:1100px; margin-left:-550px; margin-top:-550px; border-radius:50%; background:radial-gradient(circle, rgba(239,198,24,0.18), rgba(239,198,24,0) 60%); opacity:0; }}
      {s} .pw {{ position:absolute; inset:0; overflow:hidden; will-change:transform; transform-origin:50% 50%; }}
      {s} .pblur {{ position:absolute; inset:-6%; background-size:cover; background-position:50% 50%; filter:blur(34px) brightness(0.55) saturate(1.25); }}
      {s} .pwhole {{ display:block; position:absolute; left:0; width:{g["w"]}px; height:auto; box-shadow:0 30px 80px rgba(0,0,0,0.55); filter:contrast(1.06) saturate(1.08); }}
      {s} .topscrim {{ position:absolute; inset:0; z-index:31; pointer-events:none; background:linear-gradient(to bottom, rgba(20,10,23,0.72) 0%, rgba(20,10,23,0.25) 22%, rgba(20,10,23,0) 38%); }}
      {s} .tchip {{ position:absolute; left:{g["side"]}px; top:{g["mark_top"]}px; z-index:36; font-size:28px; letter-spacing:3px; padding:12px 24px; white-space:nowrap; opacity:0; box-shadow:0 10px 26px rgba(10,6,12,0.45); }}
      {s} .brand {{ position:absolute; left:{g["side"]}px; top:{g["mark_top"] + 78}px; z-index:36; color:rgba(255,255,255,0.86); font-weight:800; font-size:22px; letter-spacing:4px; text-transform:uppercase; opacity:0; text-shadow:0 2px 10px rgba(10,6,12,0.6); }}
      {s} .panel {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36; background:rgba(20,10,23,0.80); border-radius:26px; padding:30px 36px 32px; box-shadow:0 24px 60px rgba(10,6,12,0.5); opacity:0; }}
      {s} .rule {{ display:block; width:110px; height:6px; background:{B.GOLD}; border-radius:3px; margin-bottom:18px; transform-origin:0% 50%; }}
      {s} .hl {{ display:block; color:#fff; font-weight:800; font-size:{56 if g["h"] > 1400 else 50}px; line-height:1.06; letter-spacing:-1px; opacity:0; }}
      {s} .fact {{ display:block; margin-top:14px; color:{B.GOLD}; font-weight:700; font-size:29px; line-height:1.3; letter-spacing:0.3px; opacity:0; }}
      {s} .credit {{ display:block; margin-top:16px; color:rgba(255,255,255,0.62); font-weight:600; font-size:21px; letter-spacing:1.2px; text-transform:uppercase; }}
      {s} .row {{ display:flex; align-items:center; gap:22px; margin-top:16px; }}
      {s} .when {{ flex:none; width:172px; color:{B.GOLD}; font-weight:800; font-size:27px; letter-spacing:0.5px; }}
      {s} .what {{ color:#fff; font-weight:700; font-size:31px; line-height:1.18; letter-spacing:-0.3px; }}
      {s} .where {{ display:block; color:rgba(255,255,255,0.68); font-weight:600; font-size:23px; margin-top:2px; }}
    """


def build(d: dict) -> Video:
    for k in ("date_pill", "hook", "results", "stories", "week", "launch", "friday"):
        if not d.get(k):
            raise ValueError(f"news_recap needs {k!r}")
    assets = dict(d.get("assets") or {})
    site = "lompoclocals.com/news"
    credit = d.get("credit", "")

    scenes, subs = [], []

    def styled(html):
        """The recap's own class library goes in with every scene's markup."""
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, text, say):
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, text, say=say))

    # ── cold open: everything painted at t=0, because frame 0 is the thumbnail ──
    def open_html(cid, dur, size):
        g = B.geom(size)
        top = "29%" if g["h"] > 1400 else "22%"
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div id="{cid}-col" style="position:absolute; left:60px; right:60px; top:{top}; z-index:20; text-align:center">
        <span style="display:block; color:#fff; font-weight:800; font-size:96px; line-height:0.98; letter-spacing:-3px; text-transform:uppercase; text-shadow:0 10px 40px rgba(10,6,12,0.45)">Lompoc Locals</span>
        <span style="display:block; color:{B.GOLD}; font-weight:800; font-size:150px; line-height:0.98; letter-spacing:-2px; text-transform:uppercase; text-shadow:0 10px 40px rgba(10,6,12,0.45)">News</span>
        <span style="display:inline-block; margin-top:36px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:28px; letter-spacing:4px; padding:12px 26px; border-radius:999px; text-transform:uppercase">{d["date_pill"]}</span>
        <span style="display:block; margin-top:26px; color:rgba(255,255,255,0.92); font-weight:600; font-size:40px">Your source for Lompoc news.</span>
        <span id="{cid}-wk" style="display:block; margin-top:18px; color:{B.GOLD}; font-weight:700; font-size:30px; letter-spacing:2px; text-transform:uppercase">{d.get("week_label", "Weekly recap")}</span>
      </div>'''

    def open_js(cid, dur, size=None):
        return (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
                f'tl.fromTo("#{cid}-col", {{ scale:1.06 }}, {{ scale:1, duration:1.1, ease:"power3.out" }}, 0);'
                + _exit(cid, dur, ("col",)))

    add("s0-open", OPEN, open_html, open_js, "What's new in Lompoc.", "What's new in Lompoc.")

    # ── headline hook stack: three headlines, 0.5 s apart, no voice ──────────
    def hook_html(cid, dur, size):
        g = B.geom(size)
        top = "24%" if g["h"] > 1400 else "16%"
        rows = "".join(
            f'<div id="{cid}-h{i}" style="margin-top:{0 if i == 0 else 30}px; padding:26px 34px; border-radius:22px; background:rgba(20,10,23,0.55); border-left:10px solid {B.GOLD}; opacity:0">'
            f'<span style="display:block; color:#fff; font-weight:800; font-size:58px; line-height:1.04; letter-spacing:-1.5px">{h}</span></div>'
            for i, h in enumerate(d["hook"][:3])
        )
        return f'''<div class="field"></div>
      {_wipe(cid)}
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{top}; z-index:20">
        <span id="{cid}-lab" style="display:block; color:{B.GOLD}; font-weight:800; font-size:30px; letter-spacing:5px; text-transform:uppercase; margin-bottom:28px; opacity:0">This week in Lompoc</span>
        {rows}
      </div>'''

    def hook_js(cid, dur, size=None):
        w = (size or B.SIZES["9x16"])[0]
        js = _wipe_js(cid, w) + S.rise(cid, "lab", 0.10, dy=10, dur=0.30)
        for i in range(min(3, len(d["hook"]))):
            js += S.rise(cid, f"h{i}", 0.25 + 0.5 * i, dy=26, dur=0.38)
        return js + _exit(cid, dur, ("lab", "h0", "h1", "h2"))

    add("s1-hook", HOOK, hook_html, hook_js, "This week in Lompoc", "")

    # ── football results: one card per school, equal weight ──────────────────
    def result_html(r):
        def html(cid, dur, size):
            g = B.geom(size)
            top = "17%" if g["h"] > 1400 else "13%"
            return f'''<div style="position:absolute; inset:0; background:{CARD}"></div>
      {_wipe(cid)}
      <span class="chip tchip" id="{cid}-chip" style="{_chip_style("SPORTS")}">Sports · {r.get("verdict", "Final")}</span>
      <div style="position:absolute; left:0; right:0; top:{top}; z-index:36; text-align:center">
        <img id="{cid}-badge" src="public/{r["badge"]}" alt="" style="width:200px; height:auto; opacity:0" />
        <div style="display:flex; align-items:center; justify-content:center; gap:40px; margin-top:34px">
          <span id="{cid}-us" style="color:{B.GOLD}; font-weight:800; font-size:176px; line-height:1; letter-spacing:-8px; opacity:0">{r["us"]}</span>
          <span id="{cid}-dash" style="color:rgba(255,255,255,0.45); font-weight:800; font-size:84px; opacity:0">–</span>
          <span id="{cid}-them" style="color:#fff; font-weight:800; font-size:176px; line-height:1; letter-spacing:-8px; opacity:0">{r["them"]}</span>
        </div>
        <span id="{cid}-opp" style="display:block; margin-top:30px; color:rgba(255,255,255,0.9); font-weight:700; font-size:48px; letter-spacing:-1px; opacity:0">{r["school"]} {r["nick"]} · {r["opponent"]}</span>
        <span id="{cid}-ven" style="display:block; margin-top:14px; color:rgba(255,255,255,0.66); font-weight:600; font-size:31px; opacity:0">{r["venue"]} · {r["when"]}</span>
        <span id="{cid}-rec" style="display:inline-block; margin-top:28px; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:42px; padding:10px 26px; border-radius:12px; opacity:0">{r["record"]}</span>
      </div>'''

        def js(cid, dur, size=None):
            w = (size or B.SIZES["9x16"])[0]
            return (_wipe_js(cid, w)
                    + S.rise(cid, "chip", 0.12, dy=12, dur=0.34)
                    + S.rise(cid, "badge", 0.16, dur=0.38)
                    + S.pop(cid, "us", 0.50, scale=1.3, dur=0.42)
                    + f'tl.fromTo("#{cid}-dash", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.25 }}, 0.78);'
                    + S.pop(cid, "them", 0.95, scale=1.3, dur=0.42)
                    + S.rise(cid, "opp", 1.40, dy=14, dur=0.36)
                    + S.rise(cid, "ven", 1.60, dy=10, dur=0.34)
                    + S.rise(cid, "rec", 1.85, dy=12, dur=0.34)
                    + _exit(cid, dur, ("chip", "badge", "us", "dash", "them", "opp", "ven", "rec")))
        return html, js

    for i, r in enumerate(d["results"]):
        h, j = result_html(r)
        add(f"s{2 + i}-{r['school'].lower()}", BEAT, h, j, r["cap"], r["say"])

    # ── the stories: one owned photo, a chip, a headline panel, one fact line ─
    def story_html(st):
        def html(cid, dur, size):
            src = f"public/{st['photo']}"
            return f'''{_photo(cid, src, size, st.get("position", "50% 50%"))}
      <div class="scrim"></div><div class="topscrim"></div>
      {_wipe(cid)}
      <span class="chip tchip" id="{cid}-chip" style="{_chip_style(st["chip"])}">{st["chip"]}</span>
      <span class="brand" id="{cid}-brand">Lompoc Locals News</span>
      <div class="panel" id="{cid}-panel">
        <span class="rule" id="{cid}-rule"></span>
        <span class="hl" id="{cid}-hl">{st["headline"]}</span>
        <span class="fact" id="{cid}-fact">{st["fact"]}</span>
        {f'<span class="credit">{st["credit"]}</span>' if st.get("credit") else ""}
      </div>'''

        def js(cid, dur, size=None):
            w = (size or B.SIZES["9x16"])[0]
            z = st.get("zoom", [1.0, 1.08])
            return (f'tl.fromTo("#{cid}-w0", {{ scale:{z[0]} }}, {{ scale:{z[1]}, duration:{dur:.2f}, ease:"none" }}, 0);'
                    + _wipe_js(cid, w)
                    + f'tl.fromTo("#{cid}-chip", {{ autoAlpha:0, y:16, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.4, ease:"back.out(1.6)" }}, 0.15);'
                    + f'tl.fromTo("#{cid}-brand", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.4 }}, 0.30);'
                    + f'tl.fromTo("#{cid}-panel", {{ autoAlpha:0, y:26 }}, {{ autoAlpha:1, y:0, duration:0.45, ease:"expo.out" }}, 0.30);'
                    + f'tl.fromTo("#{cid}-rule", {{ scaleX:0 }}, {{ scaleX:1, duration:0.4 }}, 0.35);'
                    + f'tl.fromTo("#{cid}-hl", {{ autoAlpha:0, y:16 }}, {{ autoAlpha:1, y:0, duration:0.45, ease:"expo.out" }}, 0.38);'
                    + f'tl.fromTo("#{cid}-fact", {{ autoAlpha:0, y:10 }}, {{ autoAlpha:1, y:0, duration:0.4 }}, 1.10);'
                    + _exit(cid, dur, ("chip", "brand", "panel")))
        return html, js

    for i, st in enumerate(d["stories"]):
        h, j = story_html(st)
        add(f"s{2 + len(d['results']) + i}-{st['slug']}", BEAT, h, j, st["cap"], st["say"])

    n = 2 + len(d["results"]) + len(d["stories"])

    # ── what's on: one card, a member photo credited on-frame ────────────────
    wk = d["week"]

    def week_html(cid, dur, size):
        rows = "".join(
            f'<div class="row" id="{cid}-r{i}" style="opacity:0"><span class="when">{r["when"]}</span>'
            f'<div><span class="what">{r["what"]}</span><span class="where">{r["where"]}</span></div></div>'
            for i, r in enumerate(wk["rows"])
        )
        return f'''{_photo(cid, f"public/{wk['photo']}", size, wk.get("position", "50% 50%"))}
      <div class="scrim" style="background:linear-gradient(to top, rgba(20,10,23,0.97) 0%, rgba(20,10,23,0.9) 45%, rgba(20,10,23,0.35) 100%)"></div><div class="topscrim"></div>
      {_wipe(cid)}
      <span class="chip tchip" id="{cid}-chip">Events</span>
      <span class="brand" id="{cid}-brand">Lompoc Locals News</span>
      <div class="panel" id="{cid}-panel" style="padding-top:26px">
        <span class="rule"></span>
        <span class="hl" style="opacity:1; font-size:52px">{wk.get("title", "This week")}</span>
        {rows}
        {f'<span class="credit">{wk["credit"]}</span>' if wk.get("credit") else ""}
      </div>'''

    def week_js(cid, dur, size=None):
        w = (size or B.SIZES["9x16"])[0]
        js = (f'tl.fromTo("#{cid}-w0", {{ scale:1.06 }}, {{ scale:1.0, duration:{dur:.2f}, ease:"none" }}, 0);'
              + _wipe_js(cid, w)
              + S.rise(cid, "chip", 0.15, dy=12, dur=0.34)
              + f'tl.fromTo("#{cid}-brand", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.4 }}, 0.30);'
              + f'tl.fromTo("#{cid}-panel", {{ autoAlpha:0, y:26 }}, {{ autoAlpha:1, y:0, duration:0.45, ease:"expo.out" }}, 0.30);')
        for i in range(len(wk["rows"])):
            js += S.rise(cid, f"r{i}", 0.55 + 0.32 * i, dy=14, dur=0.34)
        return js + _exit(cid, dur, ("chip", "brand", "panel"))

    add(f"s{n}-week", BEAT, week_html, week_js, wk["cap"], wk["say"])

    # ── launch line: a card, never a fixed time ──────────────────────────────
    la = d["launch"]

    def launch_html(cid, dur, size):
        g = B.geom(size)
        top = "30%" if g["h"] > 1400 else "22%"
        return f'''<div style="position:absolute; inset:0; background:radial-gradient(ellipse 90% 60% at 50% 20%, #1b2a5a 0%, #0d1230 40%, {B.BG} 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:18%; height:2px; z-index:20; background:linear-gradient(90deg, transparent, {B.GOLD}, transparent); opacity:0.45"></div>
      {_wipe(cid)}
      <span class="chip tchip" id="{cid}-chip">Vandenberg</span>
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{top}; z-index:36">
        <span id="{cid}-t" class="hero" style="font-size:104px; opacity:0">{la["title"]}</span>
        <span id="{cid}-l" style="display:block; margin-top:30px; color:{B.GOLD}; font-weight:800; font-size:50px; letter-spacing:-1px; line-height:1.1; opacity:0">{la["line"]}</span>
        <span id="{cid}-n" style="display:block; margin-top:26px; color:rgba(255,255,255,0.78); font-weight:600; font-size:31px; line-height:1.3; opacity:0">{la["note"]}</span>
      </div>'''

    def launch_js(cid, dur, size=None):
        w = (size or B.SIZES["9x16"])[0]
        return (_wipe_js(cid, w) + S.rise(cid, "chip", 0.12, dy=12, dur=0.34)
                + S.rise(cid, "t", 0.28, dy=22, dur=0.46) + S.rise(cid, "l", 0.62, dy=14, dur=0.38)
                + S.rise(cid, "n", 1.30, dy=10, dur=0.36) + _exit(cid, dur, ("chip", "t", "l", "n")))

    add(f"s{n + 1}-launch", BEAT, launch_html, launch_js, la["cap"], la["say"])

    # ── Friday: both games away, so no stadium photo (an away fixture never gets Huyck) ─
    fr = d["friday"]

    def friday_html(cid, dur, size):
        g = B.geom(size)
        top = "22%" if g["h"] > 1400 else "16%"
        cards = "".join(
            f'<div id="{cid}-c{i}" style="margin-top:30px; padding:28px 32px; border-radius:22px; background:rgba(255,255,255,0.07); display:flex; align-items:center; gap:26px; opacity:0">'
            f'<img src="public/{r["badge"]}" alt="" style="width:92px; height:auto; flex:none" />'
            f'<div><span style="display:block; color:#fff; font-weight:800; font-size:44px; letter-spacing:-1px">{r["line"]}</span>'
            f'<span style="display:block; margin-top:6px; color:rgba(255,255,255,0.7); font-weight:600; font-size:30px">{r["sub"]}</span></div></div>'
            for i, r in enumerate(fr["rows"])
        )
        return f'''<div style="position:absolute; inset:0; background:linear-gradient(170deg, #241236 0%, {B.BG} 70%)"></div>
      {_wipe(cid)}
      <span class="chip tchip" id="{cid}-chip" style="{_chip_style("SPORTS")}">Sports · {fr["date"]}</span>
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{top}; z-index:36">
        <span id="{cid}-t" style="display:block; color:{B.GOLD}; font-weight:800; font-size:62px; letter-spacing:-2px; opacity:0">{fr["label"]}</span>
        {cards}
      </div>'''

    def friday_js(cid, dur, size=None):
        w = (size or B.SIZES["9x16"])[0]
        js = _wipe_js(cid, w) + S.rise(cid, "chip", 0.12, dy=12, dur=0.34) + S.rise(cid, "t", 0.25, dy=14, dur=0.38)
        for i in range(len(fr["rows"])):
            js += S.rise(cid, f"c{i}", 0.60 + 0.35 * i, dy=22, dur=0.42)
        return js + _exit(cid, dur, ("chip", "t") + tuple(f"c{i}" for i in range(len(fr["rows"]))))

    add(f"s{n + 2}-friday", BEAT, friday_html, friday_js, fr["cap"], fr["say"])

    # ── sign-off ─────────────────────────────────────────────────────────────
    def end_html(cid, dur, size):
        g = B.geom(size)
        top = "26%" if g["h"] > 1400 else "18%"
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      {_wipe(cid)}
      <div style="position:absolute; left:60px; right:60px; top:{top}; z-index:20; text-align:center">
        <span id="{cid}-swm" style="display:block; color:rgba(255,255,255,0.92); font-weight:800; font-size:34px; letter-spacing:6px; text-transform:uppercase; opacity:0">Lompoc Locals <b style="color:{B.GOLD}">News</b></span>
        <span id="{cid}-srule" style="display:block; width:110px; height:6px; margin:22px auto 0; background:{B.GOLD}; border-radius:3px; opacity:0"></span>
        <span id="{cid}-l1" style="display:block; margin-top:40px; color:#fff; font-weight:800; font-size:86px; line-height:1.04; letter-spacing:-2px; opacity:0; text-shadow:0 10px 40px rgba(10,6,12,0.45)">Informed Lompoc,<br />better Lompoc.</span>
        <span class="pill" id="{cid}-url" style="margin-top:44px; opacity:0; box-shadow:0 16px 40px rgba(10,6,12,0.4)">{site}</span>
        <span id="{cid}-daily" style="display:block; margin-top:30px; color:rgba(255,255,255,0.72); font-weight:600; font-size:30px; letter-spacing:1px; opacity:0">The full stories, every day.</span>
        {f'<span id="{cid}-credit" style="display:block; margin-top:46px; color:rgba(255,255,255,0.74); font-weight:600; font-size:22px; letter-spacing:1.5px; text-transform:uppercase; opacity:0">{credit}</span>' if credit else ""}
      </div>'''

    def end_js(cid, dur, size=None):
        w = (size or B.SIZES["9x16"])[0]
        js = (_wipe_js(cid, w)
              + f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.20);'
              + S.rise(cid, "swm", 0.30, dy=12, dur=0.40)
              + f'tl.fromTo("#{cid}-srule", {{ autoAlpha:0, scaleX:0 }}, {{ autoAlpha:1, scaleX:1, duration:0.4 }}, 0.42);'
              + f'tl.fromTo("#{cid}-l1", {{ autoAlpha:0, y:22, scale:1.04 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.55, ease:"expo.out" }}, 0.60);'
              + f'tl.fromTo("#{cid}-url", {{ autoAlpha:0, y:18, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.5)" }}, 1.00);'
              + S.rise(cid, "daily", 1.60, dy=12, dur=0.40))
        if credit:
            js += f'tl.fromTo("#{cid}-credit", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.4 }}, 2.00);'
        return js

    # The sign-off has two spoken lines on one scene.
    scenes.append(Scene(f"s{n + 3}-end", 0.0, END, styled(end_html), end_js, lines=(len(subs), len(subs) + 1)))
    subs.append(Sub(0.0, END, f"The full stories are on {site}",
                    say=f"The full stories are on {B.spoken_url(site.split('/')[0])}."))
    subs.append(Sub(0.0, END, "Informed Lompoc, better Lompoc.", say="Informed Lompoc, better Lompoc."))

    # Lay the scenes end to end for a silent preview; the read re-times them.
    at = 0.0
    for i, sc in enumerate(scenes):
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)

    # Every spoken line goes to TTS except the silent hook, which is a marker.
    vo = [B.for_tts(s.say) if s.say else "[silence 1.9 s — headline stack, no voice]" for s in subs]

    return Video(
        slug="news-recap",
        title=f"LOMPOC LOCALS NEWS — weekly recap, {d['date_pill']}",
        total=total,
        size=B.SIZES["9x16"],
        scenes=scenes,
        subs=subs,
        vo_lines=vo,
        assets=assets,
        audio=[
            Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.20),
            Audio("public/bed.wav", "music", 0.0, total, volume=0.26, fade_in=0.4, fade_out=1.4),
        ],
        note="Every number is copied from a published /news story or /football. No opinion words. "
             "Owned photos only, none used in the last 14 days. Arthur reads every line; the hook stack is silent.",
    )
