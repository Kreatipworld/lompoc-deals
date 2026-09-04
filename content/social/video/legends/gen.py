import os, sys
P='/Users/kreatip/Projects/lompoc-deals/content/social/video/legends'
GRAIN="url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%271%27/%3E%3C/svg%3E\")"
GOLD="#efc618"; BLUE="#3b62d6"; BLUEDARK="#1f3c88"

def base_css(cid, A):
    H,BAR,MT,HERO,SUB,LB=A['H'],A['BAR'],A['MT'],A['HERO'],A['SUB'],A['LB']
    c=f'[data-composition-id="{cid}"]'
    return f"""
      {c} .cine-bar {{ position: absolute; left: 0; right: 0; height: {BAR}px; background: #050308; z-index: 60; }}
      {c} .cine-top {{ top: 0; }} {c} .cine-bot {{ bottom: 0; }}
      {c} .vig {{ position: absolute; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(ellipse 95% 80% at 50% 45%, rgba(5,3,8,0) 42%, rgba(5,3,8,0.72) 100%); }}
      {c} .grain {{ position: absolute; inset: 0; pointer-events: none; opacity: 0.10; z-index: 50; background-image: {GRAIN}; }}
      {c} .mark {{ position: absolute; top: {MT}px; right: 84px; width: 96px; height: auto; z-index: 40; }}
      {c} .chip {{ display: inline-block; background: rgba(8,5,10,0.78); color: #fff; font-weight: 700; font-size: 30px; letter-spacing: 4px; padding: 14px 26px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; border-top: 2px solid {GOLD}; }}
      {c} .hero {{ color: #fff; text-shadow: 0 6px 30px rgba(0,0,0,0.7); font-weight: 800; font-size: {HERO}px; line-height: 0.95; letter-spacing: -5px; text-transform: uppercase; will-change: transform; transform-origin: left bottom; }}
      {c} .kicker {{ display: block; margin-bottom: 44px; font-weight: 800; font-size: {SUB}px; letter-spacing: 8px; text-transform: uppercase; line-height: 1; }}
      {c} .rule {{ display: block; margin-top: 22px; width: 180px; height: 8px; border-radius: 4px; }}
      {c} .credit {{ display: block; margin-top: 22px; color: rgba(255,255,255,0.7); font-size: 24px; font-weight: 500; letter-spacing: 1px; }}
      {c} .scrim {{ position: absolute; inset: 0; z-index: 20; background: linear-gradient(to top, rgba(5,3,8,0.94) 0%, rgba(5,3,8,0.62) 32%, rgba(5,3,8,0.0) 60%); }}
      {c} .lower {{ position: absolute; left: 84px; right: 84px; bottom: {LB}%; z-index: 35; }}
      {c} .vidwrap {{ position: absolute; inset: 0; will-change: transform; transform-origin: 50% 50%; }}
      {c} video {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.12) saturate(0.92) brightness(0.92); }}
    """

def wrap(cid, dur, bg, css, body, script, A, nomark=False):
    return f"""<template>
  <div data-composition-id="{cid}" data-width="1080" data-height="{A['H']}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: {bg}">
    <style>{base_css(cid,A)}{css}
    </style>
{body}
    <div class="vig"></div>
    {"" if nomark else '<img class="mark" src="public/mark-white.png" alt="" />'}
    <div class="grain"></div>
    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>
    <script>
      (() => {{
{script}
        window.__timelines["{cid}"] = tl;
      }})();
    </script>
  </div>
</template>
"""

def land_scene(cid, clip, color, chip, hero, A, push_in=False, dip_out=False, dur=5.00, media_start=0.0, rate=1.0, chip_at=0.60, hero_at=1.20):
    c=f'[data-composition-id="{cid}"]'
    css=f"""
      {c} .stagewrap {{ position: absolute; inset: 0; z-index: 34; will-change: transform, filter; }}
      {c} .tint {{ position: absolute; inset: 0; z-index: 15; mix-blend-mode: soft-light; background: radial-gradient(ellipse 80% 70% at 50% 30%, {color} 0%, rgba(0,0,0,0) 70%); opacity: 0.5; }}
      {c} .chipwrap {{ position: absolute; left: 84px; top: {A['MT']+150}px; z-index: 36; opacity: 0; }}
      {c} .chip {{ border-top-color: {color}; }}
      {c} .hero {{ font-size: {A['HERO']-10}px; }}
      {c} .rule {{ background: {color}; }}
      {c} .dip {{ position: absolute; inset: 0; z-index: 58; background: #050308; opacity: 0; }}
    """
    body=f"""    <div class="stagewrap" id="{cid}-stage" data-layout-allow-overflow>
      <div class="vidwrap" id="{cid}-wrap" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/{clip}" data-start="0" data-duration="{dur:.2f}" data-media-start="{media_start:.2f}"{f' data-playback-rate="{rate}"' if rate != 1.0 else ''} data-track-index="0" muted playsinline></video></div>
      <div class="tint"></div>
      <div class="scrim"></div>
      <div class="chipwrap" id="{cid}-chip"><span class="chip">{chip}</span></div>
      <div class="lower">
        <div class="hero" id="{cid}-hero">{hero}</div>
        <span class="rule" id="{cid}-rule"></span>
      </div>
    </div>
    <div class="dip" id="{cid}-dip"></div>"""
    push_in_js = f'tl.fromTo("#{cid}-stage", {{ xPercent: 100, filter: "blur(12px)" }}, {{ xPercent: 0, filter: "blur(0px)", duration: 0.28, ease: "power3.out" }}, 0);' if push_in else ''
    push_out_js = '' if dip_out else f'tl.to("#{cid}-stage", {{ xPercent: -100, filter: "blur(12px)", duration: 0.28, ease: "power3.in" }}, B.END - 0.28);'
    dip_js = f'tl.fromTo("#{cid}-dip", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.25, ease: "power2.in" }}, B.END - 0.25);' if dip_out else ''
    script=f"""        // BEATS (relative): CHIP 0.60, HERO 1.20, RULE 1.45; push 1.0→1.05; {'push-in at 0' if push_in else 'push-out in the last 0.28s'}{'; dip to black in the last 0.25s' if dip_out else ''}
        const B = {{ CHIP: {chip_at} + {0.28 if push_in else 0}, HERO: {hero_at} + {0.28 if push_in else 0}, RULE: {hero_at+0.25} + {0.28 if push_in else 0}, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power4.out", duration: 0.5 }} }});
        {push_in_js}
        tl.fromTo("#{cid}-wrap", {{ scale: 1.0 }}, {{ scale: 1.05, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-chip", {{ autoAlpha: 0, y: 16 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, B.CHIP);
        tl.fromTo("#{cid}-hero", {{ autoAlpha: 0, scale: 1.12 }}, {{ autoAlpha: 1, scale: 1, duration: 0.42, ease: "expo.out" }}, B.HERO);
        tl.fromTo("#{cid}-rule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.45, ease: "power3.out", transformOrigin: "left center" }}, B.RULE);
        {push_out_js}
        {dip_js}"""
    return cid, dur, wrap(cid, dur, "#050308", css, body, script, A)

def hero_scene(cid, clip, color, kicker, hero, A, mirror=False, frm="", dur=5.00):
    c=f'[data-composition-id="{cid}"]'
    css=f"""
      {c} .tint {{ position: absolute; inset: 0; z-index: 15; mix-blend-mode: soft-light; background: radial-gradient(ellipse 80% 70% at 50% 30%, {color} 0%, rgba(0,0,0,0) 70%); opacity: 0.55; }}
      {c} .kicker {{ color: {color}; }}
      {c} .rule {{ background: {color}; }}
      {c} .hero {{ font-size: {A['HERO']-10}px; }}
      {c} .kickwrap {{ display: block; opacity: 0; }}
      {c} .fromchip {{ display: inline-block; margin-bottom: 26px; background: {color}; color: #0a060c; font-weight: 800; font-size: 26px; letter-spacing: 3px; padding: 10px 18px; border-radius: 8px; text-transform: uppercase; }}
    """
    body=f"""    <div class="vidwrap" id="{cid}-wrap" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/{clip}" data-start="0" data-duration="{dur:.2f}" data-track-index="0" muted playsinline{' style="transform: scaleX(-1)"' if mirror else ''}></video></div>
    <div class="tint"></div>
    <div class="scrim"></div>
    <div class="lower">
      <span class="kickwrap" id="{cid}-kick" data-layout-allow-overlap><span class="kicker" data-layout-allow-overlap>{kicker}</span><span class="fromchip" id="{cid}-from">{frm}</span></span>
      <div class="hero" id="{cid}-hero">{hero}</div>
      <span class="rule" id="{cid}-rule"></span>
    </div>"""
    script=f"""        // BEATS (relative): KICKER 0.50, HERO 0.70 (slam), RULE 0.95; push 1.0→1.05 over the scene
        const B = {{ KICK: 0.50, HERO: 0.70, RULE: 0.95, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power4.out", duration: 0.5 }} }});
        tl.fromTo("#{cid}-wrap", {{ scale: 1.0 }}, {{ scale: 1.05, duration: B.END, ease: "none" }}, 0);
        tl.fromTo("#{cid}-kick", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.35 }}, B.KICK);
        tl.fromTo("#{cid}-hero", {{ autoAlpha: 0, scale: 1.12 }}, {{ autoAlpha: 1, scale: 1, duration: 0.42, ease: "expo.out" }}, B.HERO);
        tl.fromTo("#{cid}-rule", {{ autoAlpha: 0, scaleX: 0 }}, {{ autoAlpha: 1, scaleX: 1, duration: 0.45, ease: "power3.out", transformOrigin: "left center" }}, B.RULE);"""
    return cid, dur, wrap(cid, dur, "#050308", css, body, script, A)

def s4(A, dur=5.00):
    cid="s4-field"; c=f'[data-composition-id="{cid}"]'
    H=A['H']
    css=f"""
      {c} .half {{ position: absolute; left: 0; right: 0; overflow: hidden; }}
      {c} .half-top {{ top: 0; height: 50%; }} {c} .half-bot {{ bottom: 0; height: 50%; }}
      {c} .half .vidwrap {{ position: absolute; inset: 0; }}
      {c} .half video {{ position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }}
      {c} .tint-top {{ position: absolute; inset: 0; z-index: 15; background: linear-gradient(to bottom, rgba(5,3,8,0.45), rgba(239,198,24,0.10) 55%, rgba(5,3,8,0.75)); }}
      {c} .tint-bot {{ position: absolute; inset: 0; z-index: 15; background: linear-gradient(to top, rgba(5,3,8,0.55), rgba(59,98,214,0.12) 55%, rgba(5,3,8,0.75)); }}
      {c} .seam {{ position: absolute; left: -12%; width: 124%; top: 50%; height: 12px; margin-top: -6px; z-index: 34; background: linear-gradient(to right, {GOLD}, #fff 50%, {BLUE}); transform-origin: center; will-change: transform; box-shadow: 0 0 40px rgba(255,255,255,0.35); }}
      {c} .center {{ position: absolute; left: 0; right: 0; top: 50%; z-index: 38; text-align: center; transform: translateY(-50%); }}
      {c} .center .hero {{ transform-origin: center; font-size: {A['HERO']+20}px; text-align: center; }}
      {c} .tag {{ position: absolute; z-index: 36; font-weight: 800; font-size: {A['SUB']-4}px; letter-spacing: 8px; text-transform: uppercase; }}
      {c} .tag-top {{ left: 84px; top: {A['MT']+150}px; color: {GOLD}; }}
      {c} .tag-bot {{ right: 84px; bottom: {A['LB']-1}%; color: #9fb6ff; }}
    """
    body=f"""    <div class="half half-top"><div class="vidwrap" id="s4-top" data-layout-allow-overflow><video id="s4-conq" class="clip" src="public/clip-conq2-stride.mp4" data-start="0" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video></div><div class="tint-top"></div></div>
    <div class="half half-bot"><div class="vidwrap" id="s4-bot" data-layout-allow-overflow><video id="s4-brave" class="clip" src="public/clip-brave-stride.mp4" data-start="0" data-duration="{dur:.2f}" data-track-index="0" muted playsinline style="transform: scaleX(-1)"></video></div><div class="tint-bot"></div></div>
    <div class="seam" id="s4-seam" data-layout-allow-overflow></div>
    <div class="tag tag-top" id="s4-tagtop">Cabrillo</div>
    <div class="tag tag-bot" id="s4-tagbot">Lompoc</div>
    <div class="center"><div class="hero" id="s4-hero">One field.</div></div>"""
    script=f"""        // BEATS (relative): SEAM 0.10, HERO 0.40 ("One field."), TAGS 0.70; VO "Friday night, the whole town picks a side" runs 1.90→4.60 over the strides
        const S4 = {{ SEAM: 0.10, HERO: 0.40, TAGS: 0.70, END: {dur:.2f} }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#s4-top", {{ scale: 1.0 }}, {{ scale: 1.06, duration: S4.END, ease: "none" }}, 0);
        tl.fromTo("#s4-bot", {{ scale: 1.0 }}, {{ scale: 1.06, duration: S4.END, ease: "none" }}, 0);
        tl.fromTo("#s4-seam", {{ scaleX: 0, rotation: -4 }}, {{ scaleX: 1, rotation: -4, duration: 0.5, ease: "expo.out" }}, S4.SEAM);
        tl.fromTo("#s4-hero", {{ autoAlpha: 0, scale: 1.3 }}, {{ autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out" }}, S4.HERO);
        tl.fromTo("#s4-tagtop, #s4-tagbot", {{ autoAlpha: 0, y: 12 }}, {{ autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1 }}, S4.TAGS);"""
    return cid, dur, wrap(cid, dur, "#050308", css, body, script, A)

def s5(A):
    cid="s5-faceoff"; c=f'[data-composition-id="{cid}"]'
    H=A['H']; SW = 497 if H==1920 else 432
    css=f"""
      {c} .plate {{ position: absolute; inset: 0; will-change: transform; transform-origin: 50% 50%; }}
      {c} .plate img {{ display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; filter: contrast(1.1) saturate(0.92); }}
      {c} .fog {{ position: absolute; inset: 0; z-index: 12; background: radial-gradient(ellipse 70% 40% at 50% 66%, rgba(180,190,210,0.22), rgba(5,3,8,0) 70%); }}
      {c} .stage {{ position: absolute; inset: 0; will-change: transform; }}
      {c} .ball {{ position: absolute; left: 50%; top: {int(H*0.60)}px; width: 120px; height: 72px; margin-left: -60px; z-index: 22; will-change: transform; }}
      {c} .shield {{ position: absolute; top: {int(H*0.33)}px; width: {SW}px; height: {int(SW*1.2)}px; z-index: 40; will-change: transform; opacity: 0; }}
      {c} .sh-l {{ left: 50%; margin-left: -{SW}px; }} {c} .sh-r {{ left: 50%; margin-left: 0; }}
      {c} .shield svg {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
      {c} .shield img {{ position: absolute; left: 19%; top: 15%; width: 62%; height: auto; filter: drop-shadow(0 6px 18px rgba(10,6,12,0.5)); }}
      {c} .burst {{ position: absolute; left: 50%; top: {int(H*0.45)}px; width: 900px; height: 900px; margin: -450px 0 0 -450px; border-radius: 50%; z-index: 45; background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 20%, rgba(255,255,255,0) 62%); opacity: 0; will-change: transform; }}
      {c} .lower {{ text-align: center; z-index: 46; }}
      {c} .hero {{ transform-origin: center; }}
    """
    body=f"""    <div class="stage" id="s5-stage" data-layout-allow-overflow>
      <div class="plate" id="s5-plate" data-layout-allow-overflow><img src="public/faceoff-key.png" alt="" /></div>
      <div class="fog"></div>
      <svg class="ball" id="s5-ball" viewBox="0 0 120 72" data-layout-allow-overflow><ellipse cx="60" cy="30" rx="56" ry="28" fill="#f4f1ea"/><path d="M40 30h40M50 24v12M60 24v12M70 24v12" stroke="#050308" stroke-width="4" stroke-linecap="round"/><rect x="52" y="58" width="16" height="12" rx="3" fill="#c9c2b6"/></svg>
      <div class="shield sh-l" id="s5-shl" data-layout-allow-overflow><svg viewBox="0 0 300 360"><path d="M150 10 L290 60 V190 C290 280 220 330 150 350 C80 330 10 280 10 190 V60 Z" fill="{GOLD}" opacity="0.96"/></svg><img src="public/badge-conqs.png" alt="" /></div>
      <div class="shield sh-r" id="s5-shr" data-layout-allow-overflow><svg viewBox="0 0 300 360"><path d="M150 10 L290 60 V190 C290 280 220 330 150 350 C80 330 10 280 10 190 V60 Z" fill="{BLUE}" opacity="0.96"/></svg><img src="public/badge-braves.png" alt="" /></div>
      <div class="burst" id="s5-burst" data-layout-allow-overflow></div>
    </div>
    <div class="scrim"></div>
    <div class="lower">
      <div class="hero" id="s5-hero">The Big Game.</div>
    </div>"""
    script=f"""        // BEATS (relative): plate push 1.0→1.08; HERO 0.40; SHOCK 2.10 — badge shields fly in from their hero's side, 2-frame overlap (±26px) then settle touching at the seam, burst + shake, hold 1.2s, fade 3.45→4.05
        const S5 = {{ HERO: 0.40, SHOCK: 2.10, END: 4.50 }};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#s5-plate", {{ scale: 1.0 }}, {{ scale: 1.08, duration: S5.END, ease: "none" }}, 0);
        tl.fromTo("#s5-ball", {{ autoAlpha: 0, y: 30 }}, {{ autoAlpha: 1, y: 0, duration: 0.5 }}, 0.2);
        tl.fromTo("#s5-hero", {{ autoAlpha: 0, scale: 1.2 }}, {{ autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out" }}, S5.HERO);
        tl.fromTo("#s5-shl", {{ autoAlpha: 0, x: -900, rotation: -14 }}, {{ autoAlpha: 1, x: 26, rotation: 0, duration: 0.34, ease: "power4.in" }}, S5.SHOCK - 0.34);
        tl.fromTo("#s5-shr", {{ autoAlpha: 0, x: 900, rotation: 14 }}, {{ autoAlpha: 1, x: -26, rotation: 0, duration: 0.34, ease: "power4.in" }}, S5.SHOCK - 0.34);
        tl.to("#s5-shl", {{ x: 0, duration: 0.12, ease: "power2.out" }}, S5.SHOCK + 0.07);
        tl.to("#s5-shr", {{ x: 0, duration: 0.12, ease: "power2.out" }}, S5.SHOCK + 0.07);
        tl.fromTo("#s5-burst", {{ autoAlpha: 0, scale: 0.2 }}, {{ autoAlpha: 1, scale: 1.4, duration: 0.18, ease: "power2.out" }}, S5.SHOCK);
        tl.to("#s5-burst", {{ autoAlpha: 0, scale: 1.9, duration: 0.7, ease: "power2.out" }}, S5.SHOCK + 0.18);
        tl.to("#s5-shl, #s5-shr", {{ autoAlpha: 0, duration: 0.6, ease: "power2.in" }}, S5.SHOCK + 1.35);
        tl.fromTo("#s5-stage", {{ x: 0, y: 0 }}, {{ x: 14, y: -10, duration: 0.05, ease: "none", repeat: 7, yoyo: true }}, S5.SHOCK);
        tl.set("#s5-stage", {{ x: 0, y: 0 }}, S5.SHOCK + 0.42);"""
    return cid, 4.50, wrap(cid, 4.50, "#050308", css, body, script, A)

def s6(A, fast=False):
    cid="s6-end"; c=f'[data-composition-id="{cid}"]'
    H=A['H']; big = A['HERO']-24; sm = A['SUB']-8
    css=f"""
      {c} .vig {{ background: radial-gradient(ellipse 95% 80% at 50% 45%, rgba(10,6,12,0) 40%, rgba(10,6,12,0.6) 100%); }}
      {c} .col {{ position: absolute; left: 70px; right: 70px; top: {int(H*0.145)}px; z-index: 20; text-align: center; }}
      {c} .hero {{ transform-origin: center; text-align: center; font-size: {big}px; letter-spacing: -3px; }}
      {c} .match {{ display: block; margin-top: 18px; font-weight: 800; font-size: {sm}px; letter-spacing: 3px; text-transform: uppercase; line-height: 1.25; color: #fff; }}
      {c} .matchrow {{ display: flex; align-items: center; justify-content: center; gap: 28px; margin-top: 18px; }}
      {c} .matchrow .match {{ margin-top: 0; }}
      {c} .badge {{ display: block; width: {150 if A['H']==1920 else 120}px; height: auto; flex: 0 0 auto; filter: drop-shadow(0 8px 22px rgba(10,6,12,0.55)); will-change: transform; }}
      {c} .match .b {{ color: #9fb6ff; }} {c} .match .g {{ color: {GOLD}; }} {c} .match .v {{ color: rgba(255,255,255,0.6); font-weight: 600; }}
      {c} .when {{ display: inline-block; margin-top: {int(H*0.022)}px; background: {GOLD}; color: #241629; font-weight: 800; font-size: {sm+4}px; letter-spacing: 2px; padding: 14px 28px; border-radius: 12px; text-transform: uppercase; }}
      {c} .hero2 {{ margin-top: {int(H*0.020)}px; }}
      {c} .addr {{ display: block; margin-top: 16px; color: {GOLD}; font-weight: 800; font-size: {sm-4}px; letter-spacing: 3px; text-transform: uppercase; line-height: 1.25; }}
      {c} .note {{ display: block; margin-top: 12px; color: rgba(255,255,255,0.62); font-weight: 600; font-size: {sm-10}px; letter-spacing: 2px; text-transform: uppercase; line-height: 1.3; }}
      {c} .pill {{ display: inline-block; background: #241629; color: {GOLD}; font-weight: 800; font-size: 44px; letter-spacing: 1px; padding: 22px 42px; border-radius: 16px; margin-top: {int(H*0.018)}px; }}
      {c} .bloom {{ position: absolute; top: 14%; left: 140px; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.22), rgba(239,198,24,0) 62%); }}
    """
    fast_beats = '{ H1: 0.10, MATCH: 0.45, WHEN: 0.80, H2: 1.10, ADDR: 1.45, NOTE: 1.75, PILL: 2.10, END: 3.50 }' if fast else '{ H1: 0.10, MATCH: 0.60, WHEN: 1.00, H2: 1.45, ADDR: 1.85, NOTE: 2.30, PILL: 2.80, END: 8.00 }'
    dur6 = 3.50 if fast else 8.00
    body=f"""    <div class="bloom" id="s6-bloom" data-layout-allow-overflow></div>
    <div class="col">
      <div class="hero" id="s6-h1">The Big Game</div>
      <div class="matchrow" id="s6-matchrow"><img class="badge" id="s6-badge-l" src="public/badge-braves.png" alt="" /><span class="match" id="s6-match"><span class="b">Lompoc Braves</span> <span class="v">vs</span> <span class="g">Cabrillo Conquistadores</span></span><img class="badge" id="s6-badge-r" src="public/badge-conqs.png" alt="" /></div>
      <div id="s6-when"><span class="when">Friday · Sept 4 · 7:00 PM</span></div>
      <div class="hero hero2" id="s6-h2">Huyck Stadium</div>
      <span class="addr" id="s6-addr">515 W College Ave · Lompoc High campus</span>
      <span class="note" id="s6-note">Cabrillo home games are played at Huyck</span>
      <img id="s6-mark" src="public/mark-white.png" alt="" style="display: block; width: 120px; height: auto; margin: {int(H*0.02)}px auto 0" />
      <div id="s6-pill" class="pill">lompoclocals.com/events</div>
    </div>"""
    script=f"""        // BEATS (relative): H1 0.10, MATCH 0.60, WHEN 1.00, H2 1.45 ("Huyck Stadium" in VO at +1.0 abs 25.0→), ADDR 1.85, NOTE 2.30, PILL 2.80; bed hit at 6.0 (abs 30.0), hold to END
        const S6 = {fast_beats};
        const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power3.out", duration: 0.5 }} }});
        tl.fromTo("#s6-bloom", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.7 }}, 0);
        tl.fromTo("#s6-h1", {{ autoAlpha: 0, scale: 1.15 }}, {{ autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out" }}, S6.H1);
        tl.fromTo("#s6-match", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, S6.MATCH);
        tl.fromTo("#s6-badge-l, #s6-badge-r", {{ autoAlpha: 0, scale: 0.7 }}, {{ autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(1.5)" }}, S6.MATCH);
        tl.fromTo("#s6-when", {{ autoAlpha: 0, y: 16 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, S6.WHEN);
        tl.fromTo("#s6-h2", {{ autoAlpha: 0, scale: 1.15 }}, {{ autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out" }}, S6.H2);
        tl.fromTo("#s6-addr", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.4 }}, S6.ADDR);
        tl.fromTo("#s6-note", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: 0.4 }}, S6.NOTE);
        tl.fromTo("#s6-mark", {{ autoAlpha: 0, scale: 0.6 }}, {{ autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }}, S6.PILL - 0.2);
        tl.fromTo("#s6-pill", {{ autoAlpha: 0, scale: 0.8, y: 30 }}, {{ autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.4)" }}, S6.PILL);"""
    return cid, dur6, wrap(cid, dur6, "#650c75", css, body, script, A, nomark=True)


# ---- SOUND DESIGN (Nat Geo / ESPN): group "sfx", tracks 12–15 (no same-track overlaps), volumes set from measured peaks:
#   coast -9.8dB→0.39 (-18) · valley -4.6→0.21 · murmur -13.4→0.59 (-18) / 0.35 lower · steps -15.3→0.46 (-22) · drone -8.3→0.21 (-22)
#   hit -4.7→0.68 (-8) · whoosh -4.8→0.55 (-10) · roar -4.9→0.70 (-8). Lanes are clip-local; ambience carved by the voiceover at 0.35.
SFX = [
 # id, file, start, media_start, dur, track, volume, lane points (t,v), carve
 ("sfx-coast","coast-wind-rocket.wav",0.00,0,4.98,12,0.80,[(0,0),(0.4,0.80),(4.48,0.80),(4.98,0)],True),
 ("sfx-drone1","low-drone.wav",0.00,0,8.00,13,0.45,[(0,0),(0.5,0.45),(7.5,0.45),(8.0,0)],True),
 ("sfx-drone2","low-drone.wav",7.50,0,2.50,14,0.45,[(0,0),(0.5,0.45),(2.0,0.45),(2.5,0)],True),
 ("sfx-valley","valley-wind-birds.wav",5.00,0,5.00,12,0.45,[(0,0),(0.4,0.45),(4.5,0.45),(5.0,0)],True),
 ("sfx-whoosh1","whoosh.wav",4.72,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh2","whoosh.wav",9.75,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh3","whoosh.wav",19.85,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh4","whoosh.wav",24.85,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh5","whoosh.wav",29.35,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-murmur1","stadium-murmur.wav",10.00,0,8.00,12,0.66,[(0,0),(0.5,0.66),(7.5,0.66),(8.0,0)],True),
 ("sfx-murmur2","stadium-murmur.wav",17.50,0,8.00,13,0.66,[(0,0),(0.5,0.66),(2.5,0.66),(3.0,0.38),(7.5,0.38),(8.0,0)],True),
 ("sfx-murmur3","stadium-murmur.wav",25.00,0,2.00,12,0.35,[(0,0.35),(1.9,0.04),(2.0,0)],True),
 ("sfx-steps1","footsteps-turf.wav",10.40,0,4.95,14,0.46,[(0,0),(0.3,0.46),(4.65,0.46),(4.95,0)],True),
 ("sfx-steps2","footsteps-turf.wav",15.40,0,4.58,14,0.46,[(0,0),(0.3,0.46),(4.28,0.46),(4.58,0)],True),
 ("sfx-steps3","footsteps-turf.wav",20.40,0,4.58,14,0.46,[(0,0),(0.3,0.46),(4.28,0.46),(4.58,0)],True),
 ("sfx-hit","shield-hit.wav",27.10,0,3.00,14,0.68,[],False),
 ("sfx-roar","crowd-roar.wav",27.25,0,6.00,13,0.62,[(0,0),(0.6,0.62),(2.25,0.62),(2.75,0.35),(5.5,0.35),(6.0,0)],True),
 ("sfx-drone3","low-drone.wav",33.50,0,4.00,12,0.45,[(0,0),(0.5,0.45),(3.2,0.45),(4.0,0)],True),
]
def sfx_html(rows=None):
    import json
    out=[]
    for i,f,st,ms,d,tr,v,lane,carve in (rows or SFX):
        auto = " data-automation='" + json.dumps({"version":1,"lanes":[{"target":"volume","points":[{"t":t,"v":vv} for t,vv in lane]}]}, separators=(",",":")) + "'" if lane else ""
        cv = " data-fx-carve='" + json.dumps({"enabled":True,"sources":["voiceover"],"strength":0.35}, separators=(",",":")) + "'" if carve else ""
        out.append('      <audio id="%s" class="clip" data-audio-group="sfx" src="public/sfx/%s" data-start="%.2f" data-media-start="%s" data-duration="%.2f" data-track-index="%d" data-volume="%s"%s%s></audio>' % (i,f,st,ms,d,tr,v,auto,cv))
    return "\n".join(out)

def index(A, comp_dir, entries, vo=None, sfx_rows=None, bed=(5.50,0.0,30.00), total=37.50):
    H=A['H']
    hosts="\n".join(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{comp_dir}/{cid}.html" data-start="{st:.2f}" data-duration="{d:.2f}" data-track-index="{2 if cid=="s1b-valley" else 1}"></div>' for cid,st,d in entries)
    vo = vo or [("vo-a",10.30,0.00,1.50),("vo-b",15.30,1.76,1.20),("vo-c",20.30,3.02,1.55),("vo-d",21.90,4.80,2.70),("vo-e",25.30,7.92,1.30),("vo-f",27.10,9.54,2.60),("vo-g",30.50,12.16,1.40)]
    vos="\n".join(f'      <audio id="{i}" class="clip" data-audio-group="voiceover" src="public/vo-arthur.wav" data-start="{s:.2f}" data-media-start="{m:.2f}" data-duration="{d:.2f}" data-track-index="10" data-volume="1"></audio>' for i,s,m,d in vo)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      @font-face {{ font-family: "Plus Jakarta Sans"; src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-style: normal; }}
      html, body {{ margin: 0; width: 1080px; height: {H}px; overflow: hidden; background: #050308; }}
      body {{ font-family: "Plus Jakarta Sans", sans-serif; }}
      #root {{ position: relative; width: 1080px; height: {H}px; overflow: hidden; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <!-- TWO LEGENDS, ONE FIELD — Big Game trailer. Opens on the two "land" clips (coast / valley), then the reveals. Lompoc Braves vs Cabrillo Conquistadores, Fri Sep 4 2026 7:00 PM, HUYCK STADIUM (515 W College Ave). 30.0s -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total:.2f}" data-width="1080" data-height="{H}">
{hosts}

      <!-- VO: Arthur read split to the beats (file onsets: Two 0.00 · legends 1.76 · field 3.02 · Friday 4.80 · Big Game 7.92 · Seven 9.54 · This is 12.16). Bed: 30s trailer bed, final hit is the button. -->
{vos}
{sfx_html(sfx_rows)}
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bed.wav" data-start="{bed[0]:.2f}" data-media-start="{bed[1]:.2f}" data-duration="{bed[2]:.2f}" data-track-index="11" data-volume="0.56" data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.4}}'></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""

for name, A, comp_dir, idx in [("9x16", dict(H=1920,BAR=115,MT=150,HERO=120,SUB=44,LB=21), "compositions", "index.html"), ("4x5", dict(H=1350,BAR=80,MT=100,HERO=100,SUB=38,LB=19), "compositions-4x5", "index-4x5.tmpl")]:
    scenes=[land_scene("s1a-coast","land-cabrillo.mp4",GOLD,"Vandenberg Village","From the coast.",A), land_scene("s1b-valley","land-lompoc.mp4","#9fb6ff","Lompoc Valley","From the valley.",A,push_in=True,dip_out=True,dur=5.28), hero_scene("s2-conq","clip-conq2-reveal.mp4",GOLD,"Cabrillo","The Conquistador",A,frm="From Vandenberg Village"), hero_scene("s3-brave","clip-brave-reveal.mp4","#9fb6ff","Lompoc","The Brave",A,frm="From downtown Lompoc"), s4(A), s5(A), s6(A)]
    starts=[0.00,4.72,10.00,15.00,20.00,25.00,29.50]; entries=[]
    for (cid,dur,html),st in zip(scenes,starts):
        open(f"{P}/{comp_dir}/{cid}.html","w").write(html); entries.append((cid,st,dur))
    open(f"{P}/{idx}","w").write(index(A,comp_dir,entries))
    print("wrote", name, [e[0] for e in entries])

# ===== TikTok fast cut: index-tiktok.html (9:16, 24.0s), compositions-tt/ =====
A=dict(H=1920,BAR=115,MT=150,HERO=120,SUB=44,LB=21); os.makedirs(f"{P}/compositions-tt", exist_ok=True)
tt=[land_scene("s1a-coast","land-cabrillo.mp4",GOLD,"Vandenberg Village","From the coast.",A,dur=3.00,media_start=1.5,chip_at=0.20,hero_at=0.60),
    land_scene("s1b-valley","land-lompoc.mp4","#9fb6ff","Lompoc Valley","From the valley.",A,push_in=True,dip_out=True,dur=3.28,media_start=1.0,chip_at=0.20,hero_at=0.60),
    hero_scene("s2-conq","clip-conq2-reveal.mp4",GOLD,"Cabrillo","The Conquistador",A,frm="From Vandenberg Village",dur=3.50),
    hero_scene("s3-brave","clip-brave-reveal.mp4","#9fb6ff","Lompoc","The Brave",A,frm="From downtown Lompoc",dur=3.50),
    s4(A,dur=3.00), s5(A), s6(A,fast=True)]
tt_starts=[0.00,2.72,6.00,9.50,13.00,16.00,20.50]; ents=[]
for (cid,dur,html),st in zip(tt,tt_starts):
    open(f"{P}/compositions-tt/{cid}.html","w").write(html); ents.append((cid,st,dur))
tt_vo=[("vo-a",6.30,0.00,1.50),("vo-b",9.80,1.76,1.20),("vo-c",13.30,3.02,1.55),("vo-e",16.30,7.92,1.30),("vo-f",18.60,9.54,2.60),("vo-g",21.30,12.16,1.40)]
tt_sfx=[
 ("sfx-coast","coast-wind-rocket.wav",0.00,0,2.98,12,0.80,[(0,0),(0.3,0.80),(2.6,0.80),(2.98,0)],True),
 ("sfx-drone1","low-drone.wav",0.00,0,6.00,13,0.45,[(0,0),(0.4,0.45),(5.5,0.45),(6.0,0)],True),
 ("sfx-valley","valley-wind-birds.wav",3.00,0,3.00,12,0.45,[(0,0),(0.3,0.45),(2.6,0.45),(3.0,0)],True),
 ("sfx-whoosh1","whoosh.wav",2.72,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh2","whoosh.wav",5.75,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh3","whoosh.wav",12.85,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh4","whoosh.wav",15.85,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-whoosh5","whoosh.wav",20.35,0,2.00,15,0.55,[(0,0.55),(1.2,0.55),(2.0,0)],False),
 ("sfx-murmur1","stadium-murmur.wav",6.00,0,7.00,12,0.59,[(0,0),(0.5,0.59),(6.5,0.59),(7.0,0)],True),
 ("sfx-murmur2","stadium-murmur.wav",12.50,0,4.00,13,0.59,[(0,0),(0.5,0.59),(1.0,0.35),(3.5,0.35),(4.0,0)],True),
 ("sfx-murmur3","stadium-murmur.wav",16.00,0,2.60,12,0.35,[(0,0.35),(2.5,0.04),(2.6,0)],True),
 ("sfx-steps1","footsteps-turf.wav",6.40,0,3.00,14,0.46,[(0,0),(0.3,0.46),(2.7,0.46),(3.0,0)],True),
 ("sfx-steps2","footsteps-turf.wav",9.90,0,3.05,14,0.46,[(0,0),(0.3,0.46),(2.75,0.46),(3.05,0)],True),
 ("sfx-steps3","footsteps-turf.wav",13.40,0,2.58,14,0.46,[(0,0),(0.3,0.46),(2.28,0.46),(2.58,0)],True),
 ("sfx-hit","shield-hit.wav",18.60,0,3.00,14,0.68,[],False),
 ("sfx-roar","crowd-roar.wav",18.75,0,5.25,13,0.62,[(0,0),(0.6,0.62),(1.75,0.62),(2.25,0.35),(4.75,0.35),(5.25,0)],True),
]
open(f"{P}/index-tiktok.tmpl","w").write(index(A,"compositions-tt",ents,vo=tt_vo,sfx_rows=tt_sfx,bed=(0.00,6.00,24.00),total=24.00))
print("wrote tiktok", [(c,st) for c,st,d in ents])
