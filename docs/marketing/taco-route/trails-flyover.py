#!/usr/bin/env python3
"""Town Guides No 2 — Trails of Lompoc, CINEMATIC FLYOVER cut.
One continuous satellite flight: valley dive -> glide each trail as the route
draws under the camera -> pull-out finale. Narration + boundaries unchanged.
Phases: prep | render | final
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import json, os, math, subprocess, sys

MONO = "/System/Library/Fonts/Menlo.ttc"
def FM(s):
    try:
        return ImageFont.truetype(MONO, s)
    except OSError:
        return ImageFont.truetype(FONT, s)

W, H, FPS = 1080, 1920, 30
SRC = 2560            # device px of each fetched source image (1280 css @2x)
INK = (36, 22, 41)
GOLD = (239, 198, 24)
FONT = "/private/tmp/claude-501/-Users-kreatip-Projects-lompoc-deals/753a18a0-0733-4d51-9b67-1f19fbd2978e/scratchpad/Montserrat-ExtraBold-real.ttf"
STYLE = "satellite-streets-v12"

def sh(cmd):
    r = subprocess.run(cmd, shell=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {cmd[:110]}")

def F(s): return ImageFont.truetype(FONT, s)
def tw(d, t, f):
    b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]
def ease(p): return 1 - (1 - p) ** 3
def smooth(p): return p * p * (3 - 2 * p)

TRAILS = [
    {"key": "bodger",   "no": "TRAIL 01", "name": ["BODGER TRAIL", "LOOKOUT POINT"],
     "data": [("1.5 MI", "OUT & BACK"), ("439 FT", "CLIMB")],
     "note": "Five minutes from downtown",
     "spine_id": 16228351, "network": False},
    {"key": "purisima", "no": "TRAIL 02", "name": ["LA PURÍSIMA", "STATE PARK"],
     "data": [("25 MI", "OF TRAILS"), ("OAK WOODLAND", None)],
     "note": "Hills behind the mission",
     "spine_id": None, "network": True},
    {"key": "burton",   "no": "TRAIL 03", "name": ["BURTON MESA", "CHAPARRAL"],
     "data": [("5,368", "ACRES"), ("4.3 MI", "LOOP · EASY")],
     "note": "Sunrise to sunset · dogs on leash",
     "spine_id": None, "network": True},
    {"key": "ocean",    "no": "TRAIL 04", "name": ["OCEAN BEACH", "COUNTY PARK"],
     "data": [("RIVER MEETS THE SEA", None), ("DUNES & SHOREBIRDS", None)],
     "note": "End of Ocean Avenue",
     "spine_id": None, "network": False,
     # coastline glide (no invented trail line) ending at the river mouth;
     # pin = park entrance where Ocean Ave meets the beach
     "tour": [(34.6560, -120.6022), (34.6838, -120.6010)],
     "pin": (34.6828, -120.6014)},
]
BY = {t["key"]: t for t in TRAILS}

# narration-verified boundaries (reel time)
SHOTS = [("cover", 0.0, 4.55), ("bodger", 4.55, 12.00), ("purisima", 12.00, 18.85),
         ("burton", 18.85, 23.78), ("ocean", 23.78, 32.40), ("end", 32.40, 40.40)]
XFADE = 0.9

def punch(im, s):
    """Screen-space zoom into the frame center by factor s."""
    if s <= 1.001:
        return im
    w2, h2 = int(W / s), int(H / s)
    x0, y0 = (W - w2) // 2, (H - h2) // 2
    return im.crop((x0, y0, x0 + w2, y0 + h2)).resize((W, H), Image.LANCZOS)

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

GEO = json.load(open("geo.json"))

def area_bbox(keys):
    la = [p[0] for k in keys for w in GEO[k] for p in w["pts"]]
    lo = [p[1] for k in keys for w in GEO[k] for p in w["pts"]]
    return min(la), max(la), min(lo), max(lo)

def fit_zoom(la0, la1, lo0, lo1, pad, zcap, xlim=None):
    """Fit padded bbox into SRC (or xlim x SRC for portrait-crop safety)."""
    cla, clo = (la0 + la1) / 2, (lo0 + lo1) / 2
    xmax = xlim or SRC
    z = zcap
    while z > 8:
        x0, y0 = _merc512(la1, lo0, z); x1, y1 = _merc512(la0, lo1, z)
        if (x1 - x0) * 2 <= xmax * (1 - pad) and (y1 - y0) * 2 <= SRC * (1 - pad):
            return z, cla, clo
        z -= 0.05
    return z, cla, clo

def fetch(name, z, cla, clo):
    out = f"sat_{name}.png"
    if not os.path.exists(out):
        url = (f"https://api.mapbox.com/styles/v1/mapbox/{STYLE}/static/"
               f"{clo:.5f},{cla:.5f},{z:.2f},0/1280x1280@2x"
               f"?access_token={mb_token()}&logo=false&attribution=false")
        sh(f"curl -sfL --retry 3 --max-time 60 -o {out} '{url}'")
    return {"z": z, "cla": cla, "clo": clo}

def to_src(lat, lon, T):
    x, y = _merc512(lat, lon, T["z"])
    cx, cy = _merc512(T["cla"], T["clo"], T["z"])
    return SRC / 2 + 2 * (x - cx), SRC / 2 + 2 * (y - cy)

# ---------------- prep ----------------
if (sys.argv[1] if len(sys.argv) > 1 else "prep") == "prep" and __name__ == "__main__" and (len(sys.argv) < 2 or sys.argv[1] == "prep"):
    tfs = {}
    for t in TRAILS:
        la0, la1, lo0, lo1 = area_bbox([t["key"]])
        z, cla, clo = fit_zoom(la0, la1, lo0, lo1, 0.42, 16.2)
        tfs[t["key"]] = fetch(t["key"], z, cla, clo)
        print("SAT", t["key"], round(z, 2))
    la0, la1, lo0, lo1 = area_bbox([t["key"] for t in TRAILS])
    z, cla, clo = fit_zoom(la0, la1, lo0, lo1, 0.16, 13.5, xlim=1440)
    tfs["valley"] = fetch("valley", z, cla, clo)
    print("SAT valley", round(z, 2))
    json.dump(tfs, open("sat_tf.json", "w"))
    print("PREP_DONE")
    sys.exit(0)

TF = json.load(open("sat_tf.json"))

def ways_src(key, T):
    return [[to_src(p[0], p[1], T) for p in w["pts"]] for w in GEO[key]]

def spine_of(key):
    t = BY[key]; T = TF[key]
    ways = GEO[key]
    if t["spine_id"]:
        w = next(x for x in ways if x["id"] == t["spine_id"])
    else:
        def wl(x):
            pts = [to_src(p[0], p[1], T) for p in x["pts"]]
            return sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        w = max(ways, key=wl)
    pts = [to_src(p[0], p[1], T) for p in w["pts"]]
    # uniform arc-length resample + smoothing
    d = [0.0]
    for i in range(len(pts) - 1):
        d.append(d[-1] + math.dist(pts[i], pts[i + 1]))
    total = d[-1]
    N = 420
    out = []
    j = 0
    for i in range(N + 1):
        target = total * i / N
        while j < len(d) - 2 and d[j + 1] < target:
            j += 1
        seg = d[j + 1] - d[j] or 1e-9
        f = (target - d[j]) / seg
        out.append((pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f,
                    pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f))
    k = 10
    sm = []
    for i in range(len(out)):
        a = max(0, i - k); b = min(len(out), i + k + 1)
        sm.append((sum(p[0] for p in out[a:b]) / (b - a), sum(p[1] for p in out[a:b]) / (b - a)))
    return sm, total

SPINE = {t["key"]: spine_of(t["key"]) for t in TRAILS}
IMGS = {k: Image.open(f"sat_{k}.png").convert("RGB") for k in list(BY) + ["valley"]}
WAYS_SRC = {k: ways_src(k, TF[k]) for k in BY}
CENTROIDS = {}
for t in TRAILS:
    la0, la1, lo0, lo1 = area_bbox([t["key"]])
    CENTROIDS[t["key"]] = ((la0 + la1) / 2, (lo0 + lo1) / 2)

def spine_pt(key, p):
    pts, _ = SPINE[key]
    i = min(len(pts) - 1, max(0, p * (len(pts) - 1)))
    a = int(i); f = i - a
    b = min(len(pts) - 1, a + 1)
    return (pts[a][0] + (pts[b][0] - pts[a][0]) * f, pts[a][1] + (pts[b][1] - pts[a][1]) * f)

def glide_h(key):
    pts, total = SPINE[key]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    span = max(max(xs) - min(xs), max(ys) - min(ys))
    return max(1150.0, min(2100.0, span * 1.5))

VIGN_TOP = Image.new("L", (1, 260), 0)
for y in range(260):
    VIGN_TOP.putpixel((0, y), int(150 * (1 - y / 260)))
VIGN_TOP = VIGN_TOP.resize((W, 260))
VIGN_BOT = VIGN_TOP.transpose(Image.FLIP_TOP_BOTTOM).resize((W, 420))
INK_IM_T = Image.new("RGB", (W, 260), INK)
INK_IM_B = Image.new("RGB", (W, 420), INK)

def render_view(key, cx, cy, vh, route_p, network_a=145, pin=None):
    """Crop source at (cx,cy,view-height vh) -> 1080x1920, draw routes."""
    src = IMGS[key if key in IMGS else "valley"]
    vw = vh * (W / H)
    cx = max(vw / 2, min(SRC - vw / 2, cx))
    cy = max(vh / 2, min(SRC - vh / 2, cy))
    box = (int(cx - vw / 2), int(cy - vh / 2), int(cx + vw / 2), int(cy + vh / 2))
    im = src.crop(box).resize((W, H), Image.LANCZOS)
    if key in BY:
        s = W / vw
        ox, oy = box[0], box[1]
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        def scr(pt): return ((pt[0] - ox) * s, (pt[1] - oy) * s)
        if BY[key]["network"]:
            for wpts in WAYS_SRC[key]:
                pp = [scr(p) for p in wpts]
                if any(-200 < p[0] < W + 200 and -200 < p[1] < H + 200 for p in pp):
                    d.line(pp, fill=(255, 255, 255, network_a), width=5)
        if route_p > 0:
            pts, _ = SPINE[key]
            n = max(2, int(route_p * len(pts)))
            pp = [scr(p) for p in pts[:n]]
            d.line(pp, fill=(255, 255, 255, 235), width=17, joint="curve")
            d.line(pp, fill=(*GOLD, 255), width=9, joint="curve")
            tx, ty = pp[-1]
            d.ellipse([tx - 16, ty - 16, tx + 16, ty + 16], fill=(255, 255, 255, 255))
            d.ellipse([tx - 10, ty - 10, tx + 10, ty + 10], fill=(*GOLD, 255))
            sx, sy = pp[0]
            d.ellipse([sx - 12, sy - 12, sx + 12, sy + 12], outline=(255, 255, 255, 255), width=5)
        if pin is not None:
            px, py = scr(pin)
            if -100 < px < W + 100 and -100 < py < H + 100:
                d.ellipse([px - 44, py - 44, px + 44, py + 44], outline=(255, 255, 255, 210), width=6)
                d.ellipse([px - 26, py - 26, px + 26, py + 26], fill=(*GOLD, 255), outline=(*INK, 255), width=4)
        im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    im.paste(INK_IM_T, (0, 0), VIGN_TOP)
    im.paste(INK_IM_B, (0, H - 420), VIGN_BOT)
    return im

def draw_lockup(im, tr, a, xoff):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f_p = F(27)
    w_p = tw(d, tr["no"], f_p)
    x0 = 64 + xoff
    d.rounded_rectangle([x0, 108, x0 + w_p + 40, 160], radius=26, fill=(*GOLD, a))
    d.text((x0 + 20, 118), tr["no"], font=f_p, fill=(*INK, a))
    size = 62
    f_a, f_b = F(size), F(int(size * 0.72))
    while tw(d, tr["name"][0] + " ", f_a) + tw(d, tr["name"][1], f_b) > W - 128 and size > 38:
        size -= 3; f_a, f_b = F(size), F(int(size * 0.72))
    d.text((x0, 178), tr["name"][0], font=f_a, fill=(255, 255, 255, a),
           stroke_width=4, stroke_fill=(*INK, min(a, 215)))
    d.text((x0 + tw(d, tr["name"][0] + " ", f_a), 178 + int(size * 0.22)), tr["name"][1],
           font=f_b, fill=(*GOLD, a), stroke_width=4, stroke_fill=(*INK, min(a, 215)))
    im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))

import re as _re
def _countup(val, p):
    m = _re.match(r"([0-9][0-9,\.]*)(.*)", val)
    if not m or p >= 1.0:
        return val
    num = m.group(1).replace(",", "")
    try:
        v = float(num)
    except ValueError:
        return val
    cur = v * ease(p)
    return (f"{cur:,.1f}" if "." in num else f"{int(round(cur)):,}") + m.group(2)

def glass(im, box, r=22):
    """Frosted-glass panel: blur what's behind, then tint."""
    x0, y0, x1, y1 = [int(v) for v in box]
    x0 = max(0, x0); y0 = max(0, y0); x1 = min(W, x1); y1 = min(H, y1)
    reg = im.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(14))
    im.paste(reg, (x0, y0))

def draw_data_cards(im, tr, trel, dur):
    start = dur * 0.40
    x = 64
    base_y = 1566
    shown_any = False
    for i, (val, lab) in enumerate(tr["data"]):
        t0 = start + i * 0.30
        p = min(1.0, max(0.0, (trel - t0) / 0.42))
        if p <= 0:
            break
        shown_any = True
        ep = ease(p)
        a = int(255 * ep)
        yoff = int(34 * (1 - ep))
        if lab is not None:
            f_v, f_l = F(58), F(24)
            dm = ImageDraw.Draw(im)
            wv = tw(dm, val, f_v); wl = tw(dm, lab, f_l)
            cw = max(wv, wl) + 60
            ch = 152
            y0 = base_y + yoff
            glass(im, (x, y0, x + cw, y0 + ch))
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            d.rounded_rectangle([x, y0, x + cw, y0 + ch], radius=22,
                                fill=(*INK, int(150 * ep)), outline=(*GOLD, int(210 * ep)), width=2)
            d.rectangle([x, y0 + 24, x + 6, y0 + ch - 24], fill=(*GOLD, a))
            d.text((x + 30, y0 + 18), _countup(val, p), font=f_v, fill=(255, 255, 255, a))
            d.text((x + 30, y0 + 100), lab, font=f_l, fill=(*GOLD, a))
            im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))
            x += cw + 28
        else:
            f_t = F(30)
            dm = ImageDraw.Draw(im)
            wt = tw(dm, val, f_t)
            cw = wt + 64
            ch = 74
            y0 = base_y + 39 + yoff
            glass(im, (x, y0, x + cw, y0 + ch))
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            d.rounded_rectangle([x, y0, x + cw, y0 + ch], radius=18,
                                fill=(*INK, int(150 * ep)), outline=(*GOLD, int(210 * ep)), width=2)
            d.rectangle([x, y0 + 16, x + 6, y0 + ch - 16], fill=(*GOLD, a))
            d.text((x + 30, y0 + 17), val, font=f_t, fill=(255, 255, 255, a))
            im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))
            x += cw + 28
    if shown_any:
        pn = min(1.0, max(0.0, (trel - (start + len(tr["data"]) * 0.30 + 0.35)) / 0.4))
        if pn > 0:
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            d.text((66, 1748), tr["note"], font=F(29), fill=(228, 218, 238, int(255 * ease(pn))))
            im.paste(Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB"), (0, 0))

def inv_latlon(sx, sy, T):
    n = 512 * (2 ** T["z"])
    cx, cy = _merc512(T["cla"], T["clo"], T["z"])
    x = cx + (sx - SRC / 2) / 2
    y = cy + (sy - SRC / 2) / 2
    lon = x / n * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon

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

def valley_markers(im, a=255):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return im  # markers drawn by caller with transform

def cover_frame(trel, dur):
    T = TF["valley"]
    p = smooth(min(1.0, trel / dur))
    vh = 2560 - 240 * p
    cx, cy = SRC / 2, SRC / 2
    im = render_view("valley", cx, cy, vh, 0)
    vw = vh * (W / H); s = W / vw
    ox, oy = max(vw / 2, min(SRC - vw / 2, cx)) - vw / 2, max(vh / 2, min(SRC - vh / 2, cy)) - vh / 2
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    ap = int(255 * min(1.0, trel / 0.6))
    for i, t in enumerate(TRAILS):
        la, lo = CENTROIDS[t["key"]]
        x, y = to_src(la, lo, T)
        x, y = (x - ox) * s, (y - oy) * s
        d.ellipse([x - 30, y - 30, x + 30, y + 30], fill=(*GOLD, ap), outline=(*INK, ap), width=4)
        num = f"0{i+1}"; f_m = F(26)
        d.text((x - tw(d, num, f_m) / 2, y - 18), num, font=f_m, fill=(*INK, ap))
    f_p = F(30); pill = "TOWN GUIDES · Nº 2"
    w_p = tw(d, pill, f_p); px0 = (W - w_p) // 2 - 24
    d.rounded_rectangle([px0, 1490, px0 + w_p + 48, 1550], radius=30, fill=(*GOLD, ap))
    d.text(((W - w_p) // 2, 1504), pill, font=f_p, fill=(*INK, ap))
    t1 = "TRAILS OF LOMPOC"; f1 = F(88)
    d.text((((W - tw(d, t1, f1)) // 2), 1576), t1, font=f1, fill=(255, 255, 255, ap),
           stroke_width=3, stroke_fill=(*INK, min(ap, 170)))
    t2 = "Four walks out of town"; f2 = F(36)
    d.text(((W - tw(d, t2, f2)) // 2, 1706), t2, font=f2, fill=(232, 224, 238, ap))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")

def trail_frame(key, trel, dur, vh_mult=1.0, show_ui=True):
    tr = BY[key]
    settle = 0.5
    if trel < settle:
        p_cam = 0.0
        vh = (glide_h(key) * 1.55) - (glide_h(key) * 0.55) * smooth(trel / settle)
    else:
        g = (trel - settle) / max(0.001, dur - settle - 0.25)
        p_cam = smooth(min(1.0, g))
        vh = glide_h(key)
    if "tour" in tr:
        T = TF[key]
        a = to_src(*tr["tour"][0], T); b = to_src(*tr["tour"][1], T)
        cx = a[0] + (b[0] - a[0]) * p_cam
        cy = a[1] + (b[1] - a[1]) * p_cam
        vh = 1500.0
        if trel < settle:
            vh = 1500.0 * 1.55 - 1500.0 * 0.55 * smooth(trel / settle)
        im = render_view(key, cx, cy, vh * vh_mult, 0.0, pin=to_src(*tr["pin"], T))
    else:
        cx, cy = spine_pt(key, p_cam)
        route_p = p_cam if trel >= settle else 0.0
        im = render_view(key, cx, cy, vh * vh_mult, route_p)
    if show_ui:
        a = int(255 * min(1.0, max(0.0, (trel - 0.25) / 0.45)))
        xoff = int(-40 * (1 - min(1.0, max(0.0, (trel - 0.25) / 0.45))))
        if a > 0:
            draw_lockup(im, tr, a, xoff)
            draw_hud(im, TF[key], cx, cy, a)
        draw_data_cards(im, tr, trel, dur)
    return im

def end_frame(trel, dur):
    T = TF["valley"]
    p = smooth(min(1.0, trel / (dur * 0.7)))
    vh = 1500 + 1000 * p
    cx, cy = SRC / 2, SRC / 2
    im = render_view("valley", cx, cy, vh, 0)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    ap = int(235 * min(1.0, max(0.0, (trel - 0.8) / 0.7)))
    if ap > 0:
        d.rounded_rectangle([70, 640, W - 70, 1280], radius=36, fill=(*INK, min(ap, 216)))
        t1 = "TRAILS OF LOMPOC"; f1 = F(72)
        d.text(((W - tw(d, t1, f1)) // 2, 730), t1, font=f1, fill=(255, 255, 255, ap))
        t2 = "Every trail · Every park · All in one place"; f2 = F(36)
        d.text(((W - tw(d, t2, f2)) // 2, 850), t2, font=f2, fill=(210, 196, 220, ap))
        t3 = "lompoclocals.com"; f3 = F(52)
        d.text(((W - tw(d, t3, f3)) // 2, 940), t3, font=f3, fill=(*GOLD, ap))
        t4 = "From the Lompoc Locals town guides"; f4 = F(28)
        d.text(((W - tw(d, t4, f4)) // 2, 1090), t4, font=f4, fill=(178, 166, 188, ap))
        t5 = "Maps © Mapbox · © OpenStreetMap · Trails © OSM contributors"; f5 = F(24)
        d.text(((W - tw(d, t5, f5)) // 2, 1150), t5, font=f5, fill=(150, 138, 160, ap))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")

def scene_frame(idx, trel, vh_mult=1.0, show_ui=True):
    key, t0, t1 = SHOTS[idx]
    dur = t1 - t0
    if key == "cover":
        return cover_frame(trel, dur)
    if key == "end":
        return end_frame(trel, dur)
    return trail_frame(key, trel, dur, vh_mult, show_ui)

# ---------------- render ----------------
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
        if nxt is not None and gt >= e - XFADE:
            b = (gt - (e - XFADE)) / XFADE       # 0..1 across the blend
            sb = smooth(b)
            fa = scene_frame(idx, trel, vh_mult=1.0 + 0.9 * sb, show_ui=b < 0.3)
            fb = scene_frame(nxt, 0.0, vh_mult=1.0 + 1.2 * (1 - sb), show_ui=False)
            # drone-style transfer: speed-ramp punch + motion blur + luma dip
            fa = punch(fa, 1.0 + 0.22 * sb)
            fb = punch(fb, 1.0 + 0.12 * (1 - sb))
            ba = 9.0 * sb; bb = 9.0 * (1 - sb)
            if ba > 0.6:
                fa = fa.filter(ImageFilter.GaussianBlur(ba))
            if bb > 0.6:
                fb = fb.filter(ImageFilter.GaussianBlur(bb))
            im = Image.blend(fa, fb, sb)
            im = ImageEnhance.Brightness(im).enhance(1.0 - 0.16 * math.sin(math.pi * b))
        else:
            im = scene_frame(idx, trel)
        im.save(f"fr_fly/{gf:05d}.jpg", quality=90)
        if gf % 150 == 0:
            print("frame", gf, "/", total_f, flush=True)
    print("RENDER_DONE", a0, min(a1, total_f))
    sys.exit(0)

# ---------------- final ----------------
if sys.argv[1] == "final":
    total = SHOTS[-1][2]
    sh(f"ffmpeg -y -loglevel error -framerate {FPS} -i fr_fly/%05d.jpg -i narration.mp3 "
       f"-filter_complex \"[0:v]format=yuv420p,fade=t=in:d=0.35,fade=t=out:st={total-0.5:.2f}:d=0.5[v];"
       f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,apad[a]\" "
       f"-map \"[v]\" -map \"[a]\" -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 160k "
       f"-t {total:.2f} -movflags +faststart flyover.mp4")
    info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 flyover.mp4",
                          shell=True, capture_output=True, text=True).stdout
    print("FLYOVER_OK", info.strip())
