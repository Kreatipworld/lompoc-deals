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
    beats           [{chip,title,sub,media}] optional; derived from services when absent
    quote           {"text", "chip"}         optional; something the member wrote themselves

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


def _video_layers(cid: str, src: str, dur: float, at: float, length: float, style: str) -> str:
    """One or more <video> clips laid end to end so `dur` seconds are covered.

    A single element is emitted whenever the footage is long enough, which is
    the normal case; the repeats only appear when a sentence outlasts the shot.
    """
    if length <= 0 or at + dur <= length + 0.05:
        return (f'<video id="{cid}-bg" class="clip" src="{src}" data-start="0" data-media-start="{at:.2f}" '
                f'data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="{style}"></video>')
    out, cursor, media_at, i = [], 0.0, at, 0
    while cursor < dur - 0.02:
        seg = min(dur - cursor, length - media_at)
        out.append(f'<video id="{cid}-bg{i}" class="clip" src="{src}" data-start="{cursor:.2f}" '
                   f'data-media-start="{media_at:.2f}" data-duration="{seg:.2f}" data-track-index="0" '
                   f'muted playsinline style="{style}"></video>')
        cursor += seg
        media_at, i = 0.0, i + 1
    # They never share a moment, only a box, so the layout check is told so.
    return f'<div id="{cid}-bg" style="position:absolute; inset:0" data-layout-allow-overlap>{"".join(out)}</div>'


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
    tagline = d.get("tagline", "A Lompoc Locals member")

    opener_media = d.get("opener", "photo-0")
    end_media = d.get("end_photo")

    # ── opener: their photo, their address ────────────────────────────────
    def opener(cid, dur, size):
        src, kind = _media_src(assets, opener_media)
        art = (_video_layers(cid, src, dur, 0.0, _clip_len(assets, opener_media), "filter:brightness(0.66)")
               if kind == "video" else
               f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="filter:brightness(0.78) saturate(1.06)" />')
        return f'''{art}
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; top:16%; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:1">{tagline}</span></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:36">
        <span class="hero" id="{cid}-h1" style="font-size:112px; opacity:1">{name}</span>
        <span id="{cid}-h2" style="display:block; margin-top:26px; color:{B.GOLD}; font-weight:800; font-size:62px; letter-spacing:-1px; opacity:0">{street} · {city}</span>
      </div>'''

    def opener_js(cid, dur):
        # Frame 0 is the thumbnail: the photo and the name are already painted,
        # so only the slow push and the second line are animated.
        return (f'tl.fromTo("#{cid}-bg", {{ scale:1.16 }}, {{ scale:1.26, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 62%" }}, 0);'
                + f'tl.fromTo("#{cid}-h1", {{ scale:1.05 }}, {{ scale:1, duration:1.30, ease:"power2.out", transformOrigin:"0% 100%" }}, 0);'
                + S.rise(cid, "h2", 1.20, dy=16, dur=0.42)
                + _exit(cid, dur, ("chip", "h1", "h2")))

    # ── service beats: generated b-roll or their photos ───────────────────
    def beat_html(beat):
        def html(cid, dur, size):
            src, kind = _media_src(assets, beat["media"])
            art = (_video_layers(cid, src, dur, beat.get("at", 0.0), _clip_len(assets, beat["media"]),
                                 "filter:brightness(0.92) saturate(1.06)")
                   if kind == "video" else
                   f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="filter:brightness(0.70) saturate(1.06)" />')
            sub = (f'<span id="{cid}-sub" style="display:block; margin-top:22px; color:rgba(255,255,255,0.86); '
                   f'font-weight:600; font-size:40px; letter-spacing:0; opacity:0">{beat["sub"]}</span>'
                   if beat.get("sub") else "")
            return f'''{art}
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; top:16%; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:0">{beat["chip"]}</span></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:36">
        <span class="hero" id="{cid}-t" style="font-size:{beat.get("size", 84)}px; letter-spacing:-2px; opacity:0">{beat["title"]}</span>{sub}
      </div>'''

        def js(cid, dur):
            out = f'tl.fromTo("#{cid}-bg", {{ scale:1.0 }}, {{ scale:1.07, duration:{dur:.2f}, ease:"none", transformOrigin:"50% 50%" }}, 0);'
            out += S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
            out += S.rise(cid, "t", 0.26, dy=22, dur=0.46)
            if beat.get("sub"):
                out += S.rise(cid, "sub", 0.58, dy=12, dur=0.36)
            return out + _exit(cid, dur, ("chip", "t") + (("sub",) if beat.get("sub") else ()))

        return html, js

    # ── their own words, on their own photo ───────────────────────────────
    def quote_html(cid, dur, size):
        src, kind = _media_src(assets, quote["media"])
        art = (_video_layers(cid, src, dur, 0.0, _clip_len(assets, quote["media"]), "filter:brightness(0.58)")
               if kind == "video" else
               f'<img id="{cid}-bg" class="cover" src="{src}" alt="" style="filter:brightness(0.50) saturate(1.02)" />')
        return f'''{art}
      <div class="scrim"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; top:16%; z-index:36"><span class="chip" id="{cid}-chip" style="opacity:0">{quote.get("chip", "In their own words")}</span></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; bottom:{B.SCENE_BOTTOM_PCT}%; z-index:36">
        <span class="hero" id="{cid}-q" style="font-size:92px; letter-spacing:-2px; opacity:0">&ldquo;{quote["text"]}&rdquo;</span>
        <span id="{cid}-a" style="display:block; margin-top:24px; color:rgba(255,255,255,0.72); font-weight:600; font-size:34px; opacity:0">&mdash; {name}</span>
      </div>'''

    def quote_js(cid, dur):
        return (f'tl.fromTo("#{cid}-bg", {{ scale:1.0 }}, {{ scale:1.06, duration:{dur:.2f}, ease:"none" }}, 0);'
                + S.rise(cid, "chip", 0.10, dy=12, dur=0.34)
                + S.rise(cid, "q", 0.24, dy=24, dur=0.50)
                + S.rise(cid, "a", 0.80, dy=10, dur=0.34)
                + _exit(cid, dur, ("chip", "q", "a")))

    # ── end card: their logo, their phone, their page ─────────────────────
    def end(cid, dur, size):
        bg = ""
        if end_media:
            src, _ = _media_src(assets, end_media)
            bg = f'<img class="cover" src="{src}" alt="" style="filter:brightness(0.34) saturate(0.7)" />'
        logo = (f'<div id="{cid}-card" style="display:inline-block; background:#fff; border-radius:28px; padding:34px 44px; '
                f'box-shadow:0 22px 60px rgba(0,0,0,0.45); opacity:0"><img src="public/logo.png" alt="" style="width:560px; height:auto; display:block" /></div>'
                if d.get("logo") else
                f'<span class="hero" id="{cid}-card" style="font-size:96px; opacity:0">{name}</span>')
        return f'''{bg}
      <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(101,12,117,0.88) 0%, rgba(26,5,32,0.96) 100%)"></div>
      <div style="position:absolute; left:{B.SAFE_SIDE_PX}px; right:{B.SAFE_SIDE_PX}px; top:30%; z-index:36; text-align:center">
        {logo}
        <span class="pill" id="{cid}-tel" style="margin-top:56px; opacity:0">{phone}</span>
        <span id="{cid}-addr" style="display:block; margin-top:38px; color:#fff; font-weight:800; font-size:52px; letter-spacing:-1px; opacity:0">{street}</span>
        <span id="{cid}-site" style="display:block; margin-top:30px; color:rgba(255,255,255,0.86); font-weight:600; font-size:36px; opacity:0">{site}</span>
      </div>'''

    def end_js(cid, dur):
        return (S.pop(cid, "card", 0.12, scale=1.10, dur=0.46)
                + S.rise(cid, "tel", 0.62, dy=16, dur=0.40)
                + S.rise(cid, "addr", 0.98, dy=14, dur=0.36)
                + S.rise(cid, "site", 1.28, dy=10, dur=0.34))

    # ── assemble ──────────────────────────────────────────────────────────
    scenes, subs = [], []
    say_name = d.get("say_name", name)

    scenes.append(Scene("s0-open", 0.0, OPEN, opener, opener_js, lines=(0,)))
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
