#!/usr/bin/env python3
"""Town Guides No 2 — Trails of Lompoc, MOTION GRAPHICS cut.
Animated route lines + stat cards in brand style; narration reused.
Phases: prep|anim|final."""
from PIL import Image, ImageDraw, ImageFont
import json, os, math, subprocess, sys

W, H, FPS = 1080, 1920, 30
INK = (36, 22, 41)
PURPLE = (101, 12, 117)
GOLD = (239, 198, 24)
CREAM = (247, 243, 233)
FONT = "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf"

NARR = "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260807_213153_c48ee313-ac1d-4bac-9d62-d1553830c311.mp3"
AERIAL = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Lompoc_CA_aerial_2007.jpg/1920px-Lompoc_CA_aerial_2007.jpg"

def sh(cmd):
    r = subprocess.run(cmd, shell=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {cmd[:100]}")

def F(s):
    return ImageFont.truetype(FONT, s)

def tw(d, t, f):
    b = d.textbbox((0, 0), t, font=f)
    return b[2] - b[0]

def ease(p):
    return 1 - (1 - p) ** 3

# Stylized route paths (editorial squiggles), per trail: list of (x,y)
def bez(pts, n=140):
    out = []
    for i in range(len(pts) - 3):
        pass
    # Catmull-Rom through points
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in [j / (n // (len(P) - 3)) for j in range(n // (len(P) - 3))]:
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    return out

TRAILS = [
    {
        "key": "bodger",
        "no": "TRAIL 01",
        "name": ["BODGER TRAIL", "LOOKOUT POINT"],
        "stats": ["1.5 MI OUT & BACK", "439 FT CLIMB", "#1 RATED IN LOMPOC"],
        "note": "Five minutes from downtown",
        "area": "bodger", "highlight": 16228351, "summit": True,
    },
    {
        "key": "purisima",
        "no": "TRAIL 02",
        "name": ["LA PURÍSIMA", "STATE PARK"],
        "stats": ["25 MILES OF TRAILS", "OAK WOODLAND", "ALL SKILL LEVELS"],
        "note": "Hills behind the mission",
        "area": "purisima", "highlight": None, "summit": False,
    },
    {
        "key": "burton",
        "no": "TRAIL 03",
        "name": ["BURTON MESA", "CHAPARRAL"],
        "stats": ["5,368 ACRES", "4.3 MI LOOP · EASY", "RARE MARITIME CHAPARRAL"],
        "note": "Sunrise to sunset · dogs on leash",
        "area": "burton", "highlight": None, "summit": False,
    },
    {
        "key": "ocean",
        "no": "TRAIL 04",
        "name": ["OCEAN BEACH", "COUNTY PARK"],
        "stats": ["RIVER MEETS THE SEA", "DUNES & SHOREBIRDS", "FLAT, EASY WALK"],
        "note": "End of Ocean Avenue",
        "area": "ocean", "highlight": None, "summit": False,
    },
]

def card_base(tr):
    key = tr["area"]
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)
    PX, PY, PW2, PH2 = 70, 560, 940, 640
    mapf = f"mapbg_{key}.png"
    if os.path.exists(mapf):
        panel = Image.open(mapf).convert("RGB")
        mask = Image.new("L", (PW2, PH2), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, PW2, PH2], radius=34, fill=255)
        im.paste(panel, (PX, PY), mask)
        d.rounded_rectangle([PX, PY, PX + PW2, PY + PH2], radius=34, outline=GOLD, width=6)
    d.rectangle([0, 0, W, 14], fill=GOLD)
    d.rectangle([0, H - 14, W, H], fill=GOLD)
    f_p = F(30)
    w_p = tw(d, tr["no"], f_p)
    x0 = (W - w_p) // 2 - 22
    d.rounded_rectangle([x0, 180, x0 + w_p + 44, 238], radius=29, fill=GOLD)
    d.text(((W - w_p) // 2, 193), tr["no"], font=f_p, fill=INK)
    y = 290
    for i, line in enumerate(tr["name"]):
        f_n = F(96 if i == 0 else 74)
        d.text(((W - tw(d, line, f_n)) // 2, y), line, font=f_n,
               fill=(255, 255, 255) if i == 0 else GOLD)
        y += 116 if i == 0 else 92
    return im

import math as _m

TILE_URLS = ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
             "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
             "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"]

def _merc(lat, lon, z):
    n = 256 * (2 ** z)
    x = n * (lon + 180.0) / 360.0
    la = _m.radians(lat)
    y = n * (1 - _m.log(_m.tan(la) + 1 / _m.cos(la)) / _m.pi) / 2
    return x, y

def fetch_map(ways, pw, ph, pad=0.30, out="map.png", zmax=16):
    la = [p[0] for w in ways for p in w["pts"]]
    lo = [p[1] for w in ways for p in w["pts"]]
    la0, la1 = min(la), max(la); lo0, lo1 = min(lo), max(lo)
    dla = (la1 - la0) * pad + 1e-4; dlo = (lo1 - lo0) * pad + 1e-4
    la0 -= dla; la1 += dla; lo0 -= dlo; lo1 += dlo
    z = zmax
    while z > 10:
        x0, y1 = _merc(la0, lo0, z); x1, y0 = _merc(la1, lo1, z)
        if (x1 - x0) <= pw and (y1 - y0) <= ph:
            break
        z -= 1
    x0, y1 = _merc(la0, lo0, z); x1, y0 = _merc(la1, lo1, z)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    px0, py0 = cx - pw / 2, cy - ph / 2
    tx0, ty0 = int(px0 // 256), int(py0 // 256)
    tx1, ty1 = int((px0 + pw) // 256), int((py0 + ph) // 256)
    canvas = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256), (224, 222, 210))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            url = TILE_URLS[(tx + ty) % 3].format(z=z, x=tx, y=ty)
            fn = f"tile_{z}_{tx}_{ty}.png"
            if not os.path.exists(fn):
                sh(f"curl -sfL --retry 2 --retry-all-errors --retry-delay 1 -A 'LompocLocalsTownGuides/1.0 (hello@lompoclocals.com)' -o {fn} '{url}' || true")
            try:
                canvas.paste(Image.open(fn).convert("RGB"), ((tx - tx0) * 256, (ty - ty0) * 256))
            except Exception:
                pass
    crop = canvas.crop((int(px0 - tx0 * 256), int(py0 - ty0 * 256),
                        int(px0 - tx0 * 256) + pw, int(py0 - ty0 * 256) + ph))
    crop.save(out)
    return {"z": z, "px0": px0, "py0": py0}

def to_panel(lat, lon, T, ox, oy):
    x, y = _merc(lat, lon, T["z"])
    return ox + x - T["px0"], oy + y - T["py0"]

GEO = None
def geo():
    global GEO
    if GEO is None:
        GEO = json.load(open("geo.json"))
    return GEO

def project(ways, box, bounds_ways=None):
    # equirectangular w/ latitude correction, fit + center in box, keep aspect
    x0, y0, x1, y1 = box
    src = bounds_ways if bounds_ways is not None else ways
    pts = [(p[1] * _m.cos(_m.radians(p[0])), -p[0]) for w in src for p in w["pts"]]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    if not xs: return []
    sx = (x1 - x0) / max(max(xs) - min(xs), 1e-9)
    sy = (y1 - y0) / max(max(ys) - min(ys), 1e-9)
    sc = min(sx, sy)
    ox = x0 + ((x1 - x0) - (max(xs) - min(xs)) * sc) / 2
    oy = y0 + ((y1 - y0) - (max(ys) - min(ys)) * sc) / 2
    out = []
    for w in ways:
        out.append({"id": w["id"], "px": [
            (ox + (p[1] * _m.cos(_m.radians(p[0])) - min(xs)) * sc,
             oy + (-p[0] - min(ys)) * sc) for p in w["pts"]]})
    return out

_PROJ = {}
def draw_route(im, tr, prog):
    d = ImageDraw.Draw(im)
    key = tr["area"]
    if key not in _PROJ:
        T = json.load(open(f"maptf_{key}.json"))
        g = geo()[key]
        ways = []
        for w in g:
            px = [to_panel(p[0], p[1], T, 70, 560) for p in w["pts"]]
            ways.append({"id": w["id"], "px": px})
        _PROJ[key] = ways
    ways = _PROJ[key]
    hi = tr.get("highlight")
    if hi is None and ways:
        # no explicit highlight: the longest path is THE trail; rest is context
        hi = max(ways, key=lambda w: len(w["px"]))["id"]
    clipbox = (70, 560, 1010, 1200)
    def inside(pt):
        return clipbox[0] - 30 <= pt[0] <= clipbox[2] + 30 and clipbox[1] - 30 <= pt[1] <= clipbox[3] + 30
    ctx = [w for w in ways if w["id"] != hi and len(w["px"]) >= 6]
    main = [w for w in ways if w["id"] == hi]
    n_ctx = int(len(ctx) * ease(min(1.0, prog)))
    for w in ctx[:n_ctx]:
        pts = [p for p in w["px"] if inside(p)]
        if len(pts) >= 2:
            d.line(pts, fill=(96, 80, 106), width=5, joint="curve")
    if main:
        pts = main[0]["px"]
        n = max(2, int(len(pts) * ease(prog)))
        seg = pts[:n]
        if len(seg) >= 2:
            d.line(seg, fill=GOLD, width=13, joint="curve")
        d.ellipse([pts[0][0] - 13, pts[0][1] - 13, pts[0][0] + 13, pts[0][1] + 13], fill=INK, outline=(255, 255, 255), width=4)
        hx, hy = seg[-1]
        d.ellipse([hx - 17, hy - 17, hx + 17, hy + 17], fill=GOLD, outline=INK, width=4)
        if prog >= 0.999 and tr["summit"]:
            d.line([hx, hy - 17, hx, hy - 76], fill=INK, width=8)
            d.polygon([(hx, hy - 76), (hx + 56, hy - 60), (hx, hy - 44)], fill=GOLD)

def draw_stats(im, tr, k):
    # k = how many stat pills visible (0..3) + note when all visible
    d = ImageDraw.Draw(im)
    y = 1250
    for i, s in enumerate(tr["stats"][:k]):
        f_s = F(40)
        w_s = tw(d, s, f_s)
        x0 = (W - w_s) // 2 - 30
        d.rounded_rectangle([x0, y, x0 + w_s + 60, y + 74], radius=18, fill=(255, 255, 255))
        d.text(((W - w_s) // 2, y + 15), s, font=f_s, fill=INK)
        y += 96
    if k >= 3:
        f_n = F(34)
        d.text(((W - tw(d, tr["note"], f_n)) // 2, y + 14), tr["note"], font=f_n, fill=(224, 214, 230))

PHASE = sys.argv[1] if len(sys.argv) > 1 else "prep"

if PHASE == "prep":
    sh(f"curl -sfL -A 'LompocLocals/1.0' -o narration.mp3 '{NARR}'")
    sh("curl -sfL -o geo.json 'https://d2ol7oe51mr4n9.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/13b92c32-ba11-489a-849b-75d9b01afee2.json'")
    dur = float(subprocess.run("ffprobe -v error -show_entries format=duration -of csv=p=0 narration.mp3", shell=True, capture_output=True, text=True).stdout.strip())
    a_hills, a_feet, a_history, a_paths, a_every = 4.40, 12.47, 19.50, 24.86, 33.90

    for _k in ("bodger", "purisima", "burton", "ocean"):
        _g = geo()[_k]
        _src = ([w for w in _g if w["id"] == 16228351] or _g) if _k == "bodger" else _g
        _T = fetch_map(_src, 940, 640, pad=0.85, out=f"mapbg_{_k}.png", zmax=14)
        json.dump(_T, open(f"maptf_{_k}.json", "w"))

    # cover: real topo map of the valley with markers at true trail spots
    g = geo()
    allw = g["roads"] + [w for a in ("bodger", "purisima", "burton") for w in g[a]]
    Tc = fetch_map(allw, W, 1150, pad=0.22, out="mapbg_cover.png", zmax=12)
    cov = Image.open("mapbg_cover.png").convert("RGB")
    im = Image.new("RGB", (W, H), INK)
    im.paste(cov, (0, 0))
    d = ImageDraw.Draw(im)
    for i, a in enumerate(["bodger", "purisima", "burton", "ocean"]):
        pp = [p for w in g[a] for p in w["pts"]]
        la = sum(p[0] for p in pp) / len(pp); lo = sum(p[1] for p in pp) / len(pp)
        x, y = to_panel(la, lo, Tc, 0, 0)
        x = max(64, min(W - 64, x)); y = max(150, min(1060, y))
        d.ellipse([x - 32, y - 32, x + 32, y + 32], fill=GOLD, outline=INK, width=5)
        f_m = F(30)
        num = f"0{i+1}"
        d.text((x - tw(d, num, f_m) / 2, y - 20), num, font=f_m, fill=INK)
    grad = Image.new("L", (1, H), 0)
    for y in range(H):
        a = 0 if y < H * 0.44 else int(250 * ((y - H * 0.44) / (H * 0.56)) ** 1.15)
        grad.putpixel((0, y), min(a, 250))
    im = Image.composite(Image.new("RGB", (W, H), INK), im, grad.resize((W, H)))
    d = ImageDraw.Draw(im)
    leg = "01 BODGER · 02 LA PURÍSIMA · 03 BURTON MESA · 04 OCEAN BEACH"
    f_l = F(27)
    d.text(((W - tw(d, leg, f_l)) // 2, 1100), leg, font=f_l, fill=(228, 220, 234))
    pill = "TOWN GUIDES · Nº 2"
    f_p = F(34)
    w_p = tw(d, pill, f_p)
    px0 = (W - w_p) // 2 - 26
    d.rounded_rectangle([px0, 1150, px0 + w_p + 52, 1218], radius=34, fill=GOLD)
    d.text(((W - w_p) // 2, 1166), pill, font=f_p, fill=INK)
    t = "TRAILS OF"
    d.text(((W - tw(d, t, F(110))) // 2, 1270), t, font=F(110), fill=(255, 255, 255))
    t = "LOMPOC"
    d.text(((W - tw(d, t, F(150))) // 2, 1395), t, font=F(150), fill=GOLD)
    t = "Four walks out of town"
    d.text(((W - tw(d, t, F(44))) // 2, 1595), t, font=F(44), fill=(228, 220, 234))
    im.save("c_title.png")

    # end card
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 12], fill=GOLD)
    d.rectangle([0, H - 12, W, H], fill=GOLD)
    t = "TRAILS OF LOMPOC"
    d.text(((W - tw(d, t, F(84))) // 2, 810), t, font=F(84), fill=(255, 255, 255))
    t = "Every trail · Every park · All in one place"
    d.text(((W - tw(d, t, F(40))) // 2, 940), t, font=F(40), fill=(200, 182, 208))
    t = "lompoclocals.com"
    d.text(((W - tw(d, t, F(56))) // 2, 1040), t, font=F(56), fill=GOLD)
    t = "From the Lompoc Locals town guides"
    d.text(((W - tw(d, t, F(32))) // 2, 1500), t, font=F(32), fill=(170, 158, 178))
    t = "Maps © OpenStreetMap contributors, SRTM · © OpenTopoMap (CC-BY-SA)"
    d.text(((W - tw(d, t, F(26))) // 2, 1560), t, font=F(26), fill=(130, 118, 140))
    im.save("c_end.png")

    shots = [
        ("cover", 0.0, 4.75),
        ("bodger", 4.75, 13.02),
        ("purisima", 13.02, 20.05),
        ("burton", 20.05, 25.46),
        ("ocean", 25.46, 34.27),
        ("end", 34.27, dur + 0.7),
    ]
    json.dump({"shots": shots, "dur": dur}, open("shots.json", "w"))
    print("PREP_DONE", json.dumps(shots))
    sys.exit(0)

plan = json.load(open("shots.json"))
shots, dur = plan["shots"], plan["dur"]
BY = {t["key"]: t for t in TRAILS}

if PHASE == "anim":
    DRAW_S = 1.0
    for key, t0, t1 in shots:
        if os.path.exists(f"seg_{key}.mp4"):
            print("SEG", key, "cached"); continue
        if key in ("cover", "end"):
            src = "c_title.png" if key == "cover" else "c_end.png"
            d_s = t1 - t0
            frames = max(int(round(d_s * FPS)), 6)
            fades = f",fade=t=out:st={max(0.0, d_s - 0.18):.3f}:d=0.18"
            if key == "cover":
                fades = ",fade=t=in:d=0.35" + fades
            sh(f"ffmpeg -y -loglevel error -loop 1 -i {src} -vf \"scale={W}:{H}{fades}\" "
               f"-frames:v {frames} -pix_fmt yuv420p -r {FPS} -preset veryfast seg_{key}.mp4")
            print("SEG", key, round(d_s, 2))
            continue
        tr = BY[key]
        d_s = t1 - t0
        total_f = max(int(round(d_s * FPS)), 10)
        draw_f = min(int(DRAW_S * FPS), total_f - 4)
        os.makedirs(f"fr_{key}", exist_ok=True)
        base = card_base(tr)
        for fi in range(total_f):
            im = base.copy()
            p = min(1.0, fi / max(draw_f, 1))
            draw_route(im, tr, p)
            # pills appear stepwise after the line lands
            k = 0
            for si in range(3):
                if fi >= draw_f + int(0.28 * FPS) * si:
                    k = si + 1
            draw_stats(im, tr, k)
            im.save(f"fr_{key}/{fi:04d}.jpg", quality=90)
        fades = f",fade=t=out:st={max(0.0, d_s - 0.18):.3f}:d=0.18"
        sh(f"ffmpeg -y -loglevel error -framerate {FPS} -i fr_{key}/%04d.jpg "
           f"-vf \"format=yuv420p{fades}\" -r {FPS} -preset veryfast seg_{key}.mp4")
        print("SEG", key, round(d_s, 2), "frames", total_f)
    print("ANIM_DONE")
    sys.exit(0)

# ---------- final ----------
sh(f"ffmpeg -y -loglevel error -loop 1 -i c_title.png -frames:v 1 "
   f"-vf scale={W}:{H} -pix_fmt yuv420p -r {FPS} seg_poster.mp4")
order = ["seg_poster.mp4"] + [f"seg_{k}.mp4" for k, _, _ in shots]
missing = [s for s in order if not os.path.exists(s)]
if missing:
    sys.exit(f"MISSING {missing}")
with open("concat.txt", "w") as f:
    for s in order:
        f.write(f"file '{s}'\n")

CAPS = [
    (0.2, 4.7, "Lompoc — a town you can walk right out of"),
    (4.8, 12.9, "Bodger Trail · the valley at your feet"),
    (13.1, 19.9, "La Purísima · 25 miles of trails"),
    (20.1, 25.3, "Burton Mesa · rare chaparral country"),
    (25.5, 34.1, "Ocean Beach · where the walk ends at the sea"),
    (34.4, 41.9, "Every trail · every park · all in one place — lompoclocals.com"),
]

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); sec = t % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

ev = CAPS

with open("caps.ass", "w") as f:
    f.write("[Script Info]\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour,"
            " Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
            "Style: cap,Montserrat,54,&H00FFFFFF,&H00000000,&H80000000,-1,3,1,2,60,60,190\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Text\n")
    for t0, t1, txt in ev:
        f.write(f"Dialogue: 0,{ts(t0)},{ts(t1)},cap,{{\\fad(120,80)}}{txt}\n")

total = shots[-1][2] + 1 / FPS
sh(f"ffmpeg -y -loglevel error -f concat -safe 0 -i concat.txt -i narration.mp3 "
   f"-filter_complex \"[0:v]subtitles=caps.ass:fontsdir=/usr/share/fonts,"
   f"fade=t=out:st={total-0.6:.3f}:d=0.6[v];[1:a]highpass=f=60,loudnorm=I=-14:TP=-1.5:LRA=11,apad,afade=t=out:st={total-0.6:.3f}:d=0.6[a]\" "
   f"-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 19 "
   f"-c:a aac -b:a 192k -t {total:.3f} -movflags +faststart final.mp4")
info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 final.mp4",
                      shell=True, capture_output=True, text=True).stdout
print("FINAL_OK", info.strip())
