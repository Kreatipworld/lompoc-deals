"""REALTOR SHOWCASE — one agent and their homes for sale, as a commercial.

    python3 _kit/make.py realtor-showcase --data @out/<project>/spot.json --out out/<project>

Shape: a designed card that IS the thumbnail (portrait, ranking chip, name,
brokerage), a "meet them" beat over one of their own listing photos, one beat
per home (exterior, then an interior dissolving in under the same price card),
and an end card with the phone and the /homes page.

Everything printed comes from the data, and the data comes from the agent's
own profile and listing rows. Photos are the agent's listing photos only; the
brokerage name is set as text, never their logo.

Data contract:
    name, brokerage, portrait, phone, site       required
    accent        brokerage colour for the cards (default Lompoc purple)
    hook          {chip, say}                     the cold open
    meet          {media, position, title, chips[], say}
    homes         [{street, area, price, facts, photos:[ext, int], positions:[...], say}]
    say_close     the spoken CTA (phone spelled out for the voice)
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

REQUIRED = ("name", "brokerage", "portrait", "phone", "site", "homes")

OPEN, MEET, HOME, END = 3.8, 5.6, 4.2, 6.0


def build(d: dict) -> Video:
    missing = [k for k in REQUIRED if not d.get(k)]
    if missing:
        raise ValueError(f"realtor_showcase needs {missing}")
    name, brokerage, phone, site = d["name"], d["brokerage"], d["phone"], d["site"]
    accent = d.get("accent", B.PURPLE)
    hook = d.get("hook", {})
    meet = d.get("meet", {})
    homes = d["homes"]

    assets = {"portrait.jpg": d["portrait"]}
    if meet.get("media"):
        assets["meet.jpg"] = meet["media"]
    for i, h in enumerate(homes):
        for j, p in enumerate(h["photos"]):
            assets[f"home{i}-{j}.jpg"] = p

    card_bg = (f'<div style="position:absolute; inset:0; background:'
               f'radial-gradient(ellipse 90% 60% at 50% 34%, {accent} 0%, #0b1a3d 52%, {B.BG} 100%)"></div>'
               f'<div style="position:absolute; inset:0; background:linear-gradient(160deg, rgba(101,12,117,0) 40%, rgba(101,12,117,0.55) 100%)"></div>'
               f'<div style="position:absolute; left:0; right:0; top:8%; height:2px; z-index:20; '
               f'background:linear-gradient(90deg, transparent, {B.GOLD}, transparent); opacity:0.55"></div>')

    def portrait(cid, px, opacity="1"):
        return (f'<div id="{cid}-face" style="width:{px}px; height:{px}px; margin:0 auto; border-radius:50%; '
                f'padding:10px; background:linear-gradient(135deg, {B.GOLD}, #fff 45%, {B.GOLD}); '
                f'box-shadow:0 30px 80px rgba(0,0,0,0.55); opacity:{opacity}">'
                f'<img src="public/portrait.jpg" alt="" style="width:100%; height:100%; border-radius:50%; '
                f'object-fit:cover; object-position:50% 30%; display:block" /></div>')

    # ── open: the thumbnail, fully painted at t=0 ───────────────────────────
    def open_html(cid, dur, size):
        return f'''{card_bg}
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:19%; z-index:36; text-align:center">
        {portrait(cid, 600)}
        <span class="chip" id="{cid}-chip" style="margin-top:56px; opacity:1">{hook.get("chip", "")}</span>
        <span class="hero" id="{cid}-name" style="margin-top:40px; font-size:140px; opacity:1">{name}</span>
        <span id="{cid}-brk" style="display:block; margin-top:26px; color:rgba(255,255,255,0.9); font-weight:700; font-size:46px; opacity:1">{brokerage}</span>
        <span id="{cid}-new" style="display:inline-block; margin-top:40px; background:{B.GREEN}; color:#fff; font-weight:800; font-size:36px; letter-spacing:3px; padding:14px 30px; border-radius:999px; opacity:1">NOW ON LOMPOC LOCALS</span>
      </div>'''

    def open_js(cid, dur):
        return (f'tl.fromTo("#{cid}-face", {{ scale:1.04 }}, {{ scale:1, duration:1.8, ease:"power2.out" }}, 0);'
                f'tl.fromTo("#{cid}-name", {{ y:12 }}, {{ y:0, duration:1.0, ease:"power2.out" }}, 0);'
                f'tl.fromTo("#{cid}-new", {{ scale:0.96 }}, {{ scale:1, duration:0.9, ease:"back.out(2)" }}, 0.2);'
                + "".join(S.out(cid, e, max(0.6, dur - B.X - 0.1), dur=0.2) for e in ("face", "chip", "name", "brk", "new")))

    # ── meet: who they are, over one of their listing photos ────────────────
    def meet_html(cid, dur, size):
        g = B.geom(size)
        chips = "".join(
            f'<span id="{cid}-c{i}" style="display:inline-block; margin:0 14px 16px 0; background:rgba(255,255,255,0.14); '
            f'border:2px solid rgba(255,255,255,0.5); color:#fff; font-weight:700; font-size:38px; padding:12px 26px; '
            f'border-radius:999px; opacity:0">{c}</span>'
            for i, c in enumerate(meet.get("chips", [])))
        return f'''<img id="{cid}-bg" class="cover" src="public/meet.jpg" alt="" style="filter:brightness(0.62) saturate(1.05); object-position:{meet.get("position", "50% 50%")}" />
      <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,26,61,0.55) 0%, rgba(11,26,61,0) 40%)"></div>
      <div class="scrim"></div>
      <div style="position:absolute; left:{g["side"]}px; top:15%; z-index:36; display:flex; align-items:center; gap:30px">
        <div id="{cid}-face" style="width:190px; height:190px; border-radius:50%; padding:7px; background:{B.GOLD}; opacity:0">
          <img src="public/portrait.jpg" alt="" style="width:100%; height:100%; border-radius:50%; object-fit:cover; object-position:50% 30%; display:block" /></div>
        <span class="chip" id="{cid}-chip" style="opacity:0">Meet Phillip</span>
      </div>
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["safe_bottom_pct"] + 3}%; z-index:36">
        <span class="hero" id="{cid}-t" style="font-size:92px; letter-spacing:-3px; opacity:0">{meet.get("title", "")}</span>
        <div style="margin-top:34px">{chips}</div>
      </div>'''

    def meet_js(cid, dur):
        n = len(meet.get("chips", []))
        js = (f'tl.fromTo("#{cid}-bg", {{ scale:1.06 }}, {{ scale:1.16, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 40%" }}, 0);'
              + S.pop(cid, "face", 0.10, scale=1.2, dur=0.5)
              + S.rise(cid, "chip", 0.24, dy=12, dur=0.34)
              + S.rise(cid, "t", 0.40, dy=22, dur=0.5))
        for i in range(n):
            js += S.rise(cid, f"c{i}", 0.9 + i * 0.45, dy=14, dur=0.36)
        els = ("face", "chip", "t") + tuple(f"c{i}" for i in range(n))
        return js + "".join(S.out(cid, e, max(0.6, dur - B.X - 0.1), dur=0.2) for e in els)

    # ── one home: exterior, then an interior under the same card ────────────
    def home_beat(i, h):
        def html(cid, dur, size):
            g = B.geom(size)
            pos = h.get("positions") or ["50% 50%"] * len(h["photos"])
            imgs = "".join(
                f'<img id="{cid}-p{j}" class="cover" src="public/home{i}-{j}.jpg" alt="" '
                f'style="filter:brightness(0.9) saturate(1.08); object-position:{pos[j]}; opacity:{1 if j == 0 else 0}" />'
                for j in range(len(h["photos"])))
            return f'''{imgs}
      <div class="scrim"></div>
      <div style="position:absolute; left:{g["side"]}px; top:15%; z-index:36">
        <span class="chip" id="{cid}-chip" style="opacity:0">For sale · {h["area"]}</span>
      </div>
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["safe_bottom_pct"] + 3}%; z-index:36">
        <span class="hero" id="{cid}-price" style="font-size:168px; letter-spacing:-5px; color:#fff; opacity:0">{h["price"]}</span>
        <span id="{cid}-facts" style="display:block; margin-top:20px; color:{B.GOLD}; font-weight:800; font-size:56px; letter-spacing:-1px; opacity:0">{h["facts"]}</span>
        <span id="{cid}-st" style="display:block; margin-top:14px; color:rgba(255,255,255,0.9); font-weight:700; font-size:46px; opacity:0">{h["street"]}</span>
      </div>'''

        def js(cid, dur):
            n = len(h["photos"])
            seg = dur / n
            out = ""
            for j in range(n):
                t0 = j * seg
                z0, z1 = (1.04, 1.13) if j % 2 == 0 else (1.14, 1.05)
                out += (f'tl.fromTo("#{cid}-p{j}", {{ scale:{z0} }}, {{ scale:{z1}, duration:{seg + 0.5:.2f}, '
                        f'ease:"none", transformOrigin:"50% 55%" }}, {max(0, t0 - 0.25):.2f});')
                if j > 0:
                    out += f'tl.to("#{cid}-p{j}", {{ autoAlpha:1, duration:0.45, ease:"power1.inOut" }}, {t0 - 0.2:.2f});'
            out += (S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
                    + S.pop(cid, "price", 0.22, scale=1.12, dur=0.45)
                    + S.rise(cid, "facts", 0.55, dy=14, dur=0.36)
                    + S.rise(cid, "st", 0.80, dy=12, dur=0.34))
            return out + "".join(S.out(cid, e, max(0.6, dur - B.X - 0.1), dur=0.2)
                                 for e in ("chip", "price", "facts", "st"))
        return html, js

    # ── end card ───────────────────────────────────────────────────────────
    def end_html(cid, dur, size):
        return f'''{card_bg}
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:19%; z-index:36; text-align:center">
        {portrait(cid, 470, "0")}
        <span class="hero" id="{cid}-name" style="margin-top:40px; font-size:124px; opacity:0">{name}</span>
        <span id="{cid}-brk" style="display:block; margin-top:20px; color:rgba(255,255,255,0.88); font-weight:700; font-size:42px; opacity:0">{brokerage}</span>
        <div style="margin-top:50px"><span class="pill" id="{cid}-tel" style="font-size:76px; opacity:0">{phone}</span></div>
        <span id="{cid}-site" style="display:block; margin-top:40px; color:#fff; font-weight:800; font-size:62px; letter-spacing:-1px; opacity:0">{site}</span>
      </div>'''

    def end_js(cid, dur):
        return (S.pop(cid, "face", 0.10, scale=1.12, dur=0.5)
                + S.rise(cid, "name", 0.40, dy=18, dur=0.42)
                + S.rise(cid, "brk", 0.62, dy=12, dur=0.36)
                + S.pop(cid, "tel", 0.95, scale=1.15, dur=0.42)
                + S.rise(cid, "site", 1.30, dy=12, dur=0.36))

    # ── assemble ───────────────────────────────────────────────────────────
    scenes, subs = [], []
    scenes.append(Scene("s0-open", 0.0, OPEN, open_html, open_js, lines=(0,)))
    subs.append(Sub(0.0, OPEN, hook.get("text", hook.get("say", "")), say=hook.get("say", "")))
    at = OPEN - B.X
    scenes.append(Scene("s1-meet", at, MEET, meet_html, meet_js, lines=(1,)))
    subs.append(Sub(at, at + MEET, meet.get("text", meet.get("say", "")), say=meet.get("say", "")))
    at = round(at + MEET - B.X, 2)
    for i, h in enumerate(homes):
        html, js = home_beat(i, h)
        scenes.append(Scene(f"s{i + 2}-home{i}", at, HOME, html, js, lines=(len(subs),)))
        subs.append(Sub(at, at + HOME, h.get("text", h["say"]), say=h["say"]))
        at = round(at + HOME - B.X, 2)
    scenes.append(Scene("sz-end", at, END, end_html, end_js, lines=(len(subs),)))
    subs.append(Sub(at, at + END, d.get("close_text", f"{phone} · {site}"), say=d.get("say_close", "")))
    total = round(at + END, 2)

    return Video(
        slug="realtor-showcase",
        title=f"REALTOR SHOWCASE — {name}",
        total=total,
        size=B.SIZES["9x16"],
        scenes=scenes,
        subs=subs,
        vo_lines=[B.for_tts(s.spoken) for s in subs],
        assets=assets,
        audio=[
            Audio("public/vo.wav", "voiceover", 0.40, total - 0.40, volume=0.80, fade_in=0.05, fade_out=0.20),
            Audio("public/bed.wav", "music", 0.00, total, volume=0.26, fade_in=0.4, fade_out=1.4),
        ],
        captions=False,
        note="Agent's own listing photos and portrait only; brokerage named in text, no logo.",
    )
