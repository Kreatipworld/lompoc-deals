"""Scene scaffolding: the CSS library and the <template> wrapper.

Every hand-built generator re-declared these. `css()` and `wrap()` here are the
same markup those generators converged on, so a format module only has to write
the part that is actually different: its inner HTML and its GSAP calls.
"""
from . import brand as B

GRAIN_SVG = (
    "url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 "
    "height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 "
    "baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 "
    "height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E\")"
)


def css(cid: str) -> str:
    """The shared class library, scoped to one composition id.

    stage   the fading layer every scene lives in
    vig     vignette
    grain   film grain, sits above everything
    mark    the white logo mark, top right
    scrim   bottom-up darkening so text reads over any photo
    chip    small gold label
    hero    the big white headline
    cover   a full-bleed photo or video
    """
    return f"""
      [data-composition-id="{cid}"] .stage {{ position:absolute; inset:0; opacity:0; will-change:opacity; }}
      [data-composition-id="{cid}"] .vig {{ position:absolute; inset:0; z-index:30; pointer-events:none;
        background:radial-gradient(ellipse 100% 85% at 50% 45%, rgba(10,6,12,0) 62%, rgba(10,6,12,0.5) 100%); }}
      [data-composition-id="{cid}"] .grain {{ position:absolute; inset:0; pointer-events:none; opacity:0.08; z-index:50;
        background-image:{GRAIN_SVG}; }}
      [data-composition-id="{cid}"] .mark {{ position:absolute; top:150px; right:{B.SAFE_SIDE_PX}px; width:96px; height:auto; z-index:44; }}
      [data-composition-id="{cid}"] video, [data-composition-id="{cid}"] .cover {{ position:absolute; inset:0;
        width:100%; height:100%; object-fit:cover; display:block; }}
      [data-composition-id="{cid}"] .scrim {{ position:absolute; inset:0; z-index:31; pointer-events:none;
        background:linear-gradient(to top, rgba(20,10,23,0.95) 0%, rgba(20,10,23,0.62) 38%, rgba(20,10,23,0.12) 70%); }}
      [data-composition-id="{cid}"] .chip {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800;
        font-size:34px; letter-spacing:4px; padding:14px 28px; border-radius:10px; text-transform:uppercase; }}
      [data-composition-id="{cid}"] .hero {{ display:block; color:#fff; font-weight:800; line-height:0.94;
        letter-spacing:-4px; text-shadow:0 8px 34px rgba(10,6,12,0.7); }}
      [data-composition-id="{cid}"] .pill {{ display:inline-block; background:{B.GOLD}; color:{B.INK}; font-weight:800;
        font-size:44px; padding:20px 38px; border-radius:999px; }}
    """


def wrap(cid: str, dur: float, inner: str, js: str, size, first: bool = False) -> str:
    """Wrap one scene's markup and animation into a HyperFrames composition.

    `first=True` paints the opening frame solid and sets the stage visible at
    t=0 instead of fading it in. Frame 0 is the social thumbnail, and a scene
    that fades from nothing renders that thumbnail blank.
    """
    w, h = size
    fade = (
        f'tl.set("#{cid}-stage", {{ autoAlpha:1 }}, 0);'
        if first
        else f'tl.fromTo("#{cid}-stage", {{ autoAlpha:0 }}, {{ autoAlpha:1, duration:{B.X}, ease:"power1.inOut" }}, 0);'
    )
    bg = B.BG if first else "transparent"
    stage_style = ' style="opacity:1"' if first else ""
    return f'''<template>
  <div data-composition-id="{cid}" data-width="{w}" data-height="{h}" data-duration="{dur:.2f}" style="position:absolute; inset:0; overflow:hidden; background:{bg}">
    <style>{css(cid)}
    </style>
    <div class="stage" id="{cid}-stage"{stage_style}>
      {inner}
      <div class="vig"></div>
    </div>
    <img class="mark" src="public/mark-white.png" alt="" />
    <div class="grain"></div>
    <script>
      (() => {{
        const tl = gsap.timeline({{ paused:true, defaults:{{ ease:"power4.out", duration:0.45 }} }});
        {fade}
        {js}
        tl.set({{}}, {{}}, {dur:.2f});
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
'''


def rise(cid: str, el: str, at: float, dy: int = 18, dur: float = 0.42, extra: str = "") -> str:
    """Fade-and-rise, the house entrance. `extra` adds properties to the end state."""
    tail = (", " + extra) if extra else ""
    return (f'tl.fromTo("#{cid}-{el}", {{ autoAlpha:0, y:{dy} }}, '
            f'{{ autoAlpha:1, y:0, duration:{dur}, ease:"expo.out"{tail} }}, {at});')


def pop(cid: str, el: str, at: float, scale: float = 1.15, dur: float = 0.40) -> str:
    """Scale-in, for badges, scores and anything that should land hard."""
    return (f'tl.fromTo("#{cid}-{el}", {{ autoAlpha:0, scale:{scale} }}, '
            f'{{ autoAlpha:1, scale:1, duration:{dur}, ease:"expo.out" }}, {at});')


def out(cid: str, el: str, at: float, dur: float = 0.32) -> str:
    """Fade something away, so two messages never stack on one frame."""
    return f'tl.to("#{cid}-{el}", {{ autoAlpha:0, duration:{dur}, ease:"power2.in" }}, {at});'
