"""Turn a format's scenes into a HyperFrames project on disk.

A format module returns a Video. This module writes compositions/*.html plus
index.html, which is everything HyperFrames needs to render.
"""
import json
import os
from dataclasses import dataclass, field
from typing import Callable

from . import brand as B
from . import scene as S


@dataclass
class Scene:
    cid: str
    start: float
    dur: float
    html: Callable[[str, float, tuple], str]   # (cid, dur, size) -> inner markup
    js: Callable[[str, float], str] = lambda cid, dur: ""


@dataclass
class Sub:
    """One burned-in caption. `say` overrides what the voice reads.

    They are not always the same string. "4-0" belongs on screen; a voice has
    to be handed "four and oh" or it reads the dash out loud.
    """
    start: float
    end: float
    text: str
    say: str = ""

    @property
    def spoken(self) -> str:
        return self.say or self.text


@dataclass
class Audio:
    """One audio clip on the timeline. `group` drives the carve/duck routing."""
    src: str
    group: str            # voiceover | music | sfx
    start: float
    dur: float
    volume: float = 1.0
    media_start: float = 0.0
    fade_in: float = 0.0
    fade_out: float = 0.0


@dataclass
class Video:
    slug: str
    title: str
    total: float
    scenes: list
    subs: list = field(default_factory=list)
    audio: list = field(default_factory=list)
    vo_lines: list = field(default_factory=list)   # plain sentences, in order
    note: str = ""
    size: tuple = B.SIZES["9x16"]


def _subs_html(v: Video) -> str:
    cid = "subs"
    w, h = v.size
    items = "".join(
        f'\n      <div class="sub" id="sub-{i}"><span>{s.text}</span></div>'
        for i, s in enumerate(v.subs)
    )
    spans = ",\n          ".join(f"[{s.start:.2f}, {s.end:.2f}]" for s in v.subs)
    bottom = int(h * B.SAFE_BOTTOM_PCT / 100)
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{w}" data-height="{h}" data-duration="{v.total:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>
      [data-composition-id="{cid}"] .wrapz {{ position:absolute; left:60px; right:60px; bottom:{bottom}px; z-index:70; display:flex; justify-content:center; }}
      [data-composition-id="{cid}"] .sub {{ position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:center; opacity:0; }}
      [data-composition-id="{cid}"] .sub span {{ display:inline-block; max-width:920px; background:rgba(0,0,0,0.64); color:#fff; font-weight:600; font-size:42px; line-height:1.25; padding:14px 28px; border-radius:20px; text-align:center; }}
    </style>
    <div class="wrapz" data-layout-allow-overlap>{items}
    </div>
    <script>
      (() => {{
        const S = [
          {spans}
        ];
        const tl = gsap.timeline({{ paused:true }});
        S.forEach(([a,b], i) => {{
          tl.fromTo("#sub-"+i, {{ autoAlpha:0, y:10 }}, {{ autoAlpha:1, y:0, duration:0.12 }}, a);
          tl.to("#sub-"+i, {{ autoAlpha:0, duration:0.1 }}, b-0.1);
        }});
        tl.set({{}}, {{}}, {v.total:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def _progress_html(v: Video) -> str:
    cid = "progress"
    w, h = v.size
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{w}" data-height="{h}" data-duration="{v.total:.2f}" style="position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none">
    <style>[data-composition-id="{cid}"] .bar {{ position:absolute; left:0; right:0; bottom:0; height:8px; background:{B.GOLD}; transform-origin:0% 50%; transform:scaleX(0); z-index:70; box-shadow:0 0 12px rgba(239,198,24,0.6); }}</style>
    <div class="bar" id="prog-bar"></div>
    <script>
      (() => {{ const tl = gsap.timeline({{paused:true}});
        tl.fromTo("#prog-bar", {{scaleX:0}}, {{scaleX:1, duration:{v.total:.2f}, ease:"none"}}, 0);
        window.__timelines["{cid}"] = tl; }})();
    </script>
  </div>
</template>
'''


def _audio_tag(a: Audio, idx: int, total: float) -> str:
    # Music ducks under the voiceover automatically rather than by hand-drawn
    # envelopes, so a longer or shorter read does not need the bed re-timed.
    carve = ""
    if a.group == "music":
        carve = " data-fx-carve='{\"enabled\":true,\"sources\":[\"voiceover\"],\"strength\":0.55}'"
    return (f'      <audio id="a{idx}" class="clip" data-audio-group="{a.group}" src="{a.src}" '
            f'data-start="{a.start:.2f}" data-media-start="{a.media_start:.2f}" data-duration="{a.dur:.2f}" '
            f'data-track-index="{idx}" data-volume="{a.volume}" '
            f'data-fade-in="{a.fade_in}" data-fade-out="{a.fade_out}"{carve}></audio>')


def index_html(v: Video) -> str:
    w, h = v.size
    rows = [
        f'      <div id="el-{s.cid}" data-composition-id="{s.cid}" data-composition-src="compositions/{s.cid}.html" '
        f'data-start="{s.start:.2f}" data-duration="{s.dur:.2f}" data-track-index="{i+1}"></div>'
        for i, s in enumerate(v.scenes)
    ]
    n = len(v.scenes)
    if v.subs:
        rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="compositions/subs.html" data-start="0" data-duration="{v.total:.2f}" data-track-index="{n+1}"></div>')
    rows.append(f'      <div id="el-progress" data-composition-id="progress" data-composition-src="compositions/progress.html" data-start="0" data-duration="{v.total:.2f}" data-track-index="{n+2}"></div>')
    audio = "\n".join(_audio_tag(a, n + 3 + i, v.total) for i, a in enumerate(v.audio))
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <script src="{B.GSAP_CDN}"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      @font-face {{ font-family:"{B.FONT}"; src:url("{B.FONT_WOFF2}") format("woff2"); font-weight:200 800; font-style:normal; }}
      html, body {{ margin:0; width:{w}px; height:{h}px; overflow:hidden; background:{B.BG}; }}
      body {{ font-family:"{B.FONT}", sans-serif; }}
      #root {{ position:relative; width:{w}px; height:{h}px; overflow:hidden; }}
      #root > div[data-composition-src] {{ position:absolute; inset:0; }}
    </style>
  </head>
  <body>
    <!-- {v.title} — generated by _kit. Do not hand-edit; edit the format module and re-run make.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{v.total:.2f}" data-width="{w}" data-height="{h}">
{chr(10).join(rows)}

{audio}
    </div>
    <script>window.__timelines["main"] = gsap.timeline({{ paused:true }});</script>
  </body>
</html>
'''


def _dedupe_subs(v: Video, rendered: dict) -> list:
    """Drop captions that repeat text the frame is already displaying.

    A scene that prints "Huyck Stadium" in 64px does not also need it in the
    caption band. Printing both stacks two text blocks on one frame, which is
    unreadable and which `hyperframes check` rejects outright.
    """
    kept = []
    for sub in v.subs:
        onscreen = [
            rendered[sc.cid] for sc in v.scenes
            if sc.start < sub.end and (sc.start + sc.dur) > sub.start
        ]
        if any(sub.text.rstrip(".").lower() in html.lower() for html in onscreen):
            continue
        kept.append(sub)
    return kept


def write(v: Video, out_dir: str) -> dict:
    """Write the whole project. Returns a small manifest for the caller."""
    comp = os.path.join(out_dir, "compositions")
    os.makedirs(comp, exist_ok=True)
    rendered = {}
    for i, s in enumerate(v.scenes):
        inner = s.html(s.cid, s.dur, v.size)
        rendered[s.cid] = inner
        js = s.js(s.cid, s.dur)
        open(os.path.join(comp, f"{s.cid}.html"), "w").write(
            S.wrap(s.cid, s.dur, inner, js, v.size, first=(i == 0))
        )
    # The voiceover still speaks every line; only the on-screen duplicate goes.
    v.subs = _dedupe_subs(v, rendered)
    if v.subs:
        open(os.path.join(comp, "subs.html"), "w").write(_subs_html(v))
    open(os.path.join(comp, "progress.html"), "w").write(_progress_html(v))
    open(os.path.join(out_dir, "index.html"), "w").write(index_html(v))

    manifest = {
        "slug": v.slug,
        "title": v.title,
        "total": v.total,
        "size": list(v.size),
        "scenes": [{"id": s.cid, "start": s.start, "dur": s.dur} for s in v.scenes],
        "subs": [{"start": s.start, "end": s.end, "text": s.text, "say": s.spoken} for s in v.subs],
        "vo_lines": v.vo_lines,
        "audio": [a.__dict__ for a in v.audio],
        "note": v.note,
    }
    open(os.path.join(out_dir, "build.json"), "w").write(json.dumps(manifest, indent=2))
    return manifest
