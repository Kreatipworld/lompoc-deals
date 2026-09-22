"""MEMBER SPOTLIGHT — one paying member, told with their own assets.

The next spotlight is one command:

    python3 _kit/make.py member-spotlight --auto --slug <business-slug>

Everything the video states comes from the business row, so a spotlight can
never claim something the profile does not already say.

Data contract (``data.mjs member`` produces all of it):

    name, street, phone, site                required
    logo                                     URL or local path; staged as public/logo.png
    photos          [url, ...]               the member's OWN photos, cover first
    services        ["tires", "brakes", ...] parsed from the description
    clips           [path, ...]              optional generated b-roll, service beats only
    beats           [{chip,title,sub,media,zoom,brightness}]  optional; derived from
                                             services when absent. `zoom` sets the push-in
                                             start and end scale, which is how two beats shot
                                             in the same dim bay are told apart: one macro,
                                             one at arm's length.
    quote           {"text", "chip", "brightness", "zoom", "origin", "position"}
                                             optional; something they wrote themselves, over a
                                             photo the crop keys can be aimed the same way the
                                             opener's can
    opener          "logo" | "photo-1" | ...  defaults to "logo" when a logo exists
    opener_position "41% 50%"                which part of the photo the 9:16 crop keeps
    opener_zoom     [1.10, 1.14]             push-in, start and end scale
    opener_origin   "50% 42%"                the point the push holds still
    opener_name     false                    drop the printed name — for a photo of
                                             their sign, which already says it
    closer          {chip,title,sub,media}   optional hero shot of what they sell, last
                                             thing before the contact card

`media` names a staged asset without its extension — "photo-2", "clip-0" — so a
beat can be moved from a photo to a clip without touching anything else.

Two rules this format exists to keep, both from the standing accuracy note:

* A named business shown with a photo means it is THEIR photo. So the identity
  beats — who they are, where they are, the contact card — only ever use
  `photos` and `logo`, which come out of their own profile.
* Generated footage is generic service b-roll and nothing else. It illustrates
  what a service looks like; it never stands in for their premises, their
  people or their signage. `clips` are therefore only ever reachable from a
  service beat, never from the opener or the end card.
"""
import os
import subprocess

from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video

REQUIRED = ("name", "street", "phone", "site")

# _kit/formats -> _kit -> video -> social -> content -> repo root
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), *([".."] * 5)))

# Beat lengths before the read re-times them. time_to_read() overwrites these
# from the measured voiceover; they only matter for a silent preview build.
OPEN = 4.20
BEAT = 3.60
END = 5.40


def _assets(d: dict) -> dict:
    """Staged public/ filename -> where make.py should fetch it from."""
    a = {}
    if d.get("logo"):
        a["logo.png"] = d["logo"]
    for i, p in enumerate(d.get("photos") or []):
        a[f"photo-{i}.jpg"] = p
    for i, c in enumerate(d.get("clips") or []):
        a[f"clip-{i}.mp4"] = c
    return a


def _media_src(assets: dict, key: str) -> tuple:
    """"photo-2" -> ("public/photo-2.jpg", "image")."""
    for name in assets:
        if name.rsplit(".", 1)[0] == key:
            kind = "video" if name.endswith(".mp4") else "image"
            return f"public/{name}", kind
    raise ValueError(f"beat media {key!r} is not a staged asset; have {sorted(assets)}")


def _clip_len(assets: dict, key: str) -> float:
    """How long the source clip actually is, so a beat never outruns it.

    The scenes are sized by the voiceover, and a sentence is often longer than
    a four-second generated shot. Without this the video element simply stops
    and the beat finishes on a frozen frame.
    """
    src = assets.get(f"{key}.mp4")
    if not src or str(src).startswith(("http://", "https://")):
        return 0.0
    path = src if os.path.isabs(src) else os.path.join(REPO, src)
    if not os.path.exists(path):
        return 0.0
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


# Below this, motion starts to judder and the slow-down becomes the thing you
# notice. A beat that would need less than this has to be shortened instead.
MIN_RATE = 0.75


def _video_layers(cid: str, src: str, dur: float, at: float, length: float, style: str) -> str:
    """One <video> for the beat, slowed to fit when the sentence outlasts the shot.

    Never two. Scenes are sized by the voiceover, so a sentence is routinely
    longer than a four-second generated shot. Laying a second copy end to end
    covers the gap but *replays* it: the camera snaps back to its opening
    framing part-way through the beat and starts the same push again. That
    reads as a mistake — worse than the frozen last frame it was meant to
    avoid, and invisible to `hyperframes check`, which has no opinion about a
    shot repeating. A constant playback rate is one continuous take.
    """
    def tag(rate: float = 0.0) -> str:
        r = f' data-playback-rate="{rate:.4f}"' if rate else ""
        return (f'<video id="{cid}-bg" class="clip" src="{src}" data-start="0" '
                f'data-media-start="{at:.2f}" data-duration="{dur:.2f}" data-track-index="0"'
                f'{r} muted playsinline style="{style}"></video>')

    if length <= 0:
        return tag()
    available = length - at
    if dur <= available + 0.05:
        return tag()
    rate = available / dur
    if rate < MIN_RATE:
        raise ValueError(
            f"{cid}: the beat runs {dur:.2f}s but only {available:.2f}s of footage is left "
            f"(clip {length:.2f}s, entered at {at:.2f}s). Filling it would need "
            f"{rate:.2f}x playback, under the {MIN_RATE:.2f} floor where the motion starts to "
            f"judder. Shorten this beat's spoken line, enter the clip earlier, or use a longer "
            f"clip. Do not replay the shot.")
    return tag(rate)


def _pick(value, size, default):
    """A crop value that may be one setting, or one setting per frame shape.

    A photo cropped for a 1080x1920 phone frame is the wrong crop for a 16:9
    letterbox — the subject sits somewhere else and a different amount of it
    fits. So every crop key takes either a plain value or a dict keyed by
    ratio name: {"9x16": [1.10, 1.14], "16x9": [1.0, 1.05]}.
    """
    if value is None:
        return default
    if isinstance(value, dict):
        return value.get(B.ratio_name(size), value.get("default", default))
    return value


def _chip(cid: str, g: dict, label: str) -> tuple:
    """(top-corner chip, in-block chip) — only one of them is ever non-empty.

    A tall frame has room for a chip in the top corner above the art. A wide
    one does not: the subject fills the frame edge to edge, and a chip up there
    lands on it. Landscape gets a proper lower third instead, the chip sitting
    directly above the headline it labels.
    """
    if not label:
        return "", ""
    span = f'<span class="chip" id="{cid}-chip" style="opacity:0">{label}</span>'
    if g["wide"]:
        return "", f'<div style="margin-bottom:24px">{span}</div>'
    return (f'<div style="position:absolute; left:{g["side"]}px; top:16%; z-index:36">{span}</div>', "")


def _exit(cid: str, dur: float, els: tuple) -> str:
    """Clear a scene's own text just before the crossfade to the next one.

    Without this the outgoing chip and the incoming chip dissolve through each
    other in the same corner for a fifth of a second, which reads as a smudge
    and is what `hyperframes check` reports as a content overlap. The imagery
    still cross-dissolves; only the words hand over cleanly.
    """
    at = max(0.6, dur - B.X - 0.10)
    return "".join(S.out(cid, el, at, dur=0.20) for el in els)


def _auto_beats(d: dict) -> list:
    """Service beats from the parsed description, over the member's own photos.

    `--auto` has no generated b-roll, so every beat falls back to a photo the
    member uploaded. Pairs of services per beat keeps the line short enough to
    read on a phone.
    """
    svc = [s for s in (d.get("services") or []) if s]
    if not svc:
        return []
    # Photo 0 opens the video; the rest carry the beats, cycling if there are few.
    pool = [f"photo-{i}" for i in range(1, len(d.get("photos") or []))] or ["photo-0"]
    groups = [svc[i:i + 2] for i in range(0, len(svc), 2)][:4]
    return [
        {"chip": g[0].upper(), "title": " · ".join(s.capitalize() for s in g),
         "media": pool[i % len(pool)]}
        for i, g in enumerate(groups)
    ]


def build(d: dict) -> Video:
    missing = [k for k in REQUIRED if not d.get(k)]
    if missing:
        raise ValueError(f"member_spotlight needs {missing}; got {sorted(d)}")

    name = d.get("display_name") or d["name"]
    street, phone, site = d["street"], d["phone"], d["site"]
    city = d.get("city", "Lompoc")
    assets = _assets(d)
    beats = d.get("beats") or _auto_beats(d)
    if not beats:
        raise ValueError("member_spotlight needs beats or a parseable description")
    quote = d.get("quote")
    closer = d.get("closer")
    tagline = d.get("tagline", "A Lompoc Locals member")

    # Frame 0 is the thumbnail, and in a feed grid it is the whole pitch. A
    # member's wordmark reads at that size; a wide photo of their street on an
    # overcast day does not. So the logo card is the default opener whenever
    # there is a logo, and their photos do their real job — proof — later.
    opener_media = d.get("opener") or ("logo" if d.get("logo") else "photo-0")
    # A photo of their own signage is the strongest possible opener, but only if
    # the crop is aimed at it: a 3:4 photo dropped into a 9:16 frame hands a
    # third of the picture to sky and lawn.
    o_pos = d.get("opener_position", "50% 50%")
    o_zoom = d.get("opener_zoom", [1.16, 1.26])
    o_origin = d.get("opener_origin", "50% 62%")
    o_bright = d.get("opener_brightness", 0.92)
    # Never print the business name over a photograph of the business name.
    o_name = d.get("opener_name", True)
    end_media = d.get("end_photo")

    # ── opener A: the member's wordmark, as a built card ──────────────────
    def logo_opener(cid, dur, size):
        return f'''<div style="position:absolute; inset:0; background:
        radial-gradient(ellipse 78% 52% at 50% 36%, #7d1594 0%, #43084f 46%, {B.BG} 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:8%; height:2px; z-index:20; background:linear-gradient(90deg, transparent, {B.GOLD}, transparent); opacity:0.5"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:27%; z-index:36; text-align:center">
        <div id="{cid}-card" style="display:inline-block; background:#fff; border-radius:34px; padding:46px 52px; box-shadow:0 30px 80px rgba(0,0,0,0.55); opacity:1">
          <img src="public/logo.png" alt="" style="width:740px; height:auto; display:block" />
        </div>
        <span class="chip" id="{cid}-chip" style="margin-top:52px; opacity:1">{tagline}</span>
        <span id="{cid}-addr" style="display:block; margin-top:34px; color:#fff; font-weight:800; font-size:58px; letter-spacing:-1px; opacity:1">{street} · {city}</span>
      </div>'''

    def logo_opener_js(cid, dur):
        # Everything is already painted at t=0 — the thumbnail is this exact
        # card — so the open is a slow settle, never a fade up from nothing.
        return (f'tl.fromTo("#{cid}-card", {{ scale:1.045 }}, {{ scale:1, duration:1.60, ease:"power2.out" }}, 0);'
                + f'tl.fromTo("#{cid}-addr", {{ y:10 }}, {{ y:0, duration:0.90, ease:"power2.out" }}, 0);'
                + _exit(cid, dur, ("card", "chip", "addr")))

    # ── opener B: one of their photos, with their address ─────────────────
    def opener(cid, dur, size):
        g = B.geom(size)
        src, kind = _media_src(assets, opener_media)
        pos = _pick(o_pos, size, "50% 50%")
        style = f"filter:brightness({o_bright}) saturate(1.06); object-position:{pos}"
        art = (_video_layers(cid, src, dur, 0.0, _clip_len(assets, opener_media), style)
               if kind == "video" else
               f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{style}" '
               f'data-layout-allow-overflow />')
        title = (f'<span class="hero" id="{cid}-h1" style="font-size:112px; opacity:1">{name}</span>'
                 if o_name else "")
        ochip_top, ochip_in = _chip(cid, g, tagline)
        # Frame 0 is the thumbnail, so the opener's chip is painted, not faded.
        ochip_top = ochip_top.replace('opacity:0', 'opacity:1')
        ochip_in = ochip_in.replace('opacity:0', 'opacity:1')
        gap = "26px" if o_name else "0px"
        return f'''{art}
      <div class="scrim"></div>
      {ochip_top}
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36">
        {ochip_in}{title}
        <span id="{cid}-h2" style="display:block; margin-top:{gap}; color:{B.GOLD}; font-weight:800; font-size:62px; letter-spacing:-1px; opacity:1">{street} · {city}</span>
      </div>'''

    def opener_js(cid, dur, size=None):
        # Frame 0 is the thumbnail: the photo and the name are already painted,
        # so only the slow push and the second line are animated.
        z = _pick(o_zoom, size, [1.16, 1.26])
        org = _pick(o_origin, size, "50% 62%")
        js = (f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, '
              f'duration:{dur:.2f}, ease:"none", transformOrigin:"{org}" }}, 0);')
        els = ["chip", "h2"]
        if o_name:
            js += (f'tl.fromTo("#{cid}-h1", {{ scale:1.05 }}, {{ scale:1, duration:1.30, '
                   f'ease:"power2.out", transformOrigin:"0% 100%" }}, 0);')
            els.insert(1, "h1")
        # Nothing fades up: frame 0 is the finished composition. The address
        # settles into place instead.
        js += f'tl.fromTo("#{cid}-h2", {{ y:14 }}, {{ y:0, duration:0.85, ease:"power2.out" }}, 0);'
        return js + _exit(cid, dur, tuple(els))

    # ── service beats: generated b-roll or their photos ───────────────────
    def beat_html(beat):
        def html(cid, dur, size):
            g = B.geom(size)
            src, kind = _media_src(assets, beat["media"])
            # A photo carries its own exposure and needs pulling down under the
            # text; generated footage comes back flat and does not.
            lit = beat.get("brightness", 1.0 if kind == "video" else 0.86)
            grade = f'filter:brightness({lit}) saturate({beat.get("saturate", 1.08)})'
            art = (_video_layers(cid, src, dur, beat.get("at", 0.0), _clip_len(assets, beat["media"]), grade)
                   if kind == "video" else
                   f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{grade}" />')
            sub = (f'<span id="{cid}-sub" style="display:block; margin-top:22px; color:rgba(255,255,255,0.86); '
                   f'font-weight:600; font-size:40px; letter-spacing:0; opacity:0">{beat["sub"]}</span>'
                   if beat.get("sub") else "")
            chip_top, chip_in = _chip(cid, g, beat.get("chip", ""))
            return f'''{art}
      <div class="scrim"></div>
      {chip_top}
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36">
        {chip_in}<span class="hero" id="{cid}-t" style="font-size:{beat.get("size", 84)}px; letter-spacing:-2px; opacity:0">{beat["title"]}</span>{sub}
      </div>'''

        def js(cid, dur, size=None):
            z = _pick(beat.get("zoom"), size, [1.0, 1.07])
            out = (f'tl.fromTo("#{cid}-bg", {{ scale:{z[0]} }}, {{ scale:{z[1]}, '
                   f'duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);')
            if beat.get("chip"):
                out += S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
            out += S.rise(cid, "t", 0.26, dy=22, dur=0.46)
            if beat.get("sub"):
                out += S.rise(cid, "sub", 0.58, dy=12, dur=0.36)
            els = (("chip",) if beat.get("chip") else ()) + ("t",) + (("sub",) if beat.get("sub") else ())
            return out + _exit(cid, dur, els)

        return html, js

    # ── their own words, on their own photo ───────────────────────────────
    def quote_html(cid, dur, size):
        g = B.geom(size)
        src, kind = _media_src(assets, quote["media"])
        qstyle = (f'filter:brightness({quote.get("brightness", 0.80)}) saturate(1.06); '
                  f'object-position:{_pick(quote.get("position"), size, "50% 50%")}')
        qchip_top, qchip_in = _chip(cid, g, quote.get("chip", "In their own words"))
        art = (_video_layers(cid, src, dur, 0.0, _clip_len(assets, quote["media"]), qstyle)
               if kind == "video" else
               f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="{qstyle}" '
               f'data-layout-allow-overflow />')
        return f'''{art}
      <div class="scrim"></div>
      {qchip_top}
      <div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; bottom:{g["scene_bottom_pct"]}%; z-index:36">
        {qchip_in}<span class="hero" id="{cid}-q" style="font-size:92px; letter-spacing:-2px; opacity:0">&ldquo;{quote["text"]}&rdquo;</span>
        <span id="{cid}-a" style="display:block; margin-top:24px; color:rgba(255,255,255,0.72); font-weight:600; font-size:34px; opacity:0">&mdash; {name}</span>
      </div>'''

    def quote_js(cid, dur, size=None):
        qz = _pick(quote.get("zoom"), size, [1.0, 1.06])
        qo = _pick(quote.get("origin"), size, "50% 50%")
        return (f'tl.fromTo("#{cid}-bg", {{ scale:{qz[0]} }}, {{ scale:{qz[1]}, duration:{dur:.2f}, '
                f'ease:"none", transformOrigin:"{qo}" }}, 0);'
                + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
                + S.rise(cid, "q", 0.24, dy=24, dur=0.50)
                + S.rise(cid, "a", 0.80, dy=10, dur=0.34)
                + _exit(cid, dur, ("chip", "q", "a")))

    # ── end card: their logo, their phone, their page ─────────────────────
    def end(cid, dur, size):
        g = B.geom(size)
        bg = ""
        if end_media:
            src, _ = _media_src(assets, end_media)
            bg = f'<img class="cover" src="{src}" alt="" style="filter:brightness(0.34) saturate(0.7)" />'
        logo = (f'<div id="{cid}-card" style="display:block; width:fit-content; margin:0 auto; background:#fff; '
                f'border-radius:28px; padding:34px 44px; box-shadow:0 22px 60px rgba(0,0,0,0.45); opacity:0">'
                f'<img src="public/logo.png" alt="" style="width:470px; height:auto; display:block" /></div>'
                if d.get("logo") else
                f'<span class="hero" id="{cid}-card" style="display:block; font-size:96px; opacity:0">{name}</span>')
        return f'''{bg}
      <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(101,12,117,0.88) 0%, rgba(26,5,32,0.96) 100%)"></div>
      <div style="position:absolute; left:0; right:0; top:8%; height:2px; z-index:20; background:linear-gradient(90deg, transparent, {B.GOLD}, transparent); opacity:0.5"></div>
      {_end_block(cid, g, logo)}'''

    def end_js(cid, dur):
        return (S.pop(cid, "card", 0.12, scale=1.10, dur=0.46)
                + S.rise(cid, "tel", 0.62, dy=16, dur=0.40)
                + S.rise(cid, "addr", 0.98, dy=14, dur=0.36)
                + S.rise(cid, "site", 1.28, dy=10, dur=0.34))

    def _end_block(cid, g, logo):
        """Stacked for a tall frame, side by side for a wide one.

        A contact card that stacks a logo, a phone pill, an address and a URL
        runs out of height in a 16:9 letterbox. Landscape has the opposite
        problem — height is scarce, width is not — so it gets its own layout
        rather than the phone one shrunk.
        """
        contact = (
            f'<div style="margin-top:52px"><span class="pill" id="{cid}-tel" style="opacity:0">{phone}</span></div>'
            f'<span id="{cid}-addr" style="display:block; margin-top:38px; color:#fff; font-weight:800; '
            f'font-size:52px; letter-spacing:-1px; opacity:0">{street}</span>'
            f'<span id="{cid}-site" style="display:block; margin-top:30px; color:rgba(255,255,255,0.86); '
            f'font-weight:600; font-size:38px; opacity:0">{site}</span>'
        )
        if not g["wide"]:
            return (f'<div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:30%; '
                    f'z-index:36; text-align:center">{logo}{contact}</div>')
        contact_wide = (
            f'<span class="pill" id="{cid}-tel" style="opacity:0">{phone}</span>'
            f'<span id="{cid}-addr" style="display:block; margin-top:30px; color:#fff; font-weight:800; '
            f'font-size:52px; letter-spacing:-1px; opacity:0">{street}</span>'
            f'<span id="{cid}-site" style="display:block; margin-top:22px; color:rgba(255,255,255,0.86); '
            f'font-weight:600; font-size:38px; opacity:0">{site}</span>'
        )
        return (f'<div style="position:absolute; left:{g["side"]}px; right:{g["side"]}px; top:50%; '
                f'transform:translateY(-50%); z-index:36; display:flex; align-items:center; '
                f'justify-content:center; gap:96px">'
                f'<div>{logo}</div><div style="text-align:left">{contact_wide}</div></div>')

    # ── assemble ──────────────────────────────────────────────────────────
    scenes, subs = [], []
    say_name = d.get("say_name", name)

    use_logo_card = opener_media == "logo"
    if use_logo_card and not d.get("logo"):
        raise ValueError("opener 'logo' needs a logo on the profile")
    scenes.append(Scene("s0-open", 0.0, OPEN,
                        logo_opener if use_logo_card else opener,
                        logo_opener_js if use_logo_card else opener_js, lines=(0,)))
    subs.append(Sub(0.0, OPEN, f"{street} · {city}",
                    say=f"{say_name}, {d.get('say_street', street)} in {city}."))

    at = OPEN - B.X
    for i, beat in enumerate(beats):
        html, js = beat_html(beat)
        scenes.append(Scene(f"s{i + 1}-{beat['media']}", at, BEAT, html, js, lines=(len(subs),)))
        subs.append(Sub(at, at + BEAT, beat["title"], say=beat.get("say", beat["title"] + ".")))
        at = round(at + BEAT - B.X, 2)

    if quote:
        scenes.append(Scene("sq-quote", at, BEAT, quote_html, quote_js, lines=(len(subs),)))
        subs.append(Sub(at, at + BEAT, quote["text"], say=quote.get("say", quote["text"])))
        at = round(at + BEAT - B.X, 2)

    # The hero shot of the thing they actually sell, held last. A spotlight that
    # ends on a quote ends on an adjective; this ends on the product.
    if closer:
        chtml, cjs = beat_html(closer)
        scenes.append(Scene("sc-closer", at, BEAT, chtml, cjs, lines=(len(subs),)))
        subs.append(Sub(at, at + BEAT, closer["title"],
                        say=closer.get("say", closer["title"] + ".")))
        at = round(at + BEAT - B.X, 2)

    scenes.append(Scene("sz-end", at, END, end, end_js, lines=(len(subs),)))
    subs.append(Sub(at, at + END, phone,
                    say=d.get("say_close", f"Call {d.get('say_phone', phone)}, "
                                           f"or find them on {B.spoken_url(site)}.")))

    total = round(at + END, 2)
    vo = [B.for_tts(s.spoken) for s in subs]

    return Video(
        slug=f"spotlight-{d['slug']}" if d.get("slug") else "member-spotlight",
        title=f"MEMBER SPOTLIGHT — {name}, {street}",
        total=total,
        size=B.SIZES["9x16"],
        scenes=scenes,
        subs=subs,
        vo_lines=vo,
        assets=assets,
        audio=[
            Audio("public/vo.wav", "voiceover", 0.40, total - 0.40, volume=0.80, fade_in=0.05, fade_out=0.20),
            Audio("public/bed.wav", "music", 0.00, total, volume=0.26, fade_in=0.4, fade_out=1.4),
        ],
        note=("Identity beats use the member's own photos and logo; any generated clip is "
              "generic service b-roll only. Re-check the facts against the profile before posting."),
    )
