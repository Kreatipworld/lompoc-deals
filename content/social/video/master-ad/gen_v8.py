#!/usr/bin/env python3
"""
THIS IS LOMPOC v8 — master commercial for the mixed experiences (businesses, visitors, locals).
v7 skeleton (hook, ten-photo pride, phone UX, EN→ES, tag, end) + a "20,000+ people last month"
card + four Higgsfield scenes (k1 locals, k2 visitors, k3 owner, k4 town). Dylan v8 read.
Writes index-v8.tmpl + index-v8-4x5.tmpl and the c*/d*/s* compositions; v6/v7 files stay untouched.
    python3 gen_v8.py
"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
MV = os.path.join(HERE, "..", "master-visitors", "gen.py")
src = open(MV).read().split("\nfor key, A in ASPECTS.items():")[0]
ns = {"__file__": MV}
exec(compile(src, MV, "exec"), ns)
GOLD, INK, PURPLE, DARK, BG, X = ns["GOLD"], ns["INK"], ns["PURPLE"], ns["DARK"], ns["BG"], ns["X"]

TOTAL = 42.00
VO_FILE, VO_START, VO_DUR = "public/vo-v8-dylan.wav", 0.60, 39.76
SUBS = [
    [0.60, 6.25, "Say Lompoc, and folks picture the highway. The fog. The base. We picture this."],
    [7.60, 13.30, "Cupcakes on H Street. Flowers next door. Pizza on I. A patio on Ocean Avenue."],
    [14.20, 17.60, "Trophies, wine, glass, plumbing, builders."],
    [18.50, 21.40, "Last month, Lompoc Locals reached more than twenty thousand people."],
    [22.00, 24.60, "Locals looking for tonight. Visitors looking for where to eat."],
    [25.20, 26.20, "Owners looking to be found."],
    [26.90, 29.30, "They search. They open a page. They tap the number."],
    [30.25, 31.30, "In English, and in Spanish."],
    [32.10, 33.70, "One platform, connecting all of Lompoc."],
    [34.30, 36.90, "Tag a business that belongs here, and we'll show them off."],
    [37.55, 39.90, "Lompoc Locals. One place for the whole town."],
]
ns["SUBS"] = SUBS; ns["TOTAL"] = TOTAL

# id, start, dur (absolute, VO at 0.60)
SCENES = [
    ("c1-hook",     0.00,  7.30),
    ("c2-pride",    7.30, 11.00),
    ("d3-reach",   18.10,  3.85),
    ("d4-locals",  21.75,  1.70),
    ("d5-visitors",23.25,  1.95),
    ("d6-owner",   25.00,  1.55),
    ("s2-search",  26.35,  1.40),
    ("s3-page",    27.55,  1.05),
    ("s5-tap",     28.45,  1.65),
    ("c5c-lang",   29.95,  1.95),
    ("d7-town",    31.75,  2.70),
    ("c6-tag",     34.25,  3.30),
    ("c7-end",     37.35,  4.65),
]

def read(p): return open(os.path.join(HERE, p)).read()
def write(p, s):
    os.makedirs(os.path.dirname(os.path.join(HERE, p)), exist_ok=True)
    open(os.path.join(HERE, p), "w").write(s)

def v6_copy(folder, src_id, dst_prefix, dur, beats_old_re, beats_new):
    s = read(f"{folder}/{src_id}.html")
    s = s.replace(src_id.split("-")[0] + "-", dst_prefix)
    s = re.sub(r'data-duration="[0-9.]+"', f'data-duration="{dur:.2f}"', s, count=1)
    s, n = re.subn(beats_old_re, beats_new, s)
    assert n == 1, (src_id, "beats")
    return s

# ── v6/v7 scenes, retimed ────────────────────────────────────────────────────
def c1(folder):  # 0.00–7.30: SAY LOMPOC 0.80 · HIGHWAY 2.56 · FOG 3.76 · BASE 5.20 · case 6.12
    s = v6_copy(folder, "b1-hook", "c1-", 7.30,
                r"const B1 = \{[^}]*\};", "const B1 = { PRE: 0.35, S0: 0.80, S1: 2.56, S2: 3.76, S3: 5.20, CUT: 6.12, END: 7.30 };")
    s = s.replace('<div class="stamp" id="c1-s1">', '<div class="stamp" id="c1-s0">Say Lompoc.</div>\n    <div class="stamp" id="c1-s1">', 1)
    s = s.replace('[["#c1-s1", B1.S1, B1.S2],', '[["#c1-s0", B1.S0, B1.S1], ["#c1-s1", B1.S1, B1.S2],', 1)
    s = s.replace('id="c1-pre" style="position: absolute; left: 84px; top: 42%;', 'id="c1-pre" style="position: absolute; left: 84px; top: 30%;', 1)
    return s

def c2(folder):  # 7.30–18.30: cupcakes 7.70 · flowers 9.36 · pizza 10.90 · patio 12.60 · trophies 14.28 · wine 15.16 · glass 15.86 · plumbing 16.70 · builders 17.36
    s = v6_copy(folder, "b2-pride", "c2-", 11.00,
                r"const B2 = \[[^\]]*\], END = [0-9.]+;",
                "const B2 = [0.00, 2.06, 3.60, 5.30, 6.98, 7.86, 8.56, 9.40, 10.06], END = 11.00;")
    s, n = re.subn(r'    <div class="hold" id="c2-h6">.*?</div></div>\n', "", s, flags=re.S)
    assert n == 1, "garden shoppe hold"
    for i in (7, 8, 9):
        s = s.replace(f'id="c2-h{i}"', f'id="c2-h{i-1}"').replace(f'id="c2-i{i}"', f'id="c2-i{i-1}"')
    return s

def c6(folder):  # 34.25–37.55: @ typing 34.40 · CTA 35.90
    s = v6_copy(folder, "b4-tag", "c6-", 3.30, r"const B4 = \{[^}]*\};", "const B4 = { ASK: 0.0, TYPE: 0.15, CTA: 1.65, END: 3.30 };")
    s = re.sub(r'(\.cta \{[^}]*?bottom: )[0-9.]+%', lambda m: m.group(1) + ("27%" if folder == "compositions" else "25%"), s, count=1)
    return s

def c7(folder):  # 37.35–42.00: mark 37.60 · url 38.30 · line 38.70
    s = v6_copy(folder, "b5-end", "c7-", 4.65, r"const B5 = \{[^}]*\};", "const B5 = { MARK: 0.25, URL: 0.95, END: 4.65 };")
    s = s.replace(">TAG A LOMPOC BUSINESS 👇</div>", ">ONE PLACE FOR THE WHOLE TOWN.</div>")
    s = re.sub(r'(id="c7-credit" style="[^"]*?bottom: )[0-9.]+%', lambda m: m.group(1) + ("8.5%" if folder == "compositions" else "8%"), s, count=1)
    return s

def lang(A, dur):  # 29.95–31.90: EN 30.20 · flip 30.95
    cid = "c5c-lang"; s = f'[data-composition-id="{cid}"]'
    css = ns["base_css"](cid, A) + f"""
      {s} .shot2 {{ opacity: 0; }}
      {s} .lchips {{ position: absolute; left: {A['chips']['left']}px; top: {A['chips']['top']}px; z-index: 36; display: flex; gap: 14px; }}
      {s} .lchip {{ display: inline-block; background: rgba(255,255,255,0.14); color: #fff; font-weight: 800; font-size: {34 if A['H']==1920 else 28}px; letter-spacing: 3px; padding: 12px 26px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.35); opacity: 0; will-change: transform, opacity; }}
      {s} .lchip.on {{ background: #0b992f; border-color: #0b992f; }}
    """
    extra = f'<img class="shot shot2" id="{cid}-es" src="public/shots/home-es.png" alt="" />'
    body = ns["phone_html"](cid, A, "home.png", extra) + f'''
      <div class="lchips"><span class="lchip on" id="{cid}-en">EN</span><span class="lchip" id="{cid}-esc">ES</span></div>'''
    F = 1.00  # flip at 30.95 abs
    script = f'''        tl.fromTo("#{cid}-en", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.3 }}, 0.25);
        tl.fromTo("#{cid}-esc", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 0.55, y: 0, duration: 0.3 }}, 0.33);
        tl.to("#{cid}-screen", {{ scaleX: 0.92, duration: 0.14, ease: "power2.in" }}, {F-0.14:.2f});
        tl.set("#{cid}-es", {{ autoAlpha: 1 }}, {F:.2f});
        tl.to("#{cid}-screen", {{ scaleX: 1, duration: 0.16, ease: "power2.out" }}, {F:.2f});
        tl.to("#{cid}-en", {{ autoAlpha: 0.55, backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.35)", duration: 0.2 }}, {F-0.02:.2f});
        tl.to("#{cid}-esc", {{ autoAlpha: 1, backgroundColor: "#0b992f", borderColor: "#0b992f", duration: 0.2 }}, {F-0.02:.2f});'''
    return ns["shell"](cid, A, dur, css, body, script)

# ── new v8 scenes ────────────────────────────────────────────────────────────
def d3_reach(A, dur):  # 18.10–21.95: count 18.90→20.90 · "PEOPLE LAST MONTH" 20.90 · chips 21.30
    cid = "d3-reach"; s = f'[data-composition-id="{cid}"]'; big = A["H"] == 1920
    css = ns["base_css"](cid, A) + f"""
      {s} .col {{ position: absolute; left: 0; right: 0; top: {'27%' if big else '22%'}; z-index: 36; text-align: center; }}
      {s} .num {{ display: block; color: {GOLD}; font-weight: 800; font-size: {240 if big else 170}px; line-height: 0.95; letter-spacing: -8px; text-shadow: 0 14px 50px rgba(10,6,12,0.6); font-variant-numeric: tabular-nums; opacity: 0; will-change: transform, opacity; }}
      {s} .line {{ display: block; margin-top: {28 if big else 18}px; color: #fff; font-weight: 800; font-size: {64 if big else 46}px; letter-spacing: 3px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      {s} .who {{ display: flex; justify-content: center; gap: 14px; margin-top: {38 if big else 24}px; flex-wrap: wrap; padding: 0 60px; }}
      {s} .w {{ display: inline-block; background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.4); color: #fff; font-weight: 800; font-size: {30 if big else 24}px; letter-spacing: 3px; padding: 12px 24px; border-radius: 999px; text-transform: uppercase; opacity: 0; will-change: transform, opacity; }}
      {s} .bloom {{ position: absolute; left: 50%; top: 32%; width: 900px; height: 900px; margin-left: -450px; border-radius: 50%; background: radial-gradient(circle, rgba(239,198,24,0.20), rgba(239,198,24,0) 62%); }}
    """
    body = f'''      <div class="field"></div>
      <div class="bloom" data-layout-allow-overflow></div>
      <div class="col">
        <span class="num" id="{cid}-num">0</span>
        <span class="line" id="{cid}-line">People last month</span>
        <div class="who"><span class="w" id="{cid}-w0">Businesses</span><span class="w" id="{cid}-w1">Visitors</span><span class="w" id="{cid}-w2">Locals</span></div>
      </div>'''
    script = f'''        const n = {{ v: 0 }};
        tl.fromTo("#{cid}-num", {{ autoAlpha: 0, scale: 0.9 }}, {{ autoAlpha: 1, scale: 1, duration: 0.4, ease: "expo.out" }}, 0.75);
        tl.to(n, {{ v: 20000, duration: 2.0, ease: "power2.out", onUpdate: () => {{ document.getElementById("{cid}-num").textContent = Math.round(n.v).toLocaleString("en-US") + (n.v >= 19999 ? "+" : ""); }} }}, 0.80);
        tl.fromTo("#{cid}-line", {{ autoAlpha: 0, y: 18 }}, {{ autoAlpha: 1, y: 0, duration: 0.45 }}, 2.80);
        tl.fromTo("#{cid}-w0, #{cid}-w1, #{cid}-w2", {{ autoAlpha: 0, y: 16, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.12, ease: "back.out(1.5)" }}, 3.20);'''
    return ns["shell"](cid, A, dur, css, body, script)

def vid_scene(cid, A, dur, src, media_start, chip=None, chip_at=0.25, titles=None, grade="contrast(1.06) saturate(1.05)"):
    """Full-bleed Higgsfield clip (cover-fit), chip top-left under the mark, optional two-line title."""
    s = f'[data-composition-id="{cid}"]'; big = A["H"] == 1920
    css = ns["base_css"](cid, A) + f"""
      {s} .vidwrap {{ position: absolute; inset: 0; overflow: hidden; will-change: transform; transform-origin: 50% 50%; }}
      {s} video {{ display: block; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: {grade}; }}
      {s} .scrim {{ position: absolute; inset: 0; z-index: 31; background: linear-gradient(to bottom, rgba(20,10,23,0.55) 0%, rgba(20,10,23,0.0) 34%, rgba(20,10,23,0.0) 62%, rgba(20,10,23,0.6) 100%); }}
      {s} .mark {{ position: absolute; top: {150 if big else 100}px; right: 84px; width: {96 if big else 76}px; height: auto; z-index: 40; }}
      {s} .kchip {{ position: absolute; left: 84px; top: {300 if big else 200}px; z-index: 36; display: inline-block; background: {GOLD}; color: {INK}; font-weight: 800; font-size: {30 if big else 24}px; letter-spacing: 3px; padding: 12px 24px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; opacity: 0; will-change: transform, opacity; box-shadow: 0 10px 26px rgba(10,6,12,0.45); }}
      {s} .ttl {{ position: absolute; left: 84px; right: 84px; top: {'40%' if big else '36%'}; z-index: 36; }}
      {s} .tt {{ display: block; color: #fff; font-weight: 800; font-size: {116 if big else 84}px; line-height: 0.96; letter-spacing: -4px; text-transform: uppercase; text-shadow: 0 8px 34px rgba(10,6,12,0.7); opacity: 0; will-change: transform, opacity; }}
      {s} .tt em {{ font-style: normal; color: {GOLD}; }}
    """
    body = f'''      <div class="vidwrap" id="{cid}-w0" data-layout-allow-overflow><video id="{cid}-vid" class="clip" src="public/{src}" data-start="0" data-media-start="{media_start:.2f}" data-duration="{dur:.2f}" data-track-index="0" muted playsinline></video></div>
      <div class="scrim"></div>
      <img class="mark" src="public/mark-white.png" alt="" />'''
    script = f'''        tl.fromTo("#{cid}-w0", {{ scale: 1.0 }}, {{ scale: 1.05, duration: {dur:.2f}, ease: "none" }}, 0);'''
    if chip:
        body += f'\n      <span class="kchip" id="{cid}-c0">{chip}</span>'
        script += f'''
        tl.fromTo("#{cid}-c0", {{ autoAlpha: 0, y: 18, scale: 0.94 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, {chip_at:.2f});'''
    if titles:
        body += '\n      <div class="ttl">' + "".join(f'<span class="tt" id="{cid}-t{i}">{t}</span>' for i, (t, _) in enumerate(titles)) + '</div>'
        for i, (_, at) in enumerate(titles):
            script += f'''
        tl.fromTo("#{cid}-t{i}", {{ autoAlpha: 0, y: 30, scale: 1.04 }}, {{ autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, {at:.2f});'''
    return ns["shell"](cid, A, dur, css, body, script)

def ux(cid, dur, A):
    if cid == "s2-search":  # typing done ~26.77, results 26.75/26.90/27.05 → rel 0.40/0.55/0.70
        return ns["s2_search"](A, dur).replace(", 0.55);", ", 0.40);").replace(", 0.72);", ", 0.55);").replace(", 0.88);", ", 0.70);")
    if cid == "s3-page":  return ns["s_member"](cid, A, dur, "They open a page", 300, 900, chip_at=0.15)
    if cid == "s5-tap":   return ns["s_member"](cid, A, dur, "They tap the number", 900, 2200, tap=(120, 2655, 430, 100), chip_at=0.15)
    if cid == "c5c-lang": return lang(A, dur)
    if cid == "d3-reach": return d3_reach(A, dur)
    if cid == "d4-locals":   return vid_scene(cid, A, dur, "k1-locals.mp4", 0.00, chip="Locals · Looking for tonight", chip_at=0.25)
    if cid == "d5-visitors": return vid_scene(cid, A, dur, "k2-visitors.mp4", 0.30, chip="Visitors · Looking for where to eat", chip_at=0.25)
    if cid == "d6-owner":    return vid_scene(cid, A, dur, "k3-owner.mp4", 0.60, chip="Owners · Looking to be found", chip_at=0.30)
    if cid == "d7-town":     return vid_scene(cid, A, dur, "k4-town.mp4", 0.00, titles=[("One platform<em>.</em>", 0.25), ("All of Lompoc<em>.</em>", 1.15)])
    raise ValueError(cid)

def index(A, folder, comment):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs-v8.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="15"></div>')
    return f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={A['W']}, height={A['H']}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      @font-face {{ font-family: "Plus Jakarta Sans"; src: url("public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); font-weight: 200 800; font-style: normal; }}
      html, body {{ margin: 0; width: {A['W']}px; height: {A['H']}px; overflow: hidden; background: #140a17; }}
      body {{ font-family: "Plus Jakarta Sans", sans-serif; }}
      #root {{ position: relative; width: {A['W']}px; height: {A['H']}px; overflow: hidden; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <!-- {comment} -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="{A['W']}" data-height="{A['H']}">
{chr(10).join(rows)}

      <audio id="vo-v8" class="clip" data-audio-group="voiceover" src="{VO_FILE}" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="1" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bgm-bama-country.mp3" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.5" data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.3}}' data-automation='{{"version":1,"lanes":[{{"target":"volume","points":[{{"t":0,"v":0.5}},{{"t":40.5,"v":0.5}},{{"t":42,"v":0}}]}}]}}'></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''

for key, folder, idx in (("9x16", "compositions", "index-v8.tmpl"), ("4x5", "compositions-4x5", "index-v8-4x5.tmpl")):
    A = ns["ASPECTS"][key]
    write(f"{folder}/c1-hook.html", c1(folder))
    write(f"{folder}/c2-pride.html", c2(folder))
    write(f"{folder}/c6-tag.html", c6(folder))
    write(f"{folder}/c7-end.html", c7(folder))
    for cid, start, dur in SCENES:
        if cid[0] in "sd" or cid == "c5c-lang":
            write(f"{folder}/{cid}.html", ux(cid, dur, A))
    write(f"{folder}/subs-v8.html", ns["subs"](A))
    write(idx, index(A, folder, f"THIS IS LOMPOC v8 — mixed experiences master commercial. {TOTAL:.2f}s. Dylan v8 read at {VO_START}. Generated by gen_v8.py; v6 (index.html, b*) untouched. NOTE: c1/c2/c6/c7 are shared with v7 and now carry v8 timings — rerun gen_v7.py to rebuild v7."))
print("wrote v8:", [s[0] for s in SCENES], "+ subs-v8 for 9x16 and 4x5")
