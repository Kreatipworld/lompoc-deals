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
FONT = "/private/tmp/claude-501/-Users-kreatip-Projects-lompoc-deals/753a18a0-0733-4d51-9b67-1f19fbd2978e/scratchpad/Montserrat-ExtraBold-real.ttf"

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
    mapf = f"mapbg_{key}.png"
    if os.path.exists(mapf):
        im.paste(Image.open(mapf).convert("RGB"), (0, 330))
    d = ImageDraw.Draw(im)
    # top news band
    d.rectangle([0, 0, W, 330], fill=INK)
    d.rectangle([0, 324, W, 330], fill=GOLD)
    f_p = F(28)
    w_p = tw(d, tr["no"], f_p)
    d.rounded_rectangle([70, 80, 70 + w_p + 44, 136], radius=28, fill=GOLD)
    d.text((92, 92), tr["no"], font=f_p, fill=INK)
    # auto-fit the two-part headline inside the band
    size = 78
    while size > 40:
        f_a, f_b = F(size), F(int(size * 0.74))
        total = tw(d, tr["name"][0] + " ", f_a) + tw(d, tr["name"][1], f_b)
        if total <= W - 140:
            break
        size -= 3
    d.text((70, 152 + (78 - size)), tr["name"][0], font=f_a, fill=(255, 255, 255))
    d.text((70 + tw(d, tr["name"][0] + " ", f_a), 152 + (78 - size) + int(size * 0.2)), tr["name"][1], font=f_b, fill=GOLD)
    # lower third
    d.rectangle([0, 1560, W, H], fill=INK)
    d.rectangle([0, 1560, W, 1566], fill=GOLD)
    d.text((70, 1692), tr["note"], font=F(30), fill=(200, 186, 208))
    return im

import math as _m

MAPBOX_TOKEN = None
def mb_token():
    global MAPBOX_TOKEN
    if MAPBOX_TOKEN is None:
        for line in open("/Users/kreatip/Projects/lompoc-deals/.env.local"):
            if line.startswith("NEXT_PUBLIC_MAPBOX_TOKEN"):
                MAPBOX_TOKEN = line.split("=",1)[1].strip().strip('"')
    return MAPBOX_TOKEN

def _merc512(lat, lon, z):
    n = 512 * (2 ** z)
    x = n * (lon + 180.0) / 360.0
    la = _m.radians(lat)
    y = n * (1 - _m.log(_m.tan(la) + 1 / _m.cos(la)) / _m.pi) / 2
    return x, y

def fetch_map(ways, pw, ph, pad=0.30, out="map.png", zmax=16, style="outdoors-v12"):
    """One seamless Mapbox Static image. pw/ph are CSS px; fetched @2x then downscaled crisp."""
    la = [p[0] for w in ways for p in w["pts"]]
    lo = [p[1] for w in ways for p in w["pts"]]
    la0, la1 = min(la), max(la); lo0, lo1 = min(lo), max(lo)
    cla, clo = (la0 + la1) / 2, (lo0 + lo1) / 2
    # fractional zoom to fit padded bbox
    z = zmax + 0.0
    while z > 8:
        x0, y1 = _merc512(la0, lo0, z); x1, y0 = _merc512(la1, lo1, z)
        if (x1 - x0) * (1 + pad * 2) <= pw and (y1 - y0) * (1 + pad * 2) <= ph:
            break
        z -= 0.05
    z = round(z, 2)
    req_w, req_h = min(pw // 2, 1280), min(ph // 2, 1280)
    url = (f"https://api.mapbox.com/styles/v1/mapbox/{style}/static/"
           f"{clo:.5f},{cla:.5f},{z},0/{req_w}x{req_h}@2x"
           f"?access_token={mb_token()}&logo=false&attribution=false")
    sh(f"curl -sfL --retry 3 --max-time 40 -o {out} '{url}'")
    img = Image.open(out).convert("RGB")
    if img.size != (pw, ph):
        img = img.resize((pw, ph), Image.LANCZOS)
        img.save(out)
    return {"z": z, "clat": cla, "clon": clo, "pw": pw, "ph": ph}

def to_panel(lat, lon, T, ox, oy):
    x, y = _merc512(lat, lon, T["z"])
    cx, cy = _merc512(T["clat"], T["clon"], T["z"])
    return ox + T["pw"] / 2 + (x - cx), oy + T["ph"] / 2 + (y - cy)

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
            px = [to_panel(p[0], p[1], T, 0, 330) for p in w["pts"]]
            ways.append({"id": w["id"], "px": px})
        _PROJ[key] = ways
    ways = _PROJ[key]
    hi = tr.get("highlight")
    if hi is None and ways:
        hi = max(ways, key=lambda w: len(w["px"]))["id"]
    clipbox = (0, 330, W, 1560)
    def inside(pt):
        return clipbox[0] - 30 <= pt[0] <= clipbox[2] + 30 and clipbox[1] - 30 <= pt[1] <= clipbox[3] + 30
    main = [w for w in ways if w["id"] == hi]
    if main:
        pts = [p for p in main[0]["px"]]
        n = max(2, int(len(pts) * ease(prog)))
        seg = pts[:n]
        if len(seg) >= 2:
            d.line(seg, fill=(255, 255, 255), width=20, joint="curve")
            d.line(seg, fill=GOLD, width=12, joint="curve")
        d.ellipse([pts[0][0] - 14, pts[0][1] - 14, pts[0][0] + 14, pts[0][1] + 14], fill=INK, outline=(255, 255, 255), width=4)
        hx, hy = seg[-1]
        d.ellipse([hx - 18, hy - 18, hx + 18, hy + 18], fill=GOLD, outline=INK, width=4)
        if prog >= 0.999 and tr["summit"]:
            d.line([hx, hy - 18, hx, hy - 78], fill=INK, width=8)
            d.polygon([(hx, hy - 78), (hx + 58, hy - 61), (hx, hy - 45)], fill=GOLD)

import re as _re
def draw_stats_anim(im, tr, fi, chip_start):
    """Chips pop in staggered; leading numbers count up. fi = current frame."""
    d = ImageDraw.Draw(im, "RGBA")
    x = 70
    for i, st in enumerate(tr["stats"]):
        t0 = chip_start + i * 7
        p = (fi - t0) / 8.0
        if p <= 0:
            break
        p = min(1.0, p)
        ep = 1 - (1 - p) ** 3
        f_s = F(30)
        # count-up on a leading number during the pop
        m = _re.match(r"([0-9][0-9,\.]*)(.*)", st)
        label = st
        if m and p < 1.0:
            num = m.group(1).replace(",", "")
            try:
                val = float(num) * ep
                if "." in m.group(1):
                    shown = f"{val:.1f}"
                elif float(num) >= 1000:
                    shown = f"{int(val):,}"
                else:
                    shown = str(int(val))
                label = shown + m.group(2)
            except ValueError:
                pass
        w_s = tw(d, st, f_s)  # reserve final width so chips don't shift
        if x + w_s + 44 > W - 40:
            break
        yoff = int(24 * (1 - ep))
        a = int(255 * ep)
        d.rounded_rectangle([x, 1600 + yoff, x + w_s + 44, 1664 + yoff], radius=14, fill=(255, 255, 255, a))
        d.text((x + 22, 1614 + yoff), label, font=f_s, fill=(36, 22, 41, a))
        x += w_s + 64

def draw_stats(im, tr, k):
    return

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
        _T = fetch_map(_src, 1080, 1230, pad=0.55, out=f"mapbg_{_k}.png", zmax=15)
        json.dump(_T, open(f"maptf_{_k}.json", "w"))

    # cover: seamless Mapbox map of the whole valley + news title band
    g = geo()
    allw = g["roads"] + [w for a in ("bodger", "purisima", "burton") for w in g[a]]
    Tc = fetch_map(allw, W, 1500, pad=0.18, out="mapbg_cover.png", zmax=12, style="outdoors-v12")
    im = Image.new("RGB", (W, H), INK)
    im.paste(Image.open("mapbg_cover.png").convert("RGB"), (0, 0))
    d = ImageDraw.Draw(im)
    for i, a in enumerate(["bodger", "purisima", "burton", "ocean"]):
        pp = [p for w in g[a] for p in w["pts"]]
        la = sum(p[0] for p in pp) / len(pp); lo = sum(p[1] for p in pp) / len(pp)
        x, y = to_panel(la, lo, Tc, 0, 0)
        x = max(64, min(W - 64, x)); y = max(150, min(1430, y))
        d.ellipse([x - 34, y - 34, x + 34, y + 34], fill=GOLD, outline=INK, width=5)
        f_m = F(30)
        num = f"0{i+1}"
        d.text((x - tw(d, num, f_m) / 2, y - 21), num, font=f_m, fill=INK)
    d.rectangle([0, 1500, W, H], fill=INK)
    d.rectangle([0, 1494, W, 1500], fill=GOLD)
    leg = "01 BODGER · 02 LA PURÍSIMA · 03 BURTON MESA · 04 OCEAN BEACH"
    f_l = F(25)
    d.text(((W - tw(d, leg, f_l)) // 2, 1524), leg, font=f_l, fill=(210, 198, 218))
    pill = "TOWN GUIDES · Nº 2"
    f_p = F(30)
    w_p = tw(d, pill, f_p)
    px0 = (W - w_p) // 2 - 24
    d.rounded_rectangle([px0, 1580, px0 + w_p + 48, 1640], radius=30, fill=GOLD)
    d.text(((W - w_p) // 2, 1594), pill, font=f_p, fill=INK)
    t = "TRAILS OF LOMPOC"
    d.text(((W - tw(d, t, F(92))) // 2, 1668), t, font=F(92), fill=(255, 255, 255))
    t = "Four walks out of town"
    d.text(((W - tw(d, t, F(38))) // 2, 1790), t, font=F(38), fill=(228, 220, 234))
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
    t = "Maps © Mapbox · © OpenStreetMap · Trail data © OSM contributors"
    d.text(((W - tw(d, t, F(26))) // 2, 1560), t, font=F(26), fill=(130, 118, 140))
    im.save("c_end.png")

    shots = [
        ("cover", 0.0, 4.55),
        ("bodger", 4.55, 12.00),
        ("purisima", 12.00, 18.85),
        ("burton", 18.85, 23.78),
        ("ocean", 23.78, 32.40),
        ("end", 32.40, dur + 1.4),
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
            draw_stats_anim(im, tr, fi, draw_f + 4)
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
    (4.8, 11.7, "Bodger Trail · the valley at your feet"),
    (12.3, 18.5, "La Purísima · 25 miles of trails"),
    (19.1, 23.4, "Burton Mesa · rare chaparral country"),
    (24.2, 32.0, "Ocean Beach · where the walk ends at the sea"),
    (32.7, 39.9, "Every trail · every park · all in one place — lompoclocals.com"),
]

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); sec = t % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

ev = CAPS

with open("caps.ass", "w") as f:
    f.write("[Script Info]\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour,"
            " Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
            "Style: cap,Montserrat,44,&H00FFFFFF,&H00000000,&H80000000,-1,3,1,2,60,60,74\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Text\n")
    for t0, t1, txt in ev:
        f.write(f"Dialogue: 0,{ts(t0)},{ts(t1)},cap,{{\\fad(120,80)}}{txt}\n")

total = shots[-1][2] + 1 / FPS
sh(f"ffmpeg -y -loglevel error -f concat -safe 0 -i concat.txt -i narration.mp3 "
   f"-filter_complex \"[0:v]null,"
   f"fade=t=out:st={total-0.6:.3f}:d=0.6[v];[1:a]highpass=f=60,loudnorm=I=-14:TP=-1.5:LRA=11,apad,afade=t=out:st={total-0.6:.3f}:d=0.6[a]\" "
   f"-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 19 "
   f"-c:a aac -b:a 192k -t {total:.3f} -movflags +faststart final.mp4")
info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 final.mp4",
                      shell=True, capture_output=True, text=True).stdout
print("FINAL_OK", info.strip())
