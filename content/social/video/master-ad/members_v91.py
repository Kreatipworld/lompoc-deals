"""v9.1 member sequence: one hold per Growth member, hard cuts, spotlight chip + credit pill."""
def members(A, start, dur, MEMBERS, H7, X):
    cid = "m1-members"; s = f'[data-composition-id="{cid}"]'; big = A["H"] == 1920
    bar = A["bar"]; safe_bottom = "21%" if big else "19%"; top = 300 if big else 200
    css = H7["common_css"](cid, A["H"], bar, safe_bottom, top - 110) + f"""
      {s} .hold {{ position: absolute; inset: 0; opacity: 0; }}
      {s} .hold .wrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      {s} .hold img {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.06) saturate(1.1); }}
      {s} .hold .chips {{ position: absolute; left: 84px; right: 84px; bottom: {safe_bottom}; z-index: 35; }}
      {s} .hold .chip {{ opacity: 0; }}
      {s} .pcredit {{ position: absolute; left: 84px; top: {top}px; z-index: 36; color: #fff; font-size: 22px; font-weight: 600; letter-spacing: 1px; background: rgba(10,6,12,0.62); padding: 6px 14px; border-radius: 8px; opacity: 0; }}
    """
    holds, js = [], []
    n = len(MEMBERS)
    for i, (at, img, chip, credit, pos, kb) in enumerate(MEMBERS):
        t0 = round(at - start, 2)
        t1 = round((MEMBERS[i + 1][0] - start) if i + 1 < n else dur, 2)
        holds.append(
            f'      <div class="hold" id="{cid}-h{i}"><div class="wrap" id="{cid}-w{i}" data-layout-allow-overflow>'
            f'<img src="public/{img}" alt="" style="object-position: {pos}" /></div><div class="scrim"></div>\n'
            f'        <div class="pcredit" id="{cid}-cr{i}">photo: {credit}</div>'
            f'<div class="chips"><span class="chip" id="{cid}-c{i}">{chip}</span></div></div>')
        if kb[0] == "scale":
            kbt = f'tl.fromTo("#{cid}-w{i}", {{ scale: {kb[1]} }}, {{ scale: {kb[2]}, duration: {t1 - t0:.2f}, ease: "none" }}, {t0:.2f});'
        else:
            kbt = f'tl.fromTo("#{cid}-w{i}", {{ scale: 1.10, xPercent: {kb[1]} }}, {{ scale: 1.10, xPercent: {kb[2]}, duration: {t1 - t0:.2f}, ease: "none" }}, {t0:.2f});'
        chip_at = t0 + (1.04 if i == 0 else 0.0)
        fast = (t1 - t0) < 0.6
        hide = f' tl.set("#{cid}-h{i}", {{ autoAlpha: 0 }}, {t1:.2f});' if i + 1 < n else ''
        js.append(
            f'        tl.set("#{cid}-h{i}", {{ autoAlpha: 1 }}, {t0:.2f});{hide}\n'
            f'        {kbt}\n'
            f'        tl.fromTo("#{cid}-c{i}", {{ autoAlpha: 0, y: {8 if fast else 18}, scale: 0.96 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: {0.14 if fast else 0.4}, ease: "{"power2.out" if fast else "back.out(1.6)"}" }}, {chip_at:.2f});\n'
            f'        tl.fromTo("#{cid}-cr{i}", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {0.1 if fast else 0.3} }}, {chip_at + (0.0 if fast else 0.3):.2f});')
    body = "\n".join(holds); script = "\n".join(js)
    return (
        '<template>\n'
        f'  <div data-composition-id="{cid}" data-width="1080" data-height="{A["H"]}" data-duration="{dur:.2f}" style="position: absolute; inset: 0; overflow: hidden; background: transparent">\n'
        f'    <style>{css}\n    </style>\n'
        f'    <div class="stage" id="{cid}-stage">\n{body}\n      <div class="vig"></div>\n    </div>\n'
        '    <div class="grain"></div>\n    <div class="cine-bar cine-top"></div><div class="cine-bar cine-bot"></div>\n'
        '    <script>\n      (() => {\n'
        f'        // MEMBERS: hard cuts at gen_v9.py MEMBERS times (absolute - {start:.2f}); first chip at +1.04 ("Cupcakes")\n'
        '        const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out", duration: 0.5 } });\n'
        f'        tl.fromTo("#{cid}-stage", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {X}, ease: "power1.inOut" }}, 0);\n'
        f'{script}\n'
        f'        tl.set({{}}, {{}}, {dur:.2f});\n'
        f'        window.__timelines["{cid}"] = tl;\n'
        '      })();\n    </script>\n  </div>\n</template>\n')
