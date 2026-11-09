"""WEEK PLANNER — the week's events as an animated planner, not a slideshow.

Built Oct 28 2026 after the owner turned down a photo montage ("Not at all")
and asked to "showcase the events for this week, and places to go … make it
new, interesting". Type and motion carry it: a row of day tabs with a gold
indicator that slides from day to day, a giant outlined day name drifting
behind, and event cards that fly in with a time block, the place and a small
round thumbnail. Photos are accents only.

    python3 _kit/make.py week-planner --data @week.json --out out/<project> --vo out/<project>/public

Data contract:

    slug, title, theme ("halloween" | "plain")
    assets   staged public/ filename -> URL/local path
    cover    {kick, title, sub}
    days     [ {tab, num, name, events:[{time, title, where, thumb, fit?}], say} ]
    places   {title, cards:[{photo, name, line}], say}
    end      {title, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

TAB_W, TAB_GAP, TAB_LEFT, TAB_TOP = 210, 24, 84, 300
ORANGE = "#ff7a1a"

# Simple line icons for events with no photo of their own (no emoji: the render font has none).
_I = 'fill="none" stroke="#241629" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
ICONS = {
    "ghost": f'<svg viewBox="0 0 64 64"><path {_I} d="M14 56V28a18 18 0 0 1 36 0v28l-6-5-6 5-6-5-6 5-6-5z"/><circle cx="26" cy="28" r="3" fill="#241629"/><circle cx="38" cy="28" r="3" fill="#241629"/></svg>',
    "music": f'<svg viewBox="0 0 64 64"><path {_I} d="M24 46V14l26-6v32"/><circle {_I} cx="18" cy="46" r="7"/><circle {_I} cx="44" cy="40" r="7"/></svg>',
    "art": f'<svg viewBox="0 0 64 64"><path {_I} d="M32 8a24 24 0 1 0 0 48c4 0 5-3 3-6s0-7 4-7h6a11 11 0 0 0 11-11C56 18 45 8 32 8z"/><circle cx="20" cy="30" r="3.5" fill="#241629"/><circle cx="28" cy="19" r="3.5" fill="#241629"/><circle cx="40" cy="19" r="3.5" fill="#241629"/></svg>',
    "market": f'<svg viewBox="0 0 64 64"><path {_I} d="M10 26h44l-5 26H15z"/><path {_I} d="M22 26l8-14M42 26l-8-14"/><path {_I} d="M26 36v8M38 36v8"/></svg>',
    "tree": f'<svg viewBox="0 0 64 64"><path {_I} d="M32 8l4 6-4-1-4 1z"/><path {_I} d="M32 14L18 32h8L14 48h36L38 32h8z"/><path {_I} d="M28 48v8h8v-8"/></svg>',
    "festival": f'<svg viewBox="0 0 64 64"><path {_I} d="M32 10c-12 0-20 9-20 22s8 22 20 22 20-9 20-22-8-22-20-22z"/><path {_I} d="M32 10c-3-4-1-7 3-8"/><path {_I} d="M24 30l4 4 4-4 4 4 4-4M24 42h16"/></svg>',
    "vote": f'<svg viewBox="0 0 64 64"><path {_I} d="M10 34h44v22H10z"/><path {_I} d="M20 34l10-24 16 7-7 17"/><path {_I} d="M24 46h16"/></svg>',
    "shield": f'<svg viewBox="0 0 64 64"><path {_I} d="M32 6l20 8v16c0 13-9 22-20 28C21 52 12 43 12 30V14z"/><path {_I} d="M24 31l6 6 11-12"/></svg>',
    "skate": f'<svg viewBox="0 0 64 64"><path {_I} d="M6 30c4 6 8 8 14 8h24c6 0 10-2 14-8"/><circle {_I} cx="20" cy="48" r="5"/><circle {_I} cx="44" cy="48" r="5"/></svg>',
}


def _css(cid: str, theme: str) -> str:
    s = f'[data-composition-id="{cid}"]'
    glow = (f"radial-gradient(70% 30% at 50% 108%, rgba(255,122,26,0.55) 0%, rgba(255,122,26,0) 70%),"
            if theme == "halloween" else "")
    return f"""
      {s} .mark {{ display:none; }}
      {s} .field {{ position:absolute; inset:0; background:{glow}
                    radial-gradient(ellipse 110% 80% at 30% 20%, #4a0a57 0%, #2a0631 55%, #14031a 100%); }}
      {s} .moon {{ position:absolute; right:-120px; top:-140px; width:560px; height:560px; border-radius:50%;
                   background:radial-gradient(circle at 38% 38%, #fff6cf 0%, {B.GOLD} 55%, #c99a00 100%);
                   box-shadow:0 0 120px 40px rgba(239,198,24,0.28); opacity:0.92; }}
      {s} .ghost {{ position:absolute; left:0; top:1420px; white-space:nowrap; font-weight:800; font-size:330px; letter-spacing:-12px;
                    color:transparent; -webkit-text-stroke:3px rgba(255,255,255,0.13); line-height:1; }}
      {s} .tab {{ position:absolute; top:{TAB_TOP}px; width:{TAB_W}px; height:118px; border-radius:26px; text-align:center;
                  border:3px solid rgba(255,255,255,0.22); color:rgba(255,255,255,0.7); z-index:5; }}
      {s} .tab b {{ display:block; font-size:30px; letter-spacing:6px; margin-top:16px; font-weight:800; }}
      {s} .tab span {{ display:block; font-size:44px; font-weight:800; line-height:1.05; color:#fff; }}
      {s} .ind {{ position:absolute; top:{TAB_TOP}px; left:{TAB_LEFT}px; width:{TAB_W}px; height:118px; border-radius:26px;
                  background:{B.GOLD}; z-index:4; box-shadow:0 14px 40px rgba(239,198,24,0.45); }}
      {s} .tab.on b, {s} .tab.on span {{ color:{B.INK}; }}
      {s} .kick {{ position:absolute; left:84px; top:150px; font-weight:800; font-size:30px; letter-spacing:9px; color:{B.GOLD};
                   text-transform:uppercase; }}
      {s} .day {{ position:absolute; left:80px; top:470px; color:#fff; font-weight:800; font-size:128px; letter-spacing:-5px; line-height:1; }}
      {s} .day small {{ font-size:46px; letter-spacing:0; color:{B.GOLD}; margin-left:18px; }}
      {s} .card {{ position:absolute; left:60px; right:60px; height:236px; border-radius:34px; background:#fff; overflow:hidden;
                   box-shadow:0 26px 60px rgba(0,0,0,0.45); display:flex; align-items:center; }}
      {s} .time {{ width:210px; height:100%; background:{B.GOLD}; color:{B.INK}; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; font-weight:800; flex:none; }}
      {s} .time b {{ font-size:66px; letter-spacing:-2px; line-height:1; }}
      {s} .time i {{ font-style:normal; font-size:30px; letter-spacing:3px; margin-top:4px; }}
      {s} .body {{ flex:1; padding:0 26px 0 32px; min-width:0; }}
      {s} .body h3 {{ margin:0; font-size:52px; line-height:1.04; font-weight:800; color:{B.INK}; letter-spacing:-1px; }}
      {s} .body p {{ margin:10px 0 0; font-size:32px; font-weight:700; color:#7a6880; }}
      {s} .thumb {{ width:156px; height:156px; border-radius:50%; overflow:hidden; flex:none; margin-right:36px;
                    border:6px solid #f3ecf5; background:#fff; }}
      {s} .thumb.icon {{ background:{B.GOLD}; border-color:#fff3c2; display:flex; align-items:center; justify-content:center; }}
      {s} .thumb.icon svg {{ width:92px; height:92px; }}
      {s} .thumb img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .polar {{ position:absolute; width:440px; background:#fff; border-radius:26px; padding:14px 14px 22px;
                    box-shadow:0 30px 60px rgba(0,0,0,0.5); }}
      {s} .polar img {{ width:100%; height:360px; object-fit:cover; border-radius:16px; display:block; }}
      {s} .polar b {{ display:block; margin:16px 8px 0; font-size:38px; color:{B.INK}; font-weight:800; line-height:1.05; }}
      {s} .polar i {{ display:block; margin:6px 8px 0; font-style:normal; font-size:26px; white-space:nowrap; color:{B.PURPLE}; font-weight:700; }}
      {s} .big {{ position:absolute; left:80px; right:80px; color:#fff; font-weight:800; letter-spacing:-8px; line-height:0.86; }}
      {s} .big em {{ font-style:normal; color:{B.GOLD}; }}
      {s} .hero {{ position:absolute; left:60px; right:60px; border-radius:34px; overflow:hidden;
                   box-shadow:0 26px 60px rgba(0,0,0,0.45); border:6px solid rgba(255,255,255,0.9); }}
      {s} .hero img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .news {{ position:absolute; left:60px; right:60px; height:300px; border-radius:34px; background:#fff; overflow:hidden;
                   box-shadow:0 26px 60px rgba(0,0,0,0.45); display:flex; }}
      {s} .news .ph {{ width:300px; height:100%; flex:none; background:{B.GOLD}; display:flex; align-items:center; justify-content:center; }}
      {s} .news .ph img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .news .ph svg {{ width:130px; height:130px; }}
      {s} .news .tx {{ flex:1; padding:30px 34px; min-width:0; display:flex; flex-direction:column; justify-content:center; }}
      {s} .news .tag {{ font-size:26px; letter-spacing:5px; font-weight:800; color:{B.PURPLE}; text-transform:uppercase; }}
      {s} .news h3 {{ margin:10px 0 0; font-size:46px; line-height:1.06; font-weight:800; color:{B.INK}; letter-spacing:-1px; }}
      {s} .news p {{ margin:12px 0 0; font-size:30px; line-height:1.2; font-weight:700; color:#7a6880; }}
      {s} .datepill {{ position:absolute; left:84px; display:inline-block; background:{ORANGE}; color:#fff; font-weight:800;
                       font-size:44px; padding:16px 34px; border-radius:999px; }}
    """


def build(d: dict) -> Video:
    assets = dict(d.get("assets") or {})
    theme = d.get("theme", "plain")
    days = d["days"]
    scenes, subs = [], []

    def src(key):
        return _media_src(assets, key)[0]

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, theme)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    def tab_x(i):
        return TAB_LEFT + i * (TAB_W + TAB_GAP)

    def tabs(cid, on=None, show_ind=True):
        h = ""
        for i, dd in enumerate(days):
            cls = "tab on" if i == on else "tab"
            h += f'<div class="{cls}" id="{cid}-t{i}" style="left:{tab_x(i)}px"><b>{dd["tab"]}</b><span>{dd["num"]}</span></div>'
        if show_ind:
            h += f'<div class="ind" id="{cid}-ind"></div>'
        return h

    base = '<div class="field"></div><div class="moon" id="{cid}-moon"></div>'

    # cover — frame 0 is the thumbnail, fully composed
    c = d["cover"]
    def cover_html(cid, dur, size):
        return (base.format(cid=cid) + f'<div class="kick">{c["kick"]}</div>' + tabs(cid, on=None, show_ind=False)
                + f'<div class="big" id="{cid}-b" style="top:560px; font-size:200px">{c["title"]}</div>'
                + f'<div class="datepill" id="{cid}-d" style="top:1010px">{c["sub"]}</div>' + fan(cid))
    def fan(cid):
        picks = [dd["events"][0] for dd in days][:3]
        out = ""
        for k, e in enumerate(picks):
            t, _, ap = e["time"].partition(" ")
            out += (f'<div class="card" id="{cid}-f{k}" style="left:{70 + k * 40}px; right:{150 - k * 40}px; top:{1150 + k * 112}px; height:150px; '
                    f'transform:rotate({(-3, 2, -1.5)[k]}deg)"><div class="time" style="width:150px"><b style="font-size:46px">{t}</b><i style="font-size:22px">{ap}</i></div>'
                    f'<div class="body"><h3 style="font-size:40px">{e["title"]}</h3></div></div>')
        return out
    def cover_js(cid, dur, size=None):
        out = f'tl.fromTo("#{cid}-moon", {{ y:0, scale:1 }}, {{ y:30, scale:1.05, duration:{dur:.2f}, ease:"none" }}, 0);'
        for i in range(len(days)):
            out += f'tl.to("#{cid}-t{i}", {{ y:-8, duration:0.22, yoyo:true, repeat:1, ease:"power2.out" }}, {0.5 + 0.12 * i:.2f});'
        for k in range(3):
            out += f'tl.to("#{cid}-f{k}", {{ y:-14, duration:{dur:.2f}, ease:"none" }}, 0);'
        return out + f'tl.to("#{cid}-b", {{ scale:1.03, transformOrigin:"0% 50%", duration:{dur:.2f}, ease:"none" }}, 0);'
    add("s0-cover", 3.0, cover_html, cover_js, c.get("say", ""))

    nw = d.get("news")
    if nw:
        def news_html(cid, dur, size):
            cards = ""
            for k, it in enumerate(nw["items"]):
                ph = (f'<div class="ph">{ICONS[it["icon"]]}</div>' if it.get("icon")
                      else f'<div class="ph"><img src="{src(it["photo"])}" style="object-position:{it.get("pos", "50% 50%")}" /></div>')
                cards += (f'<div class="news" id="{cid}-n{k}" style="top:{560 + k * 340}px; opacity:0">{ph}'
                          f'<div class="tx"><div class="tag">{it["tag"]}</div><h3>{it["head"]}</h3><p>{it["sub"]}</p></div></div>')
            return (base.format(cid=cid) + f'<div class="kick">{d.get("kick", "This week in Lompoc")}</div>'
                    + f'<div class="big" id="{cid}-h" style="top:300px; font-size:150px">{nw["title"]}</div>' + cards)
        def news_js(cid, dur, size=None):
            out = S.rise(cid, "h", 0.05, dy=30, dur=0.5)
            n = len(nw["items"])
            for k in range(n):
                at = 0.35 + k * max(0.6, (dur - 1.6) / n)
                out += (f'tl.fromTo("#{cid}-n{k}", {{ autoAlpha:0, x:-700 }}, '
                        f'{{ autoAlpha:1, x:0, duration:0.6, ease:"back.out(1.3)" }}, {at:.2f});')
            return out
        add("s0b-news", 6.0, news_html, news_js, nw["say"])

    for i, dd in enumerate(days):
        evs = dd["events"]
        def day_html(cid, dur, size, dd=dd, i=i, evs=evs):
            cards = ""
            top = 690
            ch, step = (300, 336) if len(evs) <= 2 else (246, 272)
            for k, e in enumerate(evs):
                fit = e.get("fit", "cover")
                pad = "padding:18px; box-sizing:border-box;" if fit == "contain" else ""
                t, _, ap = e["time"].partition(" ")
                thumb = (f'<div class="thumb icon">{ICONS[e["icon"]]}</div>' if e.get("icon")
                         else f'<div class="thumb"><img src="{src(e["thumb"])}" style="object-fit:{fit}; {pad}" /></div>')
                cards += (f'<div class="card" id="{cid}-c{k}" style="top:{top + k * step}px; height:{ch}px; opacity:0">'
                          f'<div class="time"><b>{t}</b><i>{ap}</i></div>'
                          f'<div class="body"><h3>{e["title"]}</h3><p>{e["where"]}</p></div>'
                          f'{thumb}</div>')
            hero = ""
            if dd.get("photo"):
                htop = top + (len(evs) - 1) * step + ch + 44
                hero = (f'<div class="hero" id="{cid}-h" style="top:{htop}px; height:{max(300, 1640 - htop)}px; opacity:0">'
                        f'<img id="{cid}-hi" src="{src(dd["photo"])}" style="object-position:{dd.get("pos", "50% 50%")}" /></div>')
            return (base.format(cid=cid)
                    + f'<div class="ghost" id="{cid}-g">{dd["name"].upper()} {dd["name"].upper()}</div>'
                    + f'<div class="kick">{d.get("kick", "This week in Lompoc")}</div>'
                    + tabs(cid, on=i)
                    + f'<div class="day" id="{cid}-dn">{dd["name"]}<small>{dd.get("date", "")}</small></div>'
                    + cards + hero)
        def day_js(cid, dur, size=None, i=i, evs=evs, dd=dd):
            frm = tab_x(max(0, i - 1)) - TAB_LEFT
            to = tab_x(i) - TAB_LEFT
            out = (f'tl.fromTo("#{cid}-ind", {{ x:{frm} }}, {{ x:{to}, duration:0.55, ease:"back.out(1.6)" }}, 0);'
                   f'tl.fromTo("#{cid}-t{i}", {{ scale:1 }}, {{ scale:1.08, duration:0.3, yoyo:true, repeat:1, ease:"power2.out" }}, 0.3);'
                   f'tl.fromTo("#{cid}-g", {{ x:80 }}, {{ x:-900, duration:{dur:.2f}, ease:"none" }}, 0);'
                   f'tl.fromTo("#{cid}-dn", {{ autoAlpha:0, x:-60 }}, {{ autoAlpha:1, x:0, duration:0.5, ease:"expo.out" }}, 0.12);'
                   f'tl.fromTo("#{cid}-moon", {{ rotation:0 }}, {{ rotation:8, duration:{dur:.2f}, ease:"none" }}, 0);')
            n = len(evs)
            for k in range(n):
                at = 0.45 + k * max(0.5, (dur - 1.4) / max(1, n))
                rot = -4 if k % 2 == 0 else 4
                out += (f'tl.fromTo("#{cid}-c{k}", {{ autoAlpha:0, x:700, rotation:{rot} }}, '
                        f'{{ autoAlpha:1, x:0, rotation:0, duration:0.6, ease:"back.out(1.4)" }}, {at:.2f});')
            if dd.get("photo"):
                out += (f'tl.fromTo("#{cid}-h", {{ autoAlpha:0, y:120 }}, {{ autoAlpha:1, y:0, duration:0.6, ease:"expo.out" }}, 0.3);'
                        f'tl.fromTo("#{cid}-hi", {{ scale:1.0 }}, {{ scale:1.12, duration:{dur:.2f}, ease:"none" }}, 0);')
            return out
        add(f"s{i + 1}-{dd['tab'].lower()}", 3.6, day_html, day_js, dd["say"])

    # places to go — three prints, fanned
    p = d["places"]
    def places_html(cid, dur, size):
        xy = [(60, 640, -5), (580, 690, 4), (320, 1150, -2)]
        prints = ""
        for k, (x, y, r) in enumerate(xy[:len(p["cards"])]):
            cd = p["cards"][k]
            prints += (f'<div class="polar" id="{cid}-p{k}" style="left:{x}px; top:{y}px; transform:rotate({r}deg); opacity:0">'
                       f'<img src="{src(cd["photo"])}" /><b>{cd["name"]}</b><i>{cd["line"]}</i></div>')
        return (base.format(cid=cid) + f'<div class="kick">{d.get("kick", "This week in Lompoc")}</div>'
                + f'<div class="big" id="{cid}-h" style="top:300px; font-size:150px">{p["title"]}</div>' + prints)
    def places_js(cid, dur, size=None):
        out = S.rise(cid, "h", 0.05, dy=30, dur=0.5)
        for k in range(len(p["cards"])):
            out += (f'tl.fromTo("#{cid}-p{k}", {{ autoAlpha:0, y:240, scale:0.85 }}, '
                    f'{{ autoAlpha:1, y:0, scale:1, duration:0.6, ease:"back.out(1.5)" }}, {0.45 + 0.7 * k:.2f});')
        return out
    add("s8-places", 4.0, places_html, places_js, p["say"])

    e = d["end"]
    def end_html(cid, dur, size):
        return (base.format(cid=cid) + tabs(cid, on=None, show_ind=False)
                + f'<div class="big" id="{cid}-h" style="top:620px; font-size:150px">{e["title"]}</div>'
                + f'<div id="{cid}-u" style="position:absolute; left:84px; top:1040px"><span class="pill">{e["url"]}</span></div>')
    def end_js(cid, dur, size=None):
        out = S.rise(cid, "h", 0.1, dy=30, dur=0.55) + S.pop(cid, "u", 0.7, scale=1.15, dur=0.45)
        for i in range(len(days)):
            out += f'tl.to("#{cid}-t{i}", {{ backgroundColor:"rgba(239,198,24,0.9)", duration:0.2 }}, {0.9 + 0.12 * i:.2f});'
        return out
    add("s9-end", 3.5, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "WEEK PLANNER"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.22, fade_in=0.1, fade_out=1.2)],
                 note="Animated planner: sliding day tab, outlined day name, event cards; photos as accents only.")
