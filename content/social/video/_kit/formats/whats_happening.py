"""WHAT'S HAPPENING — the week in Lompoc as a local news show.

Built Nov 3 2026 after the owner called the week planner "too plain" and asked
for "more news and events, other format". Every beat is a full-bleed photo with
a slow push-in, a LIVE-style bug up top, a colored chip, a big headline that
lands word by word, and one ticker that runs under the whole video (each scene
offsets it by its start time, so it reads as one continuous crawl).

    python3 _kit/make.py whats-happening --data "$(cat out/<project>/show.json)" --out out/<project> --vo out/<project>/public

Data contract:

    slug, title, date_pill ("NOV 5 – 9")
    assets   staged public/ filename -> URL/local path
    ticker   ["THU · Art Walk 5–8 PM", ...]
    cover    {kick, title, grid:[photo keys, 6], say}
    beats    [{chip, color?("gold"|"green"|"orange"|"blue"), head, sub, photo, pos?, icon?,
               day?, num?, time?, say}]
             day/num/time render a date block (events); without them it is a news beat.
             icon (no photo) renders a designed brand card instead of a picture.
             stat {hd?, big?, bigl?, rows:[[name, pct, color]], mark?:[pct, label]} adds an election-style
             results panel above the chip (bars grow in; mark draws a threshold line on the first bar).
    end      {title, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src
from .week_planner import ICONS

CHIPS = {"gold": (B.GOLD, B.INK), "green": (B.GREEN, "#fff"), "orange": ("#ff7a1a", "#fff"), "blue": ("#2f6bff", "#fff"),
         "red": ("#e0263a", "#fff")}
TICK_SPEED = 120  # px per second, continuous across scenes


def _css(cid: str) -> str:
    s = f'[data-composition-id="{cid}"]'
    return f"""
      {s} .mark {{ display:none; }}
      {s} .bgph {{ position:absolute; inset:0; overflow:hidden; background:{B.BG}; }}
      {s} .bgph img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .shade {{ position:absolute; inset:0; background:
          linear-gradient(180deg, rgba(20,10,23,0.78) 0%, rgba(20,10,23,0.0) 24%, rgba(20,10,23,0.0) 34%,
                          rgba(20,10,23,0.88) 56%, rgba(20,10,23,0.9) 72%, rgba(20,10,23,0.55) 100%); }}
      {s} .brandcard {{ position:absolute; inset:0; background:radial-gradient(ellipse 100% 70% at 50% 30%, #7d1590 0%, {B.PURPLE} 45%, #2a0631 100%); }}
      {s} .brandcard .big-icon {{ position:absolute; left:50%; top:330px; width:520px; height:520px; margin-left:-260px; border-radius:50%;
          background:{B.GOLD}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 120px 30px rgba(239,198,24,0.35); }}
      {s} .brandcard .big-icon svg {{ width:300px; height:300px; }}
      {s} .stat {{ position:absolute; left:60px; right:60px; top:250px; padding:34px 44px 38px; border-radius:28px; z-index:12;
          background:rgba(20,10,23,0.84); border:3px solid rgba(239,198,24,0.55); }}
      {s} .stat .hd {{ color:{B.GOLD}; font-weight:800; font-size:28px; letter-spacing:5px; margin-bottom:18px; }}
      {s} .stat .row {{ position:relative; margin-top:22px; }}
      {s} .stat .nm {{ color:#fff; font-weight:800; font-size:46px; }}
      {s} .stat .pc {{ position:absolute; right:0; top:-10px; color:{B.GOLD}; font-weight:800; font-size:64px; }}
      {s} .stat .tr {{ position:relative; height:30px; margin-top:12px; border-radius:15px; background:rgba(255,255,255,0.14); }}
      {s} .stat .fl {{ position:absolute; left:0; top:0; bottom:0; border-radius:15px; transform-origin:0 50%; }}
      {s} .stat .mk {{ position:absolute; top:-12px; bottom:-12px; width:6px; margin-left:-3px; background:#fff; border-radius:3px; }}
      {s} .stat .mkl {{ position:absolute; top:44px; transform:translateX(-50%); color:#fff; font-weight:800; font-size:26px; white-space:nowrap; }}
      {s} .stat .big {{ color:#fff; font-weight:800; font-size:150px; line-height:1; text-align:center; }}
      {s} .stat .big b {{ color:{B.GOLD}; }}
      {s} .stat .bigl {{ color:{B.GOLD}; font-weight:800; font-size:40px; letter-spacing:6px; text-align:center; margin-top:6px; }}
      {s} .bug {{ position:absolute; left:60px; top:96px; display:flex; align-items:center; gap:18px; z-index:20; }}
      {s} .bug .live {{ background:#e0263a; color:#fff; font-weight:800; font-size:28px; letter-spacing:4px; padding:10px 18px 10px 44px;
          border-radius:10px; position:relative; }}
      {s} .bug .live:before {{ content:""; position:absolute; left:18px; top:50%; width:14px; height:14px; margin-top:-7px; border-radius:50%; background:#fff; }}
      {s} .bug .name {{ color:#fff; font-weight:800; font-size:30px; letter-spacing:5px; text-transform:uppercase; text-shadow:0 2px 12px rgba(0,0,0,0.6); }}
      {s} .bug .date {{ color:{B.INK}; background:{B.GOLD}; font-weight:800; font-size:28px; letter-spacing:3px; padding:10px 18px; border-radius:10px; }}
      {s} .chip {{ position:absolute; left:84px; display:inline-block; font-weight:800; font-size:34px; letter-spacing:6px; text-transform:uppercase;
          padding:12px 24px; border-radius:12px; z-index:10; }}
      {s} .head {{ position:absolute; left:84px; right:84px; color:#fff; font-weight:800; font-size:112px; line-height:0.95; letter-spacing:-4px;
          text-shadow:0 6px 30px rgba(0,0,0,0.5); z-index:10; }}
      {s} .head span {{ display:inline-block; }}
      {s} .sub {{ position:absolute; left:84px; right:84px; color:{B.GOLD}; font-weight:800; font-size:44px; line-height:1.15; z-index:10; }}
      {s} .when {{ position:absolute; right:60px; width:230px; border-radius:30px; overflow:hidden; text-align:center; z-index:12;
          box-shadow:0 24px 60px rgba(0,0,0,0.55); }}
      {s} .when .d {{ background:#e0263a; color:#fff; font-weight:800; font-size:36px; letter-spacing:6px; padding:14px 0; }}
      {s} .when .n {{ background:#fff; color:{B.INK}; font-weight:800; font-size:120px; line-height:1; padding:14px 0 4px; letter-spacing:-4px; }}
      {s} .when .t {{ background:#fff; color:{B.PURPLE}; font-weight:800; font-size:34px; padding:0 0 18px; }}
      {s} .rule {{ position:absolute; left:84px; width:160px; height:10px; background:{B.GOLD}; border-radius:5px; z-index:10; }}
      {s} .tick {{ position:absolute; left:0; right:0; top:1360px; height:84px; background:{B.GOLD}; overflow:hidden; z-index:30; }}
      {s} .tick .lab {{ position:absolute; left:0; top:0; bottom:0; width:220px; background:#e0263a; color:#fff; font-weight:800; font-size:30px;
          letter-spacing:4px; display:flex; align-items:center; justify-content:center; z-index:2; }}
      {s} .tick .row {{ position:absolute; left:240px; top:0; bottom:0; white-space:nowrap; display:flex; align-items:center;
          font-weight:800; font-size:34px; color:{B.INK}; }}
      {s} .tick .row b {{ margin:0 26px; color:{B.INK}; }}
      {s} .wipe {{ position:absolute; top:0; bottom:0; left:-40px; width:22px; background:{B.GOLD};
          box-shadow:0 0 50px 16px rgba(239,198,24,0.6); z-index:60; opacity:0; }}
      {s} .grid {{ position:absolute; left:40px; right:40px; top:230px; height:700px; display:grid; grid-template-columns:repeat(3, 1fr);
          grid-template-rows:repeat(2, 1fr); gap:16px; }}
      {s} .grid div {{ border-radius:24px; overflow:hidden; border:5px solid rgba(255,255,255,0.9); box-shadow:0 18px 40px rgba(0,0,0,0.5); }}
      {s} .grid img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .ctitle {{ position:absolute; left:84px; right:84px; top:975px; color:#fff; font-weight:800; font-size:136px; line-height:0.9; letter-spacing:-6px; }}
      {s} .ctitle em {{ font-style:normal; color:{B.GOLD}; }}
      {s} .pill {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800; font-size:46px; padding:18px 36px; border-radius:999px; }}
    """


def build(d: dict) -> Video:
    assets = dict(d.get("assets") or {})
    scenes, subs = [], []
    ticker = d.get("ticker") or []

    def src(key):
        return _media_src(assets, key)[0]

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid)}</style>\n      " + html(cid, dur, size)

    def bug(cid):
        return (f'<div class="bug" id="{cid}-bug"><div class="live">LIVE</div><div class="name">What\'s happening</div>'
                f'<div class="date">{d.get("date_pill", "")}</div></div>')

    def tick(cid):
        row = "".join(f"<span>{t}</span><b>•</b>" for t in ticker) * 4
        return f'<div class="tick" data-layout-allow-overlap><div class="lab">LOMPOC</div><div class="row" id="{cid}-row">{row}</div></div>'

    def tick_js(cid, dur, idx):
        # continuous crawl: each scene starts where the last one left off
        def js():
            st = scenes[idx].start
            x0 = -TICK_SPEED * st
            return f'tl.fromTo("#{cid}-row", {{ x:{x0:.0f} }}, {{ x:{x0 - TICK_SPEED * dur:.0f}, duration:{dur:.2f}, ease:"none" }}, 0);'
        return js

    def wipe(cid):
        return f'<div class="wipe" id="{cid}-wipe" data-layout-allow-overflow></div>'

    def wipe_js(cid):
        return (f'tl.fromTo("#{cid}-wipe", {{ autoAlpha:1, x:0 }}, {{ autoAlpha:1, x:1160, duration:0.5, ease:"power2.inOut" }}, 0);'
                f'tl.to("#{cid}-wipe", {{ autoAlpha:0, duration:0.1 }}, 0.52);')

    def add(cid, dur, html, js, say):
        idx = len(scenes)
        sc = Scene(cid, 0.0, dur, styled(html), lambda c, du, size=None, js=js: js(c, du, size) + tick_js(c, du, idx)(),
                   lines=(len(subs),))
        scenes.append(sc)
        subs.append(Sub(0.0, dur, say, say=say))

    # cover — frame 0 composed: photo grid + title + ticker
    c = d["cover"]
    def cover_html(cid, dur, size):
        cells = "".join(f'<div id="{cid}-g{k}"><img src="{src(p)}" /></div>' for k, p in enumerate(c["grid"][:6]))
        return (f'<div class="brandcard"></div>' + bug(cid) + f'<div class="grid">{cells}</div>'
                + f'<div class="ctitle" id="{cid}-t">{c["title"]}</div>' + tick(cid))
    def cover_js(cid, dur, size=None):
        out = ""
        for k in range(min(6, len(c["grid"]))):
            out += f'tl.fromTo("#{cid}-g{k} img", {{ scale:1.0 }}, {{ scale:1.14, duration:{dur:.2f}, ease:"none" }}, 0);'
            out += f'tl.to("#{cid}-g{k}", {{ y:{(-1) ** k * 10}, duration:{dur:.2f}, ease:"sine.inOut" }}, 0);'
        return out + f'tl.to("#{cid}-t", {{ scale:1.04, transformOrigin:"0% 50%", duration:{dur:.2f}, ease:"none" }}, 0);'
    add("s0-cover", 3.0, cover_html, cover_js, c.get("say", ""))

    for i, bt in enumerate(d["beats"]):
        def beat_html(cid, dur, size, bt=bt):
            bg, fg = CHIPS.get(bt.get("color", "gold"), CHIPS["gold"])
            words = "".join(f'<span id="{cid}-w{k}">{w}</span> ' for k, w in enumerate(bt["head"].split(" ")))
            if bt.get("icon"):
                back = f'<div class="brandcard"><div class="big-icon" id="{cid}-ic">{ICONS[bt["icon"]]}</div></div>'
            elif not bt.get("photo"):
                back = '<div class="brandcard"></div>'
            else:
                back = (f'<div class="bgph"><img id="{cid}-ph" src="{src(bt["photo"])}" '
                        f'style="object-position:{bt.get("pos", "50% 50%")}" /></div><div class="shade"></div>')
            when = ""
            if bt.get("day"):
                when = (f'<div class="when" id="{cid}-wh" style="top:240px"><div class="d">{bt["day"]}</div>'
                        f'<div class="n">{bt["num"]}</div><div class="t">{bt.get("time", "")}</div></div>')
            st = ""
            if bt.get("stat"):
                sd = bt["stat"]
                st = f'<div class="stat" id="{cid}-st"><div class="hd">{sd.get("hd", "EARLY RESULTS")}</div>'
                if sd.get("big"):
                    st += f'<div class="big" id="{cid}-bg">{sd["big"]}</div><div class="bigl">{sd.get("bigl", "")}</div>'
                for k, (nm, pc, col) in enumerate(sd.get("rows", [])):
                    mk = ""
                    if sd.get("mark") and k == 0:
                        mk = (f'<div class="mk" style="left:{sd["mark"][0]}%"></div>'
                              f'<div class="mkl" style="left:{sd["mark"][0]}%">{sd["mark"][1]}</div>')
                    st += (f'<div class="row"><div class="nm">{nm}</div><div class="pc">{pc:.1f}%</div>'
                           f'<div class="tr"><div class="fl" id="{cid}-f{k}" style="width:{pc}%; background:{col}"></div>{mk}</div></div>')
                st += '</div>'
            return (back + bug(cid) + when + st
                    + f'<div class="chip" id="{cid}-c" style="top:820px; background:{bg}; color:{fg}">{bt["chip"]}</div>'
                    + f'<div class="head" id="{cid}-h" style="top:900px">{words}</div>'
                    + f'<div class="sub" id="{cid}-s" style="top:{900 + 107 * bt.get("lines", 2) + 24}px">{bt["sub"]}</div>'
                    + tick(cid) + wipe(cid))
        def beat_js(cid, dur, size=None, bt=bt):
            out = wipe_js(cid)
            if bt.get("icon"):
                out += (f'tl.fromTo("#{cid}-ic", {{ scale:0.6, rotation:-12 }}, {{ scale:1, rotation:0, duration:0.7, ease:"back.out(1.8)" }}, 0.15);'
                        f'tl.to("#{cid}-ic", {{ y:-24, duration:{dur:.2f}, ease:"sine.inOut" }}, 0.8);')
            elif bt.get("photo"):
                out += f'tl.fromTo("#{cid}-ph", {{ scale:1.0, x:0 }}, {{ scale:1.16, x:{-40 if i % 2 else 40}, duration:{dur:.2f}, ease:"none" }}, 0);'
            out += f'tl.fromTo("#{cid}-c", {{ autoAlpha:0, x:-120 }}, {{ autoAlpha:1, x:0, duration:0.45, ease:"expo.out" }}, 0.25);'
            for k in range(len(bt["head"].split(" "))):
                out += (f'tl.fromTo("#{cid}-w{k}", {{ autoAlpha:0, y:70 }}, '
                        f'{{ autoAlpha:1, y:0, duration:0.42, ease:"back.out(1.6)" }}, {0.4 + 0.09 * k:.2f});')
            out += S.rise(cid, "s", 0.9, dy=30, dur=0.45)
            if bt.get("stat"):
                out += f'tl.fromTo("#{cid}-st", {{ autoAlpha:0, y:-40 }}, {{ autoAlpha:1, y:0, duration:0.5, ease:"expo.out" }}, 0.1);'
                if bt["stat"].get("big"):
                    out += (f'tl.fromTo("#{cid}-bg", {{ scale:0.4, autoAlpha:0 }}, '
                            f'{{ scale:1, autoAlpha:1, duration:0.7, ease:"back.out(2.2)" }}, 0.35);')
                for k in range(len(bt["stat"].get("rows", []))):
                    out += (f'tl.fromTo("#{cid}-f{k}", {{ scaleX:0 }}, '
                            f'{{ scaleX:1, duration:1.3, ease:"power3.out" }}, {0.5 + 0.25 * k:.2f});')
            if bt.get("day"):
                out += (f'tl.fromTo("#{cid}-wh", {{ autoAlpha:0, scale:0.5, rotation:8 }}, '
                        f'{{ autoAlpha:1, scale:1, rotation:-3, duration:0.6, ease:"back.out(2)" }}, 0.3);')
            return out
        add(f"s{i + 1}-beat", 4.0, beat_html, beat_js, bt["say"])

    e = d["end"]
    def end_html(cid, dur, size):
        return ('<div class="brandcard"></div>' + bug(cid)
                + f'<div class="ctitle" id="{cid}-h" style="top:560px">{e["title"]}</div>'
                + f'<div id="{cid}-u" style="position:absolute; left:84px; top:1000px"><span class="pill">{e["url"]}</span></div>'
                + tick(cid) + wipe(cid))
    def end_js(cid, dur, size=None):
        return wipe_js(cid) + S.rise(cid, "h", 0.2, dy=40, dur=0.55) + S.pop(cid, "u", 0.7, scale=1.15, dur=0.45)
    add(f"s{len(d['beats']) + 1}-end", 3.5, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "WHAT'S HAPPENING"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.1, fade_out=1.2)],
                 note="Local news show: full-bleed photos, LIVE bug, word-by-word headlines, one continuous ticker.")
