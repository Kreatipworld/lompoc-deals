"""A DAY IN LOMPOC — one day, sunrise to launch, told hour by hour.

Built Oct 27 2026 (owner: "Video of a day in Lompoc", option 2: a general town
video with members woven in). The through-line is the clock: a big time stamp
top left, a sun that travels a thin day track, and a sky tint that warms from
dawn to golden hour and cools to night. Each hour is full-bleed real photos —
members' own pictures, our satellite view, the site's own place photos —
with a name chip that changes with every photo.

    python3 _kit/make.py day-in-lompoc --data @day.json --out out/<project> --vo out/<project>/public

Data contract:

    slug, title
    assets   staged public/ filename -> URL/local path
    cover    {title, sub}                       painted on frame 0 over the first hour
    hours    [ {time, ampm, sky, line, shots:[{media, name?, pos?}], say} ]
             sky: dawn | morning | noon | afternoon | golden | dusk | night
    end      {title, line, url, photos:[k, k, k, k], say}

Every name chip must sit on that business's own photo.
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

FIRST, LAST = 6, 21   # the day track runs 6 AM to 9 PM
TRACK = 1080 - 2 * 84   # day track width, px

# sky tint over the photo: (top glow, overall wash, photo filter)
SKY = {
    "dawn":      ("rgba(255,150,90,0.55)",  "rgba(255,170,120,0.16)", "saturate(1.05) brightness(0.96)"),
    "morning":   ("rgba(255,214,140,0.38)", "rgba(255,226,170,0.08)", "saturate(1.06)"),
    "noon":      ("rgba(255,250,225,0.22)", "rgba(255,255,255,0.0)",  "saturate(1.08) brightness(1.02)"),
    "afternoon": ("rgba(255,205,120,0.30)", "rgba(255,200,120,0.06)", "saturate(1.06)"),
    "golden":    ("rgba(255,140,40,0.55)",  "rgba(255,150,60,0.18)",  "saturate(1.12) contrast(1.03)"),
    "dusk":      ("rgba(160,60,150,0.50)",  "rgba(120,40,120,0.18)",  "saturate(1.05) brightness(0.92)"),
    "night":     ("rgba(30,40,110,0.65)",   "rgba(12,16,50,0.40)",    "saturate(0.9) brightness(0.70) contrast(1.08)"),
}


def _hour24(t: str, ampm: str) -> float:
    h, _, m = t.partition(":")
    h = int(h) % 12 + (12 if ampm.upper() == "PM" else 0)
    return h + (int(m or 0) / 60)


def _css(cid: str) -> str:
    s = f'[data-composition-id="{cid}"]'
    return f"""
      {s} .mark {{ display:none; }}
      {s} .shot {{ position:absolute; inset:0; overflow:hidden; }}
      {s} .shot img {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .glow {{ position:absolute; left:0; right:0; top:0; height:62%; z-index:20; pointer-events:none; }}
      {s} .wash {{ position:absolute; inset:0; z-index:21; pointer-events:none; }}
      {s} .topfade {{ position:absolute; left:0; right:0; top:0; height:30%; z-index:22; pointer-events:none;
                      background:linear-gradient(to bottom, rgba(16,8,20,0.62) 0%, rgba(16,8,20,0) 100%); }}
      {s} .botfade {{ position:absolute; left:0; right:0; bottom:0; height:62%; z-index:22; pointer-events:none;
                      background:linear-gradient(to top, rgba(16,8,20,0.92) 0%, rgba(16,8,20,0.55) 45%, rgba(16,8,20,0) 100%); }}
      {s} .kick {{ position:absolute; left:84px; top:142px; z-index:40; font-weight:800; font-size:28px; letter-spacing:8px;
                   color:{B.GOLD}; text-transform:uppercase; }}
      {s} .clock {{ position:absolute; left:78px; top:184px; z-index:40; color:#fff; font-weight:800; font-size:176px;
                    letter-spacing:-7px; line-height:1; text-shadow:0 10px 40px rgba(10,6,12,0.55); font-variant-numeric:tabular-nums; }}
      {s} .clock small {{ font-size:64px; letter-spacing:0; margin-left:14px; color:{B.GOLD}; }}
      {s} .track {{ position:absolute; left:84px; right:84px; top:404px; height:6px; border-radius:6px; z-index:40;
                    background:rgba(255,255,255,0.28); }}
      {s} .fill {{ position:absolute; left:0; top:0; bottom:0; width:100%; transform-origin:0 50%; border-radius:6px; background:linear-gradient(90deg,{B.GOLD},#ff9d3c); }}
      {s} .sun {{ position:absolute; top:-15px; width:36px; height:36px; margin-left:-18px; border-radius:50%; }}
      {s} .line {{ position:absolute; left:84px; right:84px; bottom:{B.SCENE_BOTTOM_PCT + 6}%; z-index:40; color:#fff; font-weight:800;
                   font-size:84px; line-height:1.0; letter-spacing:-2.5px; text-shadow:0 8px 30px rgba(10,6,12,0.6); }}
      {s} .names {{ position:absolute; left:84px; right:84px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:40; height:84px; }}
      {s} .name {{ position:absolute; left:0; top:0; display:inline-flex; align-items:center; gap:14px; background:rgba(255,255,255,0.96);
                   color:{B.INK}; font-weight:800; font-size:38px; padding:16px 30px; border-radius:999px; white-space:nowrap;
                   box-shadow:0 12px 30px rgba(10,6,12,0.35); }}
      {s} .name i {{ width:16px; height:16px; border-radius:50%; background:{B.GREEN}; display:inline-block; }}
      {s} .title {{ position:absolute; left:80px; right:80px; z-index:41; color:#fff; font-weight:800; line-height:0.9;
                    letter-spacing:-7px; font-size:188px; text-shadow:0 12px 44px rgba(10,6,12,0.6); }}
      {s} .sub {{ position:absolute; left:86px; z-index:41; display:inline-block; background:{B.GOLD}; color:{B.INK};
                  font-weight:800; font-size:44px; padding:16px 32px; border-radius:999px; }}
      {s} .credit {{ position:absolute; right:40px; bottom:{B.SAFE_BOTTOM_PCT - 2}%; z-index:41; color:rgba(255,255,255,0.6);
                     font-size:20px; font-weight:600; }}
    """


def build(d: dict) -> Video:
    assets = dict(d.get("assets") or {})
    hours = d["hours"]
    scenes, subs = [], []

    def src(key):
        return _media_src(assets, key)[0]

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    span = LAST - FIRST

    for i, h in enumerate(hours):
        first = i == 0
        glow, wash, filt = SKY[h.get("sky", "noon")]
        pct = max(0.0, min(1.0, (_hour24(h["time"], h["ampm"]) - FIRST) / span)) * 100
        prev = 0.0 if first else max(0.0, min(1.0, (_hour24(hours[i - 1]["time"], hours[i - 1]["ampm"]) - FIRST) / span)) * 100
        night = h.get("sky") in ("night", "dusk")
        sun_bg = "radial-gradient(circle at 40% 40%, #fff7d6, #f2f4ff 70%)" if h.get("sky") == "night" else \
            f"radial-gradient(circle at 40% 40%, #fff6c4, {B.GOLD} 70%)"
        sun_glow = "0 0 26px 8px rgba(220,230,255,0.7)" if h.get("sky") == "night" else "0 0 30px 10px rgba(255,190,60,0.75)"
        shots = h["shots"]

        def hour_html(cid, dur, size, h=h, shots=shots, first=first, glow=glow, wash=wash, filt=filt,
                      pct=pct, prev=prev, sun_bg=sun_bg, sun_glow=sun_glow):
            layers = ""
            for k, sh in enumerate(shots):
                pos = sh.get("pos", "50% 50%")
                vis = "1" if k == 0 else "0"
                layers += (f'<div class="shot" id="{cid}-sh{k}" style="opacity:{vis}">'
                           f'<img id="{cid}-im{k}" src="{src(sh["media"])}" style="object-position:{pos}; filter:{sh.get("filter", filt)}; transform-origin:{sh.get("origin", "50% 50%")}" /></div>')
            names = ""
            for k, sh in enumerate(shots):
                if sh.get("name"):
                    names += f'<div class="name" id="{cid}-n{k}" style="opacity:0"><i></i>{sh["name"]}</div>'
            cover = ""
            if first and d.get("cover"):
                c = d["cover"]
                cover = (f'<div class="title" id="{cid}-ct" style="top:560px">{c["title"]}</div>'
                         f'<div class="sub" id="{cid}-cs" style="top:{560 + 2 * 172 + 40}px">{c["sub"]}</div>')
            clock_vis = "0" if cover else "1"
            credit = f'<div class="credit">{h["credit"]}</div>' if h.get("credit") else ""
            return (f'{layers}'
                    f'<div class="glow" style="background:linear-gradient(to bottom, {glow} 0%, rgba(0,0,0,0) 100%)"></div>'
                    f'<div class="wash" style="background:{wash}"></div>'
                    f'<div class="topfade"></div><div class="botfade"></div>'
                    f'<div class="kick" id="{cid}-k">A day in Lompoc</div>'
                    f'<div class="clock" id="{cid}-c" style="opacity:{clock_vis}">{h["time"]}<small>{h["ampm"]}</small></div>'
                    f'<div class="track" id="{cid}-tr"><div class="fill" id="{cid}-f"></div>'
                    f'<div class="sun" id="{cid}-s" style="left:0; background:{sun_bg}; box-shadow:{sun_glow}"></div></div>'
                    f'{cover}'
                    f'<div class="line" id="{cid}-l" style="opacity:{0 if (cover or not first) else 1}">{h["line"]}</div>'
                    f'<div class="names">{names}</div>{credit}')

        def hour_js(cid, dur, size=None, shots=shots, first=first, pct=pct, prev=prev, h=h):
            out = ""
            n = len(shots)
            seg = dur / n
            for k, sh in enumerate(shots):
                t0 = k * seg
                zoom = sh.get("zoom", 1.12)
                if k > 0:
                    out += f'tl.fromTo("#{cid}-sh{k}", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:0.32, ease:"power1.inOut" }}, {t0:.2f});'
                out += f'tl.fromTo("#{cid}-im{k}", {{ scale:1.0 }}, {{ scale:{zoom}, duration:{seg + 0.4:.2f}, ease:"none" }}, {t0:.2f});'
                if sh.get("name"):
                    out += f'tl.fromTo("#{cid}-n{k}", {{ autoAlpha:0, y:16 }}, {{ autoAlpha:1, y:0, duration:0.35, ease:"expo.out" }}, {t0 + 0.12:.2f});'
                    if k < n - 1:
                        out += S.out(cid, f"n{k}", t0 + seg - 0.18, dur=0.2)
            # the day moves: the sun slides to this hour
            out += (f'tl.fromTo("#{cid}-f", {{ scaleX:{prev / 100:.4f} }}, {{ scaleX:{pct / 100:.4f}, duration:0.9, ease:"power2.inOut" }}, 0);'
                    f'tl.fromTo("#{cid}-s", {{ x:{prev * TRACK / 100:.1f} }}, {{ x:{pct * TRACK / 100:.1f}, duration:0.9, ease:"power2.inOut" }}, 0);')
            if first and d.get("cover"):
                # frame 0 is the cover; the title clears and the clock takes over
                out += (S.out(cid, "ct", 1.05, dur=0.35) + S.out(cid, "cs", 1.05, dur=0.35)
                        + f'tl.fromTo("#{cid}-c", {{ autoAlpha:0, y:24 }}, {{ autoAlpha:1, y:0, duration:0.5, ease:"expo.out" }}, 1.2);'
                        + S.rise(cid, "l", 1.35, dy=22, dur=0.45))
            elif not first:
                out += (f'tl.fromTo("#{cid}-c", {{ autoAlpha:0, y:-20, filter:"blur(8px)" }}, {{ autoAlpha:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out" }}, 0.05);'
                        + S.rise(cid, "l", 0.28, dy=22, dur=0.45))
            return out

        add(f"s{i}-h{h['time'].replace(':', '')}{h['ampm'].lower()}", 3.4, hour_html, hour_js, h["say"])

    # end — the whole day in one frame
    e = d["end"]

    def end_html(cid, dur, size):
        p = e["photos"]
        xy = [(60, 170, -4), (560, 140, 3.5), (80, 600, 2.5), (570, 580, -3)]
        prints = ""
        for k, (x, y, r) in enumerate(xy[:len(p)]):
            prints += (f'<div id="{cid}-p{k}" style="position:absolute; left:{x}px; top:{y}px; width:450px; height:380px; '
                       f'transform:rotate({r}deg); border:10px solid #fff; border-radius:28px; overflow:hidden; '
                       f'box-shadow:0 30px 60px rgba(0,0,0,0.45)"><img src="{src(p[k])}" style="width:100%; height:100%; object-fit:cover" /></div>')
        return (f'<div style="position:absolute; inset:0; background:radial-gradient(ellipse 90% 70% at 50% 35%, #7d1590 0%, {B.PURPLE} 45%, #2a0631 100%)"></div>'
                f'{prints}'
                f'<div id="{cid}-t" style="position:absolute; left:80px; right:80px; top:1030px; color:#fff; font-weight:800; font-size:104px; line-height:0.95; letter-spacing:-4px">{e["title"]}</div>'
                f'<div id="{cid}-l" style="position:absolute; left:84px; right:84px; top:1260px; color:{B.GOLD}; font-weight:800; font-size:50px; line-height:1.1">{e["line"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:84px; top:1360px"><span class="pill">{e["url"]}</span></div>')

    def end_js(cid, dur, size=None):
        out = ""
        for k in range(len(e["photos"])):
            out += S.pop(cid, f"p{k}", 0.05 + 0.08 * k, scale=1.1, dur=0.45)
        return out + S.rise(cid, "t", 0.35, dy=24, dur=0.5) + S.rise(cid, "l", 1.4, dy=16, dur=0.45) + S.pop(cid, "u", 2.2, scale=1.12, dur=0.45)

    add("s99-end", 4.0, lambda cid, dur, size: end_html(cid, dur, size), end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title=d.get("title", "A DAY IN LOMPOC"), total=total, size=B.SIZES["9x16"],
                 scenes=scenes, subs=subs, vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.85, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.20, fade_in=0.2, fade_out=1.4)],
                 note="Clock through-line 6 AM→9 PM; sky tint per hour; real photos only; name chips on their own photos.")
