"""DEAL PROMO — one member's coupon or special, as a commercial.

    python3 _kit/make.py deal-promo --auto --id 175
    python3 _kit/make.py deal-promo --auto --id 175 --merge "$(cat out/<project>/curation.json)"

The deal row is the script: the title, what is included and the terms are
printed as the owner wrote them, and the calendar (which weekday it ends, how
many days are left) is computed by ``data.mjs deal`` in Pacific time. The
business row carries the identity: name, address, phone, logo, photos.

Shape — cold open on the hook, the offer, who they are, the gift line, the
coupon card, the end card:

    s0-open      "{daysLeft} DAYS LEFT" + the discount, over one shot, painted at t=0
    s1..sN       beats: {media, chip, title, sub?, say, cap?, zoom?, brightness?, kind?}
                 kind "photo" (default) — chip + headline over one of their photos
                 kind "review" — a rating big, then one public review with its credit,
                                 over one of their photos
    sc-coupon    designed card: chip, the deal title, what is included, the terms
                 verbatim, "Ends <weekday>" — no footage
    sz-end       their logo, phone, street and page, over one of their photos dimmed

Data contract (``data.mjs deal --id=<n>`` produces the first block; ``--merge``
adds the curation):

    name, slug, street, phone, site, logo, photos           the business
    deal: {title, description, discount, terms,
           endsWeekday, daysLeft, views}                    the deal row
    clips        [path, ...]           optional generated b-roll, staged as clip-<i>
    open         {media, big?, title?, chip?, say?, cap?, zoom?, brightness?, position?, origin?}
    beats        [...]                 see above; defaults to one offer beat from the row
    coupon       {chip?, included?, note?, say?, cap?}
    end_photo    "photo-6"             behind the end card, dimmed
    say_close    what the voice reads over the end card

Two rules this format keeps:

* A named business shown with a photo means it is THEIR photo. The opener's
  chip, every beat and the end card use `photos` and `logo` from their own
  profile. A generated clip is atmosphere only — it never carries the
  business name in a chip, and is never captioned as their piece.
* The coupon card prints the terms exactly as the deal row has them. Tighter
  wording is allowed elsewhere; softer wording is not.
"""
import html as _html
import re as _re

from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _chip, _clip_len, _exit, _media_src, _pick, _video_layers

REQUIRED = ("name", "street", "phone", "site", "deal")

FIELD = f"radial-gradient(ellipse 90% 70% at 50% 38%, #7d1590 0%, {B.PURPLE} 45%, #3a0743 100%)"

# Rough lengths before the read re-times them (silent preview builds only).
OPEN, BEAT, COUPON, END = 3.8, 4.2, 5.0, 5.2


def _assets(d: dict) -> dict:
    a = {}
    if d.get("logo"):
        a["logo.png"] = d["logo"]
    for i, p in enumerate(d.get("photos") or []):
        a[f"photo-{i}.jpg"] = p
    for i, c in enumerate(d.get("clips") or []):
        a[f"clip-{i}.mp4"] = c
    return a


def _esc(s: str) -> str:
    return _html.escape(s or "", quote=False)


def _plain(markup: str) -> str:
    """A headline as the viewer reads it, so a caption that repeats it is dropped.

    Dedupe compares the caption string against the frame's text with tags
    stripped; a title broken with <br /> has to be handed over the same way.
    """
    return " ".join(_re.sub(r"<[^>]+>", " ", markup or "").split())


def _css(cid: str, size) -> str:
    g = B.geom(size)
    s = f'[data-composition-id="{cid}"]'
    tall = g["h"] > 1400
    return f"""
      {s} .field {{ position:absolute; inset:0; background:{FIELD}; }}
      {s} .bloom {{ position:absolute; left:50%; top:40%; width:1100px; height:1100px; margin-left:-550px; margin-top:-550px; border-radius:50%; background:radial-gradient(circle, rgba(239,198,24,0.16), rgba(239,198,24,0) 60%); opacity:0; }}
      {s} .block {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36; }}
      {s} .centre {{ position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:{"16%" if tall else "10%"}; z-index:36; text-align:center; }}
      {s} .big {{ display:block; color:{B.GOLD}; font-weight:800; line-height:0.9; letter-spacing:-6px; text-shadow:0 10px 40px rgba(10,6,12,0.5); }}
      {s} .title {{ display:block; color:#fff; font-weight:800; line-height:1.04; letter-spacing:-2px; text-shadow:0 8px 34px rgba(10,6,12,0.6); }}
      {s} .sub {{ display:block; color:rgba(255,255,255,0.88); font-weight:600; line-height:1.25; letter-spacing:0; }}
      {s} .card {{ display:block; background:rgba(20,10,23,0.62); border:2px solid rgba(239,198,24,0.35); border-radius:26px; padding:{"30px 38px" if tall else "20px 30px"}; box-shadow:0 24px 60px rgba(10,6,12,0.5); text-align:left; }}
      {s} .cardchip {{ display:inline-block; background:{B.GREEN}; color:#fff; font-weight:800; font-size:30px; letter-spacing:4px; padding:12px 26px; border-radius:10px; text-transform:uppercase; }}
    """


def _styled(html):
    return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)


def _art(cid, assets, key, dur, at, grade):
    src, kind = _media_src(assets, key)
    if kind == "video":
        return _video_layers(cid, src, dur, at, _clip_len(assets, key), grade)
    return f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{grade}" data-layout-allow-overflow />'


def _default_beats(d: dict) -> list:
    """One offer beat straight from the row, for a preview build with no curation."""
    deal = d["deal"]
    desc = " ".join((deal.get("description") or "").split())
    if len(desc) > 150:
        desc = desc[:147].rsplit(" ", 1)[0] + "…"
    photos = d.get("photos") or []
    return [{"media": "photo-1" if len(photos) > 1 else "photo-0",
             "chip": "The offer", "title": deal["title"], "sub": desc,
             "say": f"{deal['title']}. {desc}"}]


def build(d: dict) -> Video:
    missing = [k for k in REQUIRED if not d.get(k)]
    if missing:
        raise ValueError(f"deal_promo needs {missing}; got {sorted(d)}")
    deal = d["deal"]
    name = d.get("display_name") or d["name"]
    street, phone, site = d["street"], d["phone"], d["site"]
    city = d.get("city", "Lompoc")
    assets = _assets(d)
    if not any(k.startswith("photo-") for k in assets):
        raise ValueError("deal_promo needs at least one of the member's own photos")
    when = deal.get("endsWeekday") or ""
    ends = f"Ends {when}" if when else ""
    days = deal.get("daysLeft")

    scenes, subs = [], []

    def add(cid, dur, html, js, say, cap):
        scenes.append(Scene(cid, 0.0, dur, _styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, cap, say=say))

    # ── cold open: the hook, painted at t=0 because frame 0 is the thumbnail ──
    op = dict(d.get("open") or {})
    op.setdefault("media", "photo-0")
    op.setdefault("big", f"{days} DAYS LEFT" if days and days > 1 else ("LAST DAY" if days == 1 else ends.upper()))
    op.setdefault("title", (deal.get("discount") or deal["title"]).lower().capitalize())
    op_src, op_kind = _media_src(assets, op["media"])
    # A generated clip never carries the business name: the chip only goes on
    # their own photo. On a clip the opener is offer-only and the name waits
    # for the first beat, which is theirs.
    op_chip = op.get("chip", name if op_kind == "image" else "")
    if op_kind == "video" and op_chip:
        raise ValueError("open.chip on a generated clip would caption it as theirs; drop it or use a photo")

    def open_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        pos = _pick(op.get("position"), size, "50% 50%")
        art = _art(cid, assets, op["media"], dur, op.get("at", 0.0),
                   f'filter:brightness({op.get("brightness", 0.82)}) saturate(1.08); object-position:{pos}')
        chip_top, chip_in = _chip(cid, g, _esc(op_chip))
        chip_top, chip_in = chip_top.replace("opacity:0", "opacity:1"), chip_in.replace("opacity:0", "opacity:1")
        return f'''{art}
      <div class="scrim"></div>
      {chip_top}
      <div class="block">
        {chip_in}<span class="big" id="{cid}-big" style="font-size:{op.get("size", 176 if tall else 132)}px">{op["big"]}</span>
        <span class="title" id="{cid}-small" style="margin-top:22px; font-size:{72 if tall else 56}px">{op["title"]}</span>
      </div>'''

    def open_js(cid, dur, size=None):
        z = _pick(op.get("zoom"), size, [1.0, 1.08])
        org = _pick(op.get("origin"), size, "50% 50%")
        return (f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, duration:{dur:.2f}, ease:"none", transformOrigin:"{org}" }}, 0);'
                f'tl.fromTo("#{cid}-big", {{ scale:1.06 }}, {{ scale:1, duration:1.2, ease:"power3.out", transformOrigin:"0% 100%" }}, 0);'
                f'tl.fromTo("#{cid}-small", {{ y:12 }}, {{ y:0, duration:0.9, ease:"power2.out" }}, 0);'
                + _exit(cid, dur, (("chip",) if op_chip else ()) + ("big", "small")))

    say_open = op.get("say", f"{op['big'].capitalize()}. {op['title']}, at {d.get('say_name', name)}.")
    add("s0-open", OPEN, open_html, open_js, say_open, op.get("cap", op["big"]))

    # ── beats: over their photos (or a clip, offer beats only) ────────────
    def photo_beat(bt):
        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            src, kind = _media_src(assets, bt["media"])
            lit = bt.get("brightness", 1.0 if kind == "video" else 0.84)
            pos = _pick(bt.get("position"), size, "50% 50%")
            art = _art(cid, assets, bt["media"], dur, bt.get("at", 0.0),
                       f'filter:brightness({lit}) saturate({bt.get("saturate", 1.08)}); object-position:{pos}')
            chip_top, chip_in = _chip(cid, g, _esc(bt.get("chip", "")))
            sub = (f'<span class="sub" id="{cid}-sub" style="margin-top:20px; font-size:{bt.get("sub_size", 40 if tall else 34)}px; opacity:0">{bt["sub"]}</span>'
                   if bt.get("sub") else "")
            return f'''{art}
      <div class="scrim"></div>
      {chip_top}
      <div class="block">
        {chip_in}<span class="title" id="{cid}-t" style="font-size:{bt.get("size", 84 if tall else 66)}px; opacity:0">{bt["title"]}</span>{sub}
      </div>'''

        def js(cid, dur, size=None):
            z = _pick(bt.get("zoom"), size, [1.0, 1.07])
            org = _pick(bt.get("origin"), size, "50% 50%")
            out = f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, duration:{dur:.2f}, ease:"none", transformOrigin:"{org}" }}, 0);'
            els = []
            if bt.get("chip"):
                out += S.rise(cid, "chip", 0.10, dy=12, dur=0.34); els.append("chip")
            out += S.rise(cid, "t", 0.26, dy=22, dur=0.46); els.append("t")
            if bt.get("sub"):
                out += S.rise(cid, "sub", 0.62, dy=12, dur=0.36); els.append("sub")
            return out + _exit(cid, dur, tuple(els))
        return html, js

    def review_beat(bt):
        """The rating big, one public review, its credit — over THEIR photo.

        A review is about the business, so it may sit on the business's own
        photo; it never sits on a generated clip.
        """
        src, kind = _media_src(assets, bt["media"])
        if kind == "video":
            raise ValueError(f"review beat on {bt['media']}: a review sits on their photo, never on a clip")

        def html(cid, dur, size):
            g = B.geom(size)
            tall = g["h"] > 1400
            pos = _pick(bt.get("position"), size, "50% 50%")
            art = _art(cid, assets, bt["media"], dur, 0.0,
                       f'filter:brightness({bt.get("brightness", 0.62)}) saturate(1.02); object-position:{pos}')
            chip_top, chip_in = _chip(cid, g, _esc(bt.get("chip", "On Google")))
            return f'''{art}
      <div class="scrim"></div>
      {chip_top}
      <div class="block">
        {chip_in}<span class="big" id="{cid}-big" style="font-size:{bt.get("size", 150 if tall else 112)}px; line-height:1.0; letter-spacing:-5px; opacity:0">{bt["big"]}</span>
        <span class="title" id="{cid}-t" style="margin-top:{22 if tall else 14}px; font-size:{52 if tall else 42}px; opacity:0">{bt["title"]}</span>
        <span class="sub" id="{cid}-q" style="margin-top:{34 if tall else 22}px; font-size:{bt.get("quote_size", 46 if tall else 36)}px; font-style:italic; color:#fff; opacity:0">&ldquo;{bt["quote"]}&rdquo;</span>
        <span class="sub" id="{cid}-c" style="margin-top:14px; font-size:{30 if tall else 24}px; color:rgba(255,255,255,0.7); letter-spacing:1px; opacity:0">&mdash; {bt["credit"]}</span>
      </div>'''

        def js(cid, dur, size=None):
            z = _pick(bt.get("zoom"), size, [1.0, 1.06])
            return (f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
                    + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
                    + S.pop(cid, "big", 0.22, scale=1.25, dur=0.38)
                    + S.rise(cid, "t", 0.58, dy=16, dur=0.40)
                    + S.rise(cid, "q", 0.95, dy=16, dur=0.44)
                    + S.rise(cid, "c", 1.25, dy=8, dur=0.30)
                    + _exit(cid, dur, ("chip", "big", "t", "q", "c")))
        return html, js

    KINDS = {"photo": photo_beat, "review": review_beat}
    beats = d.get("beats") or _default_beats(d)
    for i, bt in enumerate(beats):
        kind = bt.get("kind", "photo")
        if kind not in KINDS:
            raise ValueError(f"beat {i}: unknown kind {kind!r}; have {sorted(KINDS)}")
        html, js = KINDS[kind](bt)
        add(f"s{i + 1}-{bt['media']}", BEAT, html, js, bt["say"], bt.get("cap", _plain(bt["title"])))

    # ── the coupon card: the row, verbatim, on the house field ─────────────
    cp = dict(d.get("coupon") or {})
    n = len(beats) + 1

    def coupon_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        included = (f'<span class="sub" id="{cid}-inc" style="margin-top:{26 if tall else 16}px; font-size:{40 if tall else 32}px; opacity:0">{cp["included"]}</span>'
                    if cp.get("included") else "")
        note = (f'<span class="sub" id="{cid}-note" style="margin-top:{16 if tall else 10}px; font-size:{32 if tall else 26}px; color:{B.GOLD}; opacity:0">{cp["note"]}</span>'
                if cp.get("note") else "")
        return f'''<div class="field"></div>
      <div class="bloom" id="{cid}-bloom" data-layout-allow-overflow></div>
      <div class="centre" style="top:{"14%" if tall else "8%"}">
        <span class="cardchip" id="{cid}-chip" style="opacity:0">{_esc(cp.get("chip", f"Coupon · {ends}" if ends else "Coupon"))}</span>
        <span class="title" id="{cid}-t" style="margin-top:{30 if tall else 18}px; font-size:{cp.get("size", 96 if tall else 72)}px; opacity:0">{_esc(deal["title"])}</span>
        {included}{note}
        <div id="{cid}-terms" class="card" style="margin-top:{34 if tall else 20}px; opacity:0">
          <span class="sub" style="font-size:{34 if tall else 28}px; color:rgba(255,255,255,0.92)">{_esc(deal.get("terms") or "")}</span>
        </div>
        <span class="pill" id="{cid}-ends" style="margin-top:{36 if tall else 22}px; opacity:0; box-shadow:0 16px 40px rgba(10,6,12,0.4)">{_esc(cp.get("pill", ends or "Show this coupon in-store"))}</span>
      </div>'''

    def coupon_js(cid, dur, size=None):
        out = (f'tl.fromTo("#{cid}-bloom", {{ autoAlpha:0, scale:0.6 }}, {{ autoAlpha:1, scale:1, duration:0.9, ease:"power2.out" }}, 0.05);'
               + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
               + S.pop(cid, "t", 0.24, scale=1.18, dur=0.42))
        at, els = 0.60, ["chip", "t"]
        if cp.get("included"):
            out += S.rise(cid, "inc", at, dy=14, dur=0.38); els.append("inc"); at += 0.28
        if cp.get("note"):
            out += S.rise(cid, "note", at, dy=10, dur=0.34); els.append("note"); at += 0.24
        out += S.rise(cid, "terms", at + 0.05, dy=18, dur=0.44); els.append("terms")
        out += f'tl.fromTo("#{cid}-ends", {{ autoAlpha:0, y:18, scale:0.94 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.5, ease:"back.out(1.5)" }}, {at + 0.45:.2f});'
        els.append("ends")
        return out + _exit(cid, dur, tuple(els))

    add(f"s{n}-coupon", COUPON, coupon_html, coupon_js,
        cp.get("say", f"Show this coupon in-store. {ends}." if ends else "Show this coupon in-store."),
        cp.get("cap", "Show this coupon in-store"))
    n += 1

    # ── end card: their logo, their phone, their street, their page ────────
    end_media = d.get("end_photo")

    def end_html(cid, dur, size):
        g = B.geom(size)
        tall = g["h"] > 1400
        bg = ""
        if end_media:
            src, kind = _media_src(assets, end_media)
            if kind == "video":
                raise ValueError("end_photo must be one of their photos, never a clip")
            pos = _pick(d.get("end_position"), size, "50% 50%")
            bg = f'<img class="cover" src="{src}" alt="" style="filter:brightness(0.36) saturate(0.7); object-position:{pos}" />'
        logo = (f'<div id="{cid}-card" style="display:inline-block; background:#fff; border-radius:28px; padding:{"34px 44px" if tall else "24px 34px"}; '
                f'box-shadow:0 22px 60px rgba(0,0,0,0.45); opacity:0">'
                f'<img src="public/logo.png" alt="" style="width:{d.get("logo_width", 520 if tall else 420)}px; height:auto; display:block" /></div>'
                if d.get("logo") else
                f'<span class="title" id="{cid}-card" style="font-size:{96 if tall else 72}px; opacity:0">{_esc(name)}</span>')
        contact = (
            f'<div style="margin-top:{44 if tall else 28}px"><span class="pill" id="{cid}-tel" style="opacity:0">{_esc(phone)}</span></div>'
            f'<span class="title" id="{cid}-addr" style="margin-top:{34 if tall else 20}px; font-size:{52 if tall else 44}px; letter-spacing:-1px; opacity:0">{_esc(street)} · {_esc(d.get("area", city))}</span>'
            f'<span class="sub" id="{cid}-site" style="margin-top:{26 if tall else 16}px; font-size:{38 if tall else 32}px; opacity:0">{_esc(site)}</span>'
        )
        if not g["wide"]:
            block = f'<div class="centre" style="top:24%">{logo}{contact}</div>'
        else:
            block = (f'<div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:50%; transform:translateY(-50%); '
                     f'z-index:36; display:flex; align-items:center; justify-content:center; gap:96px">'
                     f'<div>{logo}</div><div style="text-align:left">{contact}</div></div>')
        return f'''{bg}
      <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(101,12,117,0.82) 0%, rgba(26,5,32,0.94) 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:8%; height:2px; z-index:20; background:linear-gradient(90deg, transparent, {B.GOLD}, transparent); opacity:0.5"></div>
      {block}'''

    def end_js(cid, dur, size=None):
        return (S.pop(cid, "card", 0.12, scale=1.10, dur=0.46)
                + S.rise(cid, "tel", 0.62, dy=16, dur=0.40)
                + S.rise(cid, "addr", 0.98, dy=14, dur=0.36)
                + S.rise(cid, "site", 1.28, dy=10, dur=0.34))

    add(f"s{n}-end", END, end_html, end_js,
        d.get("say_close", f"{d.get('say_name', name)}, {d.get('say_street', street)}, {city}. "
                           f"Or find them on {B.spoken_url(site)}."),
        phone)

    # Lay the scenes end to end for a silent preview; the read re-times them.
    # The captions sit on their scene's span too, so dedupe compares each one
    # against its own frame even before there is a voice to time it to.
    at = 0.0
    for sc, sub in zip(scenes, subs):
        sc.start = round(at, 2)
        sub.start, sub.end = sc.start, round(sc.start + sc.dur, 2)
        at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)

    return Video(
        slug=d.get("out_slug") or f"deal-{deal.get('id', 'promo')}-{d.get('slug', 'member')}",
        title=f"DEAL PROMO — {name}: {deal['title']} ({ends or 'no end date'})",
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
        note=(f"Deal {deal.get('id')}: title and terms printed verbatim from the row; ends {when or '?'} "
              f"({days} day(s) left as of {deal.get('today')}). Identity beats use the member's own photos "
              f"and logo; any generated clip is atmosphere and carries no business name."),
    )
