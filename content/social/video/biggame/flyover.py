#!/usr/bin/env python3
"""Big Game flyover — two satellite clips (Mapbox static, satellite-streets-v12).
fly-dive.mp4: valley -> Huyck Stadium (Lompoc High). fly-transfer.mp4: Huyck -> Cabrillo High field.
Run: asr/bin/python flyover.py   (needs NEXT_PUBLIC_MAPBOX_TOKEN in repo .env.local; ffmpeg on PATH)
Attribution required wherever these appear: © Mapbox © OpenStreetMap © Maxar
"""
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import math, os, subprocess, sys
W, H, FPS, SRC = 1080, 1920, 30, 2560
STYLE = "satellite-v9"   # label-free imagery; streets style crawled POI labels across the open
HUYCK = (34.6493, -120.4617)   # Huyck Stadium field (not the school address)
CABRILLO = (34.7119, -120.4767)   # Cabrillo High field/track (not the campus centre)
VALLEY = ((HUYCK[0] + CABRILLO[0]) / 2 - 0.006, (HUYCK[1] + CABRILLO[1]) / 2 + 0.01)
GOLD = (239, 198, 24)
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".flycache"); os.makedirs(CACHE, exist_ok=True)

def token():
    for line in open("/Users/kreatip/Projects/lompoc-deals/.env.local"):
        if line.startswith("NEXT_PUBLIC_MAPBOX_TOKEN"):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("no mapbox token")

def merc(lat, lon, z):
    n = 512 * (2 ** z); x = n * (lon + 180) / 360
    la = math.radians(lat); y = n * (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2
    return x, y
def smooth(p): return p * p * (3 - 2 * p)
def ease_out(p): return 1 - (1 - p) ** 3

def fetch(name, lat, lon, z):
    out = os.path.join(CACHE, f"{name}.png")
    if not os.path.exists(out):
        url = (f"https://api.mapbox.com/styles/v1/mapbox/{STYLE}/static/{lon:.5f},{lat:.5f},{z:.2f},0/1280x1280@2x"
               f"?access_token={token()}&logo=false&attribution=false")
        r = subprocess.run(["curl", "-sfL", "--retry", "3", "--max-time", "60", "-o", out, url])
        if r.returncode != 0: sys.exit("fetch failed " + name)
    return {"img": Image.open(out).convert("RGB"), "lat": lat, "lon": lon, "z": z}

def view(keys, lat, lon, z):
    """Crop a 1080x1920 view at (lat,lon,z) from the best keyframe (highest zoom <= z that contains the window)."""
    best = None
    for k in keys:
        if k["z"] > z + 1e-6: continue
        f = 2 ** (z - k["z"]); cw, ch = W / f, H / f
        tx, ty = merc(lat, lon, k["z"]); cx, cy = merc(k["lat"], k["lon"], k["z"])
        px, py = SRC / 2 + 2 * (tx - cx), SRC / 2 + 2 * (ty - cy)
        x0, y0 = px - cw / 2, py - ch / 2
        if x0 < 0 or y0 < 0 or x0 + cw > SRC or y0 + ch > SRC: continue
        if best is None or k["z"] > best[0]["z"]: best = (k, (x0, y0, x0 + cw, y0 + ch), px, py, f)
    if best is None: sys.exit(f"no keyframe covers lat={lat} lon={lon} z={z}")
    k, box, px, py, f = best
    im = k["img"].crop(tuple(int(round(v)) for v in box)).resize((W, H), Image.LANCZOS)
    return im, k, f

def to_screen(k, f, lat, lon, vlat, vlon, z):
    """Screen px of (lat,lon) in a view centred on (vlat,vlon) at zoom z."""
    tx, ty = merc(lat, lon, z); vx, vy = merc(vlat, vlon, z)
    return W / 2 + 2 * (tx - vx), H / 2 + 2 * (ty - vy)

def grade(im):
    im = ImageEnhance.Contrast(im).enhance(1.10); im = ImageEnhance.Color(im).enhance(1.12)
    vig = Image.new("L", (W, H), 0); d = ImageDraw.Draw(vig)
    d.ellipse([-W * 0.25, -H * 0.15, W * 1.25, H * 1.15], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(220))
    dark = Image.new("RGB", (W, H), (10, 6, 12))
    return Image.composite(im, dark, vig.point(lambda v: 90 + int(v * 165 / 255)))

def pin(im, x, y, p):
    """Pulsing gold pin; p in 0..1 = landing progress."""
    if p <= 0: return im
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    a = int(255 * min(1.0, p / 0.3))
    r = 18 + 30 * (1 - ease_out(min(1.0, p)))
    ring = 26 + 60 * ((p * 1.6) % 1.0)
    d.ellipse([x - ring, y - ring, x + ring, y + ring], outline=(*GOLD, int(a * (1 - ((p * 1.6) % 1.0)))), width=5)
    d.ellipse([x - r, y - r, x + r, y + r], fill=(*GOLD, a), outline=(20, 12, 24, a), width=4)
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")

def write(frames_dir, out, n):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{frames_dir}/%05d.jpg",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], check=True)
    print("wrote", out, n, "frames")

def clip_dive(out, dur=5.0):
    keys = []
    zs = [11.5, 12.2, 12.9, 13.6, 14.3, 15.0, 15.7, 16.4]
    for i, z in enumerate(zs):
        p = (z - 11.5) / (16.5 - 11.5)
        lat = VALLEY[0] + (HUYCK[0] - VALLEY[0]) * p; lon = VALLEY[1] + (HUYCK[1] - VALLEY[1]) * p
        keys.append(fetch(f"dive{i}", lat, lon, z))
    n = int(dur * FPS); fd = os.path.join(CACHE, "fr_dive"); os.makedirs(fd, exist_ok=True)
    for i in range(n):
        u = i / (n - 1); p = 0.55 * smooth(u) + 0.45 * u   # keeps the dive moving through the back half
        z = 11.5 + (16.5 - 11.5) * p
        lat = VALLEY[0] + (HUYCK[0] - VALLEY[0]) * p; lon = VALLEY[1] + (HUYCK[1] - VALLEY[1]) * p
        im, k, f = view(keys, lat, lon, z)
        im = grade(im)
        t = i / FPS; land = (t - (dur - 0.7)) / 0.7   # pin lands in the last 0.7s (~6.3–7.0 on the 7s dive)
        if land > 0:
            x, y = to_screen(k, f, *HUYCK, lat, lon, z); im = pin(im, x, y, land)
        im.save(f"{fd}/{i:05d}.jpg", quality=92)
    write(fd, out, n)

def clip_transfer(out, dur=4.0):
    def path(p):
        q = smooth(p)
        lat = HUYCK[0] + (CABRILLO[0] - HUYCK[0]) * q; lon = HUYCK[1] + (CABRILLO[1] - HUYCK[1]) * q
        z = 16.5 + (16.2 - 16.5) * p - 2.7 * math.sin(math.pi * p)
        return lat, lon, z
    keys = []
    for i in range(13):
        lat, lon, z = path(i / 12); keys.append(fetch(f"tr{i}", lat, lon, max(11.0, z - 0.45)))
    keys.append(fetch("tr_cab", *CABRILLO, 16.2)); keys.append(fetch("tr_huy", *HUYCK, 16.5))
    n = int(dur * FPS); fd = os.path.join(CACHE, "fr_tr"); os.makedirs(fd, exist_ok=True)
    for i in range(n):
        p = i / (n - 1); lat, lon, z = path(p)
        im, k, f = view(keys, lat, lon, z); im = grade(im)
        t = i / FPS
        lift = min(1.0, t / 0.6)
        if lift < 1.0:
            x, y = to_screen(k, f, *HUYCK, lat, lon, z); im = pin(im, x, y, 1.0 - lift + 0.01)
        land = (t - (dur - 1.2)) / 1.2
        if land > 0:
            x, y = to_screen(k, f, *CABRILLO, lat, lon, z); im = pin(im, x, y, land)
        im.save(f"{fd}/{i:05d}.jpg", quality=92)
    write(fd, out, n)

if __name__ == "__main__":
    pub = os.path.join(HERE, "public")
    clip_dive(os.path.join(pub, "fly-dive.mp4"), dur=7.5)
    clip_transfer(os.path.join(pub, "fly-transfer.mp4"), dur=2.3)
