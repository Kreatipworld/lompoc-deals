#!/usr/bin/env python3
"""
THIS IS LOMPOC v7 — the v6 story cut with the product experience and light info woven in.
Reuses the v6 scenes (b1/b2/b4/b5 → c1/c2/c6/c7, retimed to the v7 Dylan read) and the
master-visitors UX scenes (phone frame: home scroll, search, page/hours/tap, EN→ES, directory).
Writes index-v7.html + index-v7-4x5.tmpl and the c*/s* compositions; v6 files stay untouched.
    python3 gen_v7.py
"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
MV = os.path.join(HERE, "..", "master-visitors", "gen.py")

# ── load the visitors generator without running its write loop ─────────────
src = open(MV).read().split("\nfor key, A in ASPECTS.items():")[0]
ns = {"__file__": MV}
exec(compile(src, MV, "exec"), ns)

TOTAL = 35.00
VO_START, VO_DUR = 0.60, 33.12
SUBS = [
    [0.60, 5.90, "Say Lompoc, and folks picture the highway. The fog. The base. We picture this."],
    [6.60, 11.50, "Cupcakes on H Street. Flowers next door. Pizza on I. A patio on Ocean Avenue."],
    [12.20, 15.00, "Trophies, wine, glass, plumbing, builders."],
    [15.40, 18.40, "Every month, hundreds of locals open one site to find all of it."],
    [18.70, 20.10, "They search. They open a page."],
    [20.60, 22.40, "They check the hours, and they tap the number."],
    [22.85, 24.10, "In English, and in Spanish."],
    [24.70, 26.20, "Every business in town has a page here."],
    [26.55, 30.40, "So tag a Lompoc business that belongs on it. We'll build their page, and show them off."],
    [30.85, 33.30, "Lompoc Locals. One place for the whole town."],
]
ns["SUBS"] = SUBS; ns["TOTAL"] = TOTAL

# id, start, dur  (VO at 0.60)
SCENES = [
    ("c1-hook",   0.00,  6.40),
    ("c2-pride",  6.40,  9.05),
    ("s1-open",   15.20, 3.55),
    ("s2-search", 18.55, 1.40),
    ("s3-page",   19.75, 0.80),
    ("s4-hours",  20.35, 1.25),
    ("s5-tap",    21.40, 1.55),
    ("c5c-lang",  22.80, 1.90),
    ("s6-dir",    24.55, 2.05),
    ("c6-tag",    26.45, 4.35),
    ("c7-end",    30.65, 4.35),
]

def read(p): return open(os.path.join(HERE, p)).read()
def write(p, s):
    os.makedirs(os.path.dirname(os.path.join(HERE, p)), exist_ok=True)
    open(os.path.join(HERE, p), "w").write(s)

def v6_copy(folder, src_id, dst_prefix, dst_id, dur, beats_old_re, beats_new):
    s = read(f"{folder}/{src_id}.html")
    src_prefix = src_id.split("-")[0] + "-"
    s = s.replace(src_prefix, dst_prefix)  # ids, selectors, timeline key
    s = re.sub(r'data-duration="[0-9.]+"', f'data-duration="{dur:.2f}"', s, count=1)
    s, n = re.subn(beats_old_re, beats_new, s)
    assert n == 1, (src_id, "beats")
    return s

def c1(folder):
    return v6_copy(folder, "b1-hook", "c1-", "c1-hook", 6.40,
                   r"const B1 = \{[^}]*\};", "const B1 = { PRE: 0.35, S1: 2.55, S2: 3.40, S3: 4.50, CUT: 5.45, END: 6.40 };")

def c2(folder):
    s = v6_copy(folder, "b2-pride", "c2-", "c2-pride", 9.05,
                r"const B2 = \[[^\]]*\], END = [0-9.]+;",
                "const B2 = [0.00, 1.68, 2.98, 4.12, 5.86, 6.50, 7.02, 7.90, 8.44], END = 9.05;")
    # drop the Garden Shoppe hold (no word for it in the v7 read) and renumber 7..9 → 6..8
    s, n = re.subn(r'    <div class="hold" id="c2-h6">.*?</div></div>\n', "", s, flags=re.S)
    assert n == 1, "garden shoppe hold"
    for i in (7, 8, 9):
        s = s.replace(f'id="c2-h{i}"', f'id="c2-h{i-1}"').replace(f'id="c2-i{i}"', f'id="c2-i{i-1}"')
    return s

def c6(folder):
    return v6_copy(folder, "b4-tag", "c6-", "c6-tag", 4.35,
                   r"const B4 = \{[^}]*\};", "const B4 = { ASK: 0.0, TYPE: 0.35, CTA: 2.45, END: 4.35 };")

def c7(folder):
    s = v6_copy(folder, "b5-end", "c7-", "c7-end", 4.35,
                r"const B5 = \{[^}]*\};", "const B5 = { MARK: 0.25, URL: 0.95, END: 4.35 };")
    s = s.replace(">TAG A LOMPOC BUSINESS 👇</div>", ">ONE PLACE FOR THE WHOLE TOWN.</div>")
    return s

def lang(A, dur):
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
    script = f'''        tl.fromTo("#{cid}-en", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 1, y: 0, duration: 0.3 }}, 0.10);
        tl.fromTo("#{cid}-esc", {{ autoAlpha: 0, y: 14 }}, {{ autoAlpha: 0.55, y: 0, duration: 0.3 }}, 0.18);
        tl.to("#{cid}-screen", {{ scaleX: 0.92, duration: 0.14, ease: "power2.in" }}, 0.78);
        tl.set("#{cid}-es", {{ autoAlpha: 1 }}, 0.92);
        tl.to("#{cid}-screen", {{ scaleX: 1, duration: 0.16, ease: "power2.out" }}, 0.92);
        tl.to("#{cid}-en", {{ autoAlpha: 0.55, backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.35)", duration: 0.2 }}, 0.90);
        tl.to("#{cid}-esc", {{ autoAlpha: 1, backgroundColor: "#0b992f", borderColor: "#0b992f", duration: 0.2 }}, 0.90);'''
    return ns["shell"](cid, A, dur, css, body, script)

def ux(cid, dur, A):
    if cid == "s1-open":
        return ns["s1_open"](A, dur).replace(", 0.90);", ", 0.70);").replace(", 1.80);", ", 1.30);")
    if cid == "s2-search": return ns["s2_search"](A, dur)
    if cid == "s3-page":  return ns["s_member"](cid, A, dur, "They open a page", 300, 900, chip_at=0.15)
    if cid == "s4-hours": return ns["s_member"](cid, A, dur, "They check the hours", 900, 6420, chip_at=0.20)
    if cid == "s5-tap":   return ns["s_member"](cid, A, dur, "They tap the number", 6420, 2200, tap=(120, 2655, 430, 100), chip_at=0.15)
    if cid == "c5c-lang": return lang(A, dur)
    if cid == "s6-dir":
        return ns["s6_dir"](A, dur).replace(">Where the town<", ">Every business<").replace(">is already looking<em>.</em><", ">has a page<em>.</em><")
    raise ValueError(cid)

def index(A, folder, comment):
    rows = []
    for i, (cid, start, dur) in enumerate(SCENES):
        rows.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="{folder}/{cid}.html" data-start="{start:.2f}" data-duration="{dur:.2f}" data-track-index="{i+1}"></div>')
    rows.append(f'      <div id="el-subs" data-composition-id="subs" data-composition-src="{folder}/subs-v7.html" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="13"></div>')
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

      <audio id="vo-v7" class="clip" data-audio-group="voiceover" src="public/vo-v7-dylan.wav" data-start="{VO_START:.2f}" data-media-start="0" data-duration="{VO_DUR:.2f}" data-track-index="10" data-volume="1" data-fade-in="0.05" data-fade-out="0.10"></audio>
      <audio id="music-bed" class="clip" data-audio-group="music" src="public/bgm-bama-country.mp3" data-start="0" data-media-start="0" data-duration="{TOTAL:.2f}" data-track-index="11" data-volume="0.5" data-fx-carve='{{"enabled":true,"sources":["voiceover"],"strength":0.3}}' data-automation='{{"version":1,"lanes":[{{"target":"volume","points":[{{"t":0,"v":0.5}},{{"t":33.5,"v":0.5}},{{"t":35,"v":0}}]}}]}}'></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''

for key, folder, idx in (("9x16", "compositions", "index-v7.tmpl"), ("4x5", "compositions-4x5", "index-v7-4x5.tmpl")):
    A = ns["ASPECTS"][key]
    write(f"{folder}/c1-hook.html", c1(folder))
    write(f"{folder}/c2-pride.html", c2(folder))
    write(f"{folder}/c6-tag.html", c6(folder))
    write(f"{folder}/c7-end.html", c7(folder))
    for cid, start, dur in SCENES:
        if cid.startswith("s") or cid == "c5c-lang":
            write(f"{folder}/{cid}.html", ux(cid, dur, A))
    write(f"{folder}/subs-v7.html", ns["subs"](A))
    write(idx, index(A, folder, f"THIS IS LOMPOC v7 — story + product experience + light info. {TOTAL:.2f}s. Dylan v7 read at {VO_START}. Generated by gen_v7.py; v6 (index.html, b*) untouched."))
print("wrote v7:", [s[0] for s in SCENES], "+ subs-v7 for 9x16 and 4x5")
