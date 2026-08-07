#!/usr/bin/env python3
"""100-followers animated announcement — 1080x1920, 8s, count-up + music."""
from PIL import Image, ImageDraw, ImageFont
import math, os, subprocess, sys

W, H = 1080, 1920
FPS = 30
DUR = 8.0
N = int(DUR * FPS)
PURPLE = (101, 12, 117)
GOLD = (239, 198, 24)
FONT = "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf"
CY = H // 2

MUSIC = "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260804_165132_2eeb871b-4c33-481d-bfee-549cc733f549.m4a"
MARK = "https://www.lompoclocals.com/brand/lompoc-locals-mark-white.png"


def sh(cmd):
    r = subprocess.run(cmd, shell=True)
    if r.returncode != 0:
        sys.exit(1)


def F(size):
    return ImageFont.truetype(FONT, size)


def tw(d, t, f):
    b = d.textbbox((0, 0), t, font=f)
    return b[2] - b[0]


def ease_out(p):
    return 1 - (1 - p) ** 3


def phase(t, t0, d):
    """0..1 progress of a phase starting at t0 lasting d, clamped."""
    return max(0.0, min(1.0, (t - t0) / d))


sh(f"curl -sf -o music.m4a '{MUSIC}'")
have_mark = subprocess.run(f"curl -sf -o mark.png '{MARK}'", shell=True).returncode == 0
mark = None
if have_mark:
    m = Image.open("mark.png").convert("RGBA")
    mw = 190
    mark = m.resize((mw, int(m.height * mw / m.width)), Image.LANCZOS)

os.makedirs("frames", exist_ok=True)
f_kick, f_sub, f_th, f_url = F(46), F(82), F(52), F(44)

for i in range(N):
    # Frame 0 is the POSTER: render the fully-composed end state so the grid
    # cover is never a blank tile. The animation proper starts at frame 1.
    t = 6.0 if i == 0 else i / FPS
    im = Image.new("RGB", (W, H), PURPLE)
    d = ImageDraw.Draw(im)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    do = ImageDraw.Draw(ov)

    # gold frame bars wipe in from center
    p = ease_out(phase(t, 0.0, 0.7))
    half = int((W // 2) * p)
    if half > 0:
        d.rectangle([W // 2 - half, 0, W // 2 + half, 16], fill=GOLD)
        d.rectangle([W // 2 - half, H - 16, W // 2 + half, H], fill=GOLD)

    # logo mark fades in
    if mark is not None:
        p = ease_out(phase(t, 0.2, 0.6))
        if p > 0:
            mm = mark.copy()
            a = mm.getchannel("A").point(lambda v: int(v * p))
            mm.putalpha(a)
            ov.paste(mm, ((W - mark.width) // 2, CY - 640 + int(20 * (1 - p))), mm)

    # kicker
    p = ease_out(phase(t, 0.6, 0.5))
    if p > 0:
        txt = "OUR TIKTOK JUST HIT"
        do.text(((W - tw(do, txt, f_kick)) // 2, CY - 380 + int(30 * (1 - p))),
                txt, font=f_kick, fill=(255, 255, 255, int(255 * p)))
        bw = int(150 * p)
        if bw > 2:
            do.rounded_rectangle([(W - bw) // 2, CY - 310, (W + bw) // 2, CY - 296],
                                 radius=7, fill=GOLD + (int(255 * p),))

    # count-up number with settle pop
    p = phase(t, 1.1, 2.0)
    if p > 0:
        val = int(round(100 * ease_out(p)))
        scale = 1.0
        if p >= 1.0:
            s = phase(t, 3.1, 0.35)
            scale = 1.0 + 0.06 * math.sin(math.pi * s) if s < 1.0 else 1.0
        f_num = F(int(440 * scale))
        txt = str(val)
        do.text(((W - tw(do, txt, f_num)) // 2, CY - 300 - int((f_num.size - 440) * 0.45)),
                txt, font=f_num, fill=GOLD + (255,))

    # FOLLOWERS
    p = ease_out(phase(t, 3.3, 0.5))
    if p > 0:
        txt = "FOLLOWERS"
        do.text(((W - tw(do, txt, f_sub)) // 2, CY + 210 + int(40 * (1 - p))),
                txt, font=f_sub, fill=(255, 255, 255, int(255 * p)))

    # THANK YOU
    p = ease_out(phase(t, 3.9, 0.5))
    if p > 0:
        txt = "THANK YOU, LOMPOC"
        do.text(((W - tw(do, txt, f_th)) // 2, CY + 340 + int(40 * (1 - p))),
                txt, font=f_th, fill=GOLD + (int(255 * p),))

    # URL
    p = ease_out(phase(t, 4.5, 0.5))
    if p > 0:
        txt = "lompoclocals.com"
        do.text(((W - tw(do, txt, f_url)) // 2, H - 120), txt, font=f_url,
                fill=(255, 255, 255, int(255 * p)))

    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    im.save(f"frames/f{i:04d}.jpg", quality=90)

print("FRAMES_OK", N)

sh(f"ffmpeg -y -loglevel error -framerate {FPS} -i frames/f%04d.jpg "
   f"-i music.m4a -filter_complex "
   f"\"[0:v]fade=t=out:st={DUR-0.4}:d=0.4,format=yuv420p[v];"
   f"[1:a]volume=0.3,afade=t=in:d=0.5,afade=t=out:st={DUR-0.8}:d=0.8[a]\" "
   f"-map '[v]' -map '[a]' -t {DUR} -c:v libx264 -preset veryfast -crf 19 "
   f"-c:a aac -b:a 160k -movflags +faststart milestone.mp4")
info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 milestone.mp4",
                      shell=True, capture_output=True, text=True).stdout
print("ANIM_OK", info.strip())
