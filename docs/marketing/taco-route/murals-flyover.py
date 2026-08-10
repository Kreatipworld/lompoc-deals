#!/usr/bin/env python3
"""Town Guides No 3 — Murals of Lompoc, CINEMATIC FLYOVER cut.
Downtown satellite Ken-Burns glides between five verified murals; narration-synced.
Phases: prep | render | final
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import json, os, math, subprocess, sys

W, H, FPS = 1080, 1920, 30
SRC = 2560
INK = (36, 22, 41)
GOLD = (239, 198, 24)
SCRATCH = "/private/tmp/claude-501/-Users-kreatip-Projects-lompoc-deals/753a18a0-0733-4d51-9b67-1f19fbd2978e/scratchpad"
FONT = f"{SCRATCH}/Montserrat-ExtraBold-real.ttf"
MONO = "/System/Library/Fonts/Menlo.ttc"
STYLE = "satellite-streets-v12"

def sh(cmd):
    r = subprocess.run(cmd, shell=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {cmd[:110]}")

def F(s): return ImageFont.truetype(FONT, s)
def FM(s):
    try: return ImageFont.truetype(MONO, s)
    except OSError: return ImageFont.truetype(FONT, s)
def tw(d, t, f):
    b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]
def ease(p): return 1 - (1 - p) ** 3
def smooth(p): return p * p * (3 - 2 * p)

# verified: Lompoc Mural Society (per-mural pages + printed map PDF)
MURALS = [
    {"key": "flower",  "no": "MURAL 01", "name": ["FLOWER", "INDUSTRY"],
     "data": [("1990", "ART MORTIMER"), ("ODD FELLOWS BUILDING", None)],
     "note": "SW corner of Ocean Ave & H St", "lat": 34.63883, "lon": -120.45835},
    {"key": "boatmen", "no": "MURAL 02", "name": ["THE", "BOATMEN"],
     "data": [("2014", "JOHN PUGH"), ("TROMPE L'OEIL · ART ALLEY", None)],
     "note": "112 S. I Street", "lat": 34.63832, "lon": -120.45888},
    {"key": "chumash", "no": "MURAL 03", "name": ["CHUMASH", "INDIANS"],
     "data": [("1992", "ROBERT THOMAS + COMMUNITY"), ("MURAL IN A DAY", None)],
     "note": "118 E. Ocean Avenue", "lat": 34.63870, "lon": -120.45691},
    {"key": "mission", "no": "MURAL 04", "name": ["LA PURISIMA", "MISSION"],
     "data": [("1995", "LEONARDO NUNEZ"), None],
     "note": "206 E. Ocean Avenue", "lat": 34.63866, "lon": -120.45617},
    {"key": "honda",   "no": "MURAL 05", "name": ["TRAGEDY AT", "HONDA POINT"],
     "data": [("2012", "ANN THOMPSON"), ("1923 NAVY DISASTER", None)],
     "note": "City Fire Station wall · S. G Street", "lat": 34.63831, "lon": -120.45661},
]
BY = {m["key"]: m for m in MURALS}

# narration-derived boundaries (silencedetect on hf_20260810_221513)
SHOTS = [("cover", 0.0, 6.2), ("flower", 6.2, 13.9), ("boatmen", 13.9, 20.75),
         ("chumash", 20.75, 28.28), ("mission", 28.28, 34.5), ("honda", 34.5, 42.65),
         ("end", 42.65, 49.9)]
TRANS = {0: "dive", 1: "whip_l", 2: "whip_up", 3: "bank", 4: "dive", 5: "fade"}
XF = {0: 0.9, 1: 0.65, 2: 0.65, 3: 0.85, 4: 0.9, 5: 1.1}

MAPBOX_TOKEN = None
def mb_token():
    global MAPBOX_TOKEN
    if MAPBOX_TOKEN is None:
        for line in open("/Users/kreatip/Projects/lompoc-deals/.env.local"):
            if line.startswith("NEXT_PUBLIC_MAPBOX_TOKEN"):
                MAPBOX_TOKEN = line.split("=", 1)[1].strip().strip('"')
    return MAPBOX_TOKEN

def _merc512(lat, lon, z):
    n = 512 * (2 ** z)
    x = n * (lon + 180.0) / 360.0
    la = math.radians(lat)
    y = n * (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2
    return x, y

def fetch(name, z, cla, clo):
    out = f"sat_{name}.png"
    if not os.path.exists(out):
        url = (f"https://api.mapbox.com/styles/v1/mapbox/{STYLE}/static/"
               f"{clo:.5f},{cla:.5f},{z:.2f},0/1280x1280@2x"
               f"?access_token={mb_token()}&logo=false&attribution=false")
        sh(f"curl -sfL --retry 3 --max-time 60 -o {out} '{url}'")
    return {"z": z, "cla": cla, "clo": clo}

if (len(sys.argv) < 2) or sys.argv[1] == "prep":
    tfs = {}
    for m in MURALS:
        tfs[m["key"]] = fetch(m["key"], 17.6, m["lat"], m["lon"])
        print("SAT", m["key"])
    cla = sum(m["lat"] for m in MURALS) / 5
    clo = sum(m["lon"] for m in MURALS) / 5
    tfs["town"] = fetch("town", 16.0, cla, clo)
    json.dump(tfs, open("sat_tf.json", "w"))
    print("PREP_DONE")
    sys.exit(0)

TF = json.load(open("sat_tf.json"))

def to_src(lat, lon, T):
    x, y = _merc512(lat, lon, T["z"])
    cx, cy = _merc512(T["cla"], T["clo"], T["z"])
    return SRC / 2 + 2 * (x - cx), SRC / 2 + 2 * (y - cy)

def inv_latlon(sx, sy, T):
    n = 512 * (2 ** T["z"])
    cx, cy = _merc512(T["cla"], T["clo"], T["z"])
    x = cx + (sx - SRC / 2) / 2
    y = cy + (sy - SRC / 2) / 2
    lon = x / n * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon

VIGN_TOP = Image.new("L", (1, 260), 0)
for y in range(260):
    VIGN_TOP.putpixel((0, y), int(150 * (1 - y / 260)))
VIGN_TOP = VIGN_TOP.resize((W, 260))
VIGN_BOT = VIGN_TOP.transpose(Image.FLIP_TOP_BOTTOM).resize((W, 420))
INK_IM_T = Image.new("RGB", (W, 260), INK)
INK_IM_B = Image.new("RGB", (W, 420), INK)
IMGS = {k: Image.open(f"sat_{k}.png").convert("RGB") for k in list(BY) + ["town"]}

def render_view(key, cx, cy, vh, pin=None, pin_f=0):
    src = IMGS[key]
    vw = vh * (W / H)
    cx = max(vw / 2, min(SRC - vw / 2, cx))
    cy = max(vh / 2, min(SRC - vh / 2, cy))
    box = (int(cx - vw / 2), int(cy - vh / 2), int(cx + vw / 2), int(cy + vh / 2))
    im = src.crop(box).resize((W, H), Image.LANCZOS)
    if pin is not None:
        s = W / vw
        px, py = (pin[0] - box[0]) * s, (pin[1] - box[1]) * s
        if -120 < px < W + 120 and -120 < py < H + 120:
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            ph = (pin_f % FPS) / FPS
            r = 44 + 52 * ph
            a = int(200 * (1 - ph))
            d.ellipse([px - r, py - r, px + r, py + r], outline=(*GOLD, a), width=9)
            d.ellipse([px - 30, py - 30, px + 30, py + 30], fill=(*GOLD, 255), outline=(*INK, 255), width=5)
            num = "0" + str([m["key"] for m in MURALS].index(key) + 1) if key in BY else ""
            f_m = F(26)
            d.text((px - tw(d, num, f_m) / 2, py - 17), num, font=f_m, fill=(*INK, 255))
            im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    im.paste(INK_IM_T, (0, 0), VIGN_TOP)
    im.paste(INK_IM_B, (0, H - 420), VIGN_BOT)
    return im

def draw_lockup(im, mu, a, xoff):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f_p = F(27)
    w_p = tw(d, mu["no"], f_p)
    x0 = 64 + xoff
    d.rounded_rectangle([x0, 108, x0 + w_p + 40, 160], radius=26, fill=(*GOLD, a))
    d.text((x0 + 20, 118), mu["no"], font=f_p, fill=(*INK, a))
    size = 62
    f_a, f_b = F(size), F(int(size * 0.72))
    while tw(d, mu["name"][0] + " ", f_a) + tw(d, mu["name"][1], f_b) > W - 128 and size > 38:
        size -= 3; f_a, f_b = F(size), F(int(size * 0.72))
    d.text((x0, 178), mu["name"][0], font=f_a, fill=(255, 255, 255, a),
           stroke_width=4, stroke_fill=(*INK, min(a, 215)))
    d.text((x0 + tw(d, mu["name"][0] + " ", f_a), 178 + int(size * 0.22)), mu["name"][1],
           font=f_b, fill=(*GOLD, a), stroke_width=4, stroke_fill=(*INK, min(a, 215)))
    im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))

def glassreg(im, box):
    x0, y0, x1, y1 = [int(v) for v in box]
    x0 = max(0, x0); y0 = max(0, y0); x1 = min(W, x1); y1 = min(H, y1)
    reg = im.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(14))
    im.paste(reg, (x0, y0))

def draw_data_cards(im, mu, trel, dur):
    start = dur * 0.38
    x = 64
    base_y = 1566
    items = [c for c in mu["data"] if c]
    for i, (val, lab) in enumerate(items):
        t0 = start + i * 0.30
        p = min(1.0, max(0.0, (trel - t0) / 0.42))
        if p <= 0:
            break
        ep = ease(p); a = int(255 * ep)
        yoff = int(34 * (1 - ep))
        dm = ImageDraw.Draw(im)
        if lab is not None:
            f_v, f_l = F(58), F(24)
            cw = max(tw(dm, val, f_v), tw(dm, lab, f_l)) + 60
            ch = 152
            y0 = base_y + yoff
            glassreg(im, (x, y0, x + cw, y0 + ch))
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            d.rounded_rectangle([x, y0, x + cw, y0 + ch], radius=22,
                                fill=(*INK, int(150 * ep)), outline=(*GOLD, int(210 * ep)), width=2)
            d.rectangle([x, y0 + 24, x + 6, y0 + ch - 24], fill=(*GOLD, a))
            d.text((x + 30, y0 + 18), val, font=f_v, fill=(255, 255, 255, a))
            d.text((x + 30, y0 + 100), lab, font=f_l, fill=(*GOLD, a))
            im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))
            x += cw + 28
        else:
            f_t = F(30)
            cw = tw(dm, val, f_t) + 64
            ch = 74
            y0 = base_y + 39 + yoff
            glassreg(im, (x, y0, x + cw, y0 + ch))
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            d.rounded_rectangle([x, y0, x + cw, y0 + ch], radius=18,
                                fill=(*INK, int(150 * ep)), outline=(*GOLD, int(210 * ep)), width=2)
            d.rectangle([x, y0 + 16, x + 6, y0 + ch - 16], fill=(*GOLD, a))
            d.text((x + 30, y0 + 17), val, font=f_t, fill=(255, 255, 255, a))
            im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))
            x += cw + 28
    pn = min(1.0, max(0.0, (trel - (start + len(items) * 0.30 + 0.35)) / 0.4))
    if pn > 0:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        d.text((66, 1748), mu["note"], font=F(29), fill=(228, 218, 238, int(255 * ease(pn))))
        im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))

def draw_hud(im, T, cx, cy, a=255):
    lat, lon = inv_latlon(cx, cy, T)
    txt = f"{lat:.4f}°N {abs(lon):.4f}°W"
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f_m = FM(25)
    wt = tw(d, txt, f_m)
    x1 = W - 56
    d.ellipse([x1 - wt - 30, 124, x1 - wt - 14, 140], fill=(*GOLD, a))
    d.text((x1 - wt, 118), txt, font=f_m, fill=(255, 255, 255, int(a * 0.88)),
           stroke_width=2, stroke_fill=(*INK, int(a * 0.6)))
    sat = "SATELLITE VIEW"
    f_s = FM(19)
    d.text((x1 - tw(d, sat, f_s), 156), sat, font=f_s, fill=(*GOLD, int(a * 0.85)))
    im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))

def mural_frame(key, trel, dur, vh_mult=1.0, show_ui=True):
    mu = BY[key]
    T = TF[key]
    mx, my = to_src(mu["lat"], mu["lon"], T)
    p = smooth(min(1.0, trel / max(0.001, dur - 0.25)))
    # Ken Burns: drift in from an offset, push from wide to close
    ang = hash(key) % 628 / 100.0
    ox, oy = 340 * math.cos(ang), 260 * math.sin(ang)
    cx = mx + ox * (1 - p) * 0.8
    cy = my + oy * (1 - p) * 0.8
    vh = 1650 - 420 * p
    im = render_view(key, cx, cy, vh * vh_mult, pin=(mx, my), pin_f=int(trel * FPS))
    if show_ui:
        a = int(255 * min(1.0, max(0.0, (trel - 0.25) / 0.45)))
        xoff = int(-40 * (1 - min(1.0, max(0.0, (trel - 0.25) / 0.45))))
        if a > 0:
            draw_lockup(im, mu, a, xoff)
            draw_hud(im, T, cx, cy, a)
        draw_data_cards(im, mu, trel, dur)
    return im

def cover_frame(trel, dur):
    T = TF["town"]
    p = smooth(min(1.0, trel / dur))
    vh = 2560 - 300 * p
    cx, cy = SRC / 2, SRC / 2
    im = render_view("town", cx, cy, vh)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    ap = int(255 * min(1.0, trel / 0.6))
    vw = vh * (W / H)
    bx0, by0 = max(vw / 2, min(SRC - vw / 2, cx)) - vw / 2, max(vh / 2, min(SRC - vh / 2, cy)) - vh / 2
    s = W / vw
    for i, m in enumerate(MURALS):
        x, y = to_src(m["lat"], m["lon"], T)
        x, y = (x - bx0) * s, (y - by0) * s
        d.ellipse([x - 30, y - 30, x + 30, y + 30], fill=(*GOLD, ap), outline=(*INK, ap), width=4)
        num = f"0{i+1}"; f_m = F(26)
        d.text((x - tw(d, num, f_m) / 2, y - 18), num, font=f_m, fill=(*INK, ap))
    f_p = F(30); pill = "TOWN GUIDES · Nº 3"
    w_p = tw(d, pill, f_p); px0 = (W - w_p) // 2 - 24
    d.rounded_rectangle([px0, 1470, px0 + w_p + 48, 1530], radius=30, fill=(*GOLD, ap))
    d.text(((W - w_p) // 2, 1484), pill, font=f_p, fill=(*INK, ap))
    t1 = "MURALS OF LOMPOC"; f1 = F(84)
    d.text((((W - tw(d, t1, f1)) // 2), 1556), t1, font=f1, fill=(255, 255, 255, ap),
           stroke_width=3, stroke_fill=(*INK, min(ap, 170)))
    t2 = "A downtown walking gallery"; f2 = F(36)
    d.text(((W - tw(d, t2, f2)) // 2, 1680), t2, font=f2, fill=(232, 224, 238, ap))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")

def end_frame(trel, dur):
    T = TF["town"]
    p = smooth(min(1.0, trel / (dur * 0.7)))
    vh = 1800 + 700 * p
    im = render_view("town", SRC / 2, SRC / 2, vh)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    ap = int(235 * min(1.0, max(0.0, (trel - 0.8) / 0.7)))
    if ap > 0:
        d.rounded_rectangle([70, 620, W - 70, 1300], radius=36, fill=(*INK, min(ap, 216)))
        t1 = "MURALS OF LOMPOC"; f1 = F(70)
        d.text(((W - tw(d, t1, f1)) // 2, 706), t1, font=f1, fill=(255, 255, 255, ap))
        t2 = "Every mural · Every corner · All in one place"; f2 = F(35)
        d.text(((W - tw(d, t2, f2)) // 2, 822), t2, font=f2, fill=(210, 196, 220, ap))
        t3 = "lompoclocals.com"; f3 = F(52)
        d.text(((W - tw(d, t3, f3)) // 2, 912), t3, font=f3, fill=(*GOLD, ap))
        t4 = "From the Lompoc Locals town guides"; f4 = F(28)
        d.text(((W - tw(d, t4, f4)) // 2, 1080), t4, font=f4, fill=(178, 166, 188, ap))
        t5 = "Mural facts · Lompoc Mural Society"; f5 = F(24)
        d.text(((W - tw(d, t5, f5)) // 2, 1140), t5, font=f5, fill=(150, 138, 160, ap))
        t6 = "Maps © Mapbox · © OpenStreetMap"; f6 = F(24)
        d.text(((W - tw(d, t6, f6)) // 2, 1186), t6, font=f6, fill=(150, 138, 160, ap))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")

def scene_frame(idx, trel, vh_mult=1.0, show_ui=True):
    key, t0, t1 = SHOTS[idx]
    dur = t1 - t0
    if key == "cover":
        return cover_frame(trel, dur)
    if key == "end":
        return end_frame(trel, dur)
    return mural_frame(key, trel, dur, vh_mult, show_ui)

def punch(im, s):
    if s <= 1.001:
        return im
    w2, h2 = int(W / s), int(H / s)
    x0, y0 = (W - w2) // 2, (H - h2) // 2
    return im.crop((x0, y0, x0 + w2, y0 + h2)).resize((W, H), Image.LANCZOS)

def whip(fa, fb, b, vertical=False):
    e = smooth(b)
    if not vertical:
        canvas = Image.new("RGB", (2 * W, H))
        canvas.paste(fa, (0, 0)); canvas.paste(fb, (W, 0))
        x0 = int(e * W)
        im = canvas.crop((x0, 0, x0 + W, H))
    else:
        canvas = Image.new("RGB", (W, 2 * H))
        canvas.paste(fa, (0, 0)); canvas.paste(fb, (0, H))
        y0 = int(e * H)
        im = canvas.crop((0, y0, W, y0 + H))
    blur = 13.0 * math.sin(math.pi * b)
    if blur > 1.0:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    d = ImageDraw.Draw(im)
    if not vertical:
        sx = W - int(e * W)
        if -8 <= sx <= W + 8:
            d.rectangle([sx - 5, 0, sx + 5, H], fill=GOLD)
    else:
        sy = H - int(e * H)
        if -8 <= sy <= H + 8:
            d.rectangle([0, sy - 5, W, sy + 5], fill=GOLD)
    return im

def bank(fa, fb, b):
    e = smooth(b)
    fa2 = punch(fa.rotate(9.0 * e, resample=Image.BILINEAR), 1.32)
    fb2 = punch(fb.rotate(-9.0 * (1 - e), resample=Image.BILINEAR), 1.32)
    blur = 10.0 * math.sin(math.pi * b)
    if blur > 1.0:
        fa2 = fa2.filter(ImageFilter.GaussianBlur(blur))
        fb2 = fb2.filter(ImageFilter.GaussianBlur(blur))
    mix = min(1.0, max(0.0, (b - 0.22) / 0.56))
    im = Image.blend(fa2, fb2, smooth(mix))
    return ImageEnhance.Brightness(im).enhance(1.0 - 0.12 * math.sin(math.pi * b))

if sys.argv[1] == "render":
    os.makedirs("fr_fly", exist_ok=True)
    total_f = int(SHOTS[-1][2] * FPS)
    a0 = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    a1 = int(sys.argv[3]) if len(sys.argv) > 3 else total_f
    for gf in range(a0, min(a1, total_f)):
        gt = gf / FPS
        idx = next(i for i, (k, s, e) in enumerate(SHOTS) if s <= gt < e or (i == len(SHOTS) - 1))
        key, s, e = SHOTS[idx]
        trel = gt - s
        nxt = idx + 1 if idx + 1 < len(SHOTS) else None
        xf = XF.get(idx, 0.8)
        if nxt is not None and gt >= e - xf:
            b = (gt - (e - xf)) / xf
            sb = smooth(b)
            style = TRANS.get(idx, "dive")
            if style == "dive":
                fa = scene_frame(idx, trel, vh_mult=1.0 + 0.9 * sb, show_ui=b < 0.3)
                fb = scene_frame(nxt, 0.0, vh_mult=1.0 + 1.2 * (1 - sb), show_ui=False)
                fa = punch(fa, 1.0 + 0.22 * sb)
                fb = punch(fb, 1.0 + 0.12 * (1 - sb))
                ba = 9.0 * sb; bb = 9.0 * (1 - sb)
                if ba > 0.6: fa = fa.filter(ImageFilter.GaussianBlur(ba))
                if bb > 0.6: fb = fb.filter(ImageFilter.GaussianBlur(bb))
                im = Image.blend(fa, fb, sb)
                im = ImageEnhance.Brightness(im).enhance(1.0 - 0.16 * math.sin(math.pi * b))
            elif style in ("whip_l", "whip_up"):
                fa = scene_frame(idx, trel, show_ui=b < 0.2)
                fb = scene_frame(nxt, 0.0, show_ui=False)
                im = whip(fa, fb, b, vertical=(style == "whip_up"))
            elif style == "bank":
                fa = scene_frame(idx, trel, show_ui=b < 0.25)
                fb = scene_frame(nxt, 0.0, show_ui=False)
                im = bank(fa, fb, b)
            else:
                fa = scene_frame(idx, trel, vh_mult=1.0 + 0.10 * sb, show_ui=b < 0.4)
                fb = scene_frame(nxt, 0.0, show_ui=False)
                im = Image.blend(fa, fb, sb)
        else:
            im = scene_frame(idx, trel)
        im.save(f"fr_fly/{gf:05d}.jpg", quality=90)
        if gf % 150 == 0:
            print("frame", gf, "/", total_f, flush=True)
    print("RENDER_DONE", a0, min(a1, total_f))
    sys.exit(0)

if sys.argv[1] == "final":
    total = SHOTS[-1][2]
    sh(f"ffmpeg -y -loglevel error -framerate {FPS} -i fr_fly/%05d.jpg -i narration.mp3 "
       f"-filter_complex \"[0:v]format=yuv420p,fade=t=in:d=0.35,fade=t=out:st={total-0.5:.2f}:d=0.5[v];"
       f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,apad[a]\" "
       f"-map \"[v]\" -map \"[a]\" -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 160k "
       f"-t {total:.2f} -movflags +faststart flyover.mp4")
    info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 flyover.mp4",
                          shell=True, capture_output=True, text=True).stdout
    print("MURALS_FLYOVER_OK", info.strip())
