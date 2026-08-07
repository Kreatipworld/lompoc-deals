#!/usr/bin/env python3
"""J's Glass Co — New Member welcome film. Their real photos + brand cards.
Member style: purple. Phases: prep|segs a b|final. Poster = designed cover."""
from PIL import Image, ImageDraw, ImageFont
import json, os, subprocess, sys

W, H, FPS = 1080, 1920, 30
PURPLE = (101, 12, 117)
DEEP = (58, 8, 68)
GOLD = (239, 198, 24)
FONT = "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf"

NARR = "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_160636_3425c009-74f5-4fda-8db7-ddc4867b529c.mp3"
B = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com"
ASSETS = {
    "narration.mp3": NARR,
    "c_title.png": "https://d2ol7oe51mr4n9.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/3b8236bc-faea-4946-a089-9ebbf7f4c2be.jpg",
    "mark.png": "https://www.lompoclocals.com/brand/lompoc-locals-mark-white.png",
    "jg1.jpg": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_153413_b1a9e52d-e370-413b-81ab-9b35082e847b.png",
    "jg3.jpg": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_153413_716f9097-90d2-4342-9770-77c5b82da3b7.png",
    "jg5.jpg": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_150725_d77671c2-8b92-49b4-ac23-f641a5b2a0cd.png",
    "jg7.jpg": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_153413_a28effc4-9749-4dc6-963c-a4b8f5dc3ce5.png",
    "jglogo.jpg": B + "/businesses/js-glass-co/logo-ynWESxKiuOCTPaScp2BWJPLJzoaIJO.jpg",
    "jg8.jpg": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_152025_19b8ea3a-17da-4fd5-867e-1aabe8e1ca44.png",
}

def sh(cmd):
    r = subprocess.run(cmd, shell=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {cmd[:100]}")

def F(size):
    return ImageFont.truetype(FONT, size)

def tw(d, t, f):
    b = d.textbbox((0, 0), t, font=f)
    return b[2] - b[0]

PHASE = sys.argv[1] if len(sys.argv) > 1 else "prep"

if PHASE == "prep":
    for name, url in ASSETS.items():
        sh(f"curl -sfL -A 'LompocLocals/1.0' -o '{name}' '{url}'")
    print("ASSETS_OK")

    from faster_whisper import WhisperModel
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segs, _ = model.transcribe("narration.mp3", word_timestamps=True)
    toks = []
    for s in segs:
        for wd in s.words:
            toks.append((wd.word.strip().lower().strip(".,!?—:;'\""), wd.start, wd.end))
    json.dump(toks, open("words.json", "w"))
    dur = float(subprocess.run("ffprobe -v error -show_entries format=duration -of csv=p=0 narration.mp3",
                               shell=True, capture_output=True, text=True).stdout.strip())
    print("TOKENS", len(toks), "DUR", dur)

    def find(word, frac, after=0.0):
        for t, a, b in toks:
            if a >= after and word in t:
                return b
        return frac * dur

    a_members = find("members", 0.13)
    a_install = find("installations", 0.34, a_members)
    a_enclos  = find("enclosures", 0.47, a_install)
    a_doors   = find("doors", 0.57, a_enclos)
    a_house   = find("house", 0.63, a_doors)
    a_business= find("business", 0.70, a_house)
    a_aboard  = find("aboard", 0.92, a_business)

    mark = Image.open("mark.png").convert("RGBA")
    mw = 210
    mark = mark.resize((mw, int(mark.height * mw / mark.width)), Image.LANCZOS)

    # labels for photos
    LABELS = {
        "jg3.jpg": "REPAIRS & NEW INSTALLATIONS",
        "jg5.jpg": "SHOWER ENCLOSURES",
        "jg1.jpg": "WINDOWS & DOORS",
        "jg7.jpg": "DUAL GLASS WINDOWS",
        "jg8.jpg": "FOR YOUR HOUSE & YOUR BUSINESS",
    }
    for img, label in LABELS.items():
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d2 = ImageDraw.Draw(ov)
        f_l = F(40)
        w_l = tw(d2, label, f_l)
        pad = 28
        x0 = (W - w_l) // 2 - pad
        d2.rounded_rectangle([x0, 200, x0 + w_l + 2 * pad, 282], radius=16, fill=DEEP + (205,))
        d2.text(((W - w_l) // 2, 219), label, font=f_l, fill=(255, 255, 255, 255))
        d2.rounded_rectangle([(W - 110) // 2, 296, (W + 110) // 2, 306], radius=5, fill=GOLD + (255,))
        ov.save("lbl_" + img.replace(".jpg", "") + ".png")

    def base_card():
        im = Image.new("RGB", (W, H), PURPLE)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, W, 14], fill=GOLD)
        d.rectangle([0, H - 14, W, H], fill=GOLD)
        return im, d

    def center(d, txt, f, y, fill):
        d.text(((W - tw(d, txt, f)) // 2, y), txt, font=f, fill=fill)

    im, d = base_card()
    im.paste(mark, ((W - mark.width) // 2, 560), mark)
    center(d, "FIND THEM ON", F(60), 950, (255, 255, 255))
    center(d, "LOMPOCLOCALS.COM", F(76), 1050, GOLD)
    im.save("c_find.png")

    # his logo in a white ring badge, star of the end card
    logo = Image.open("jglogo.jpg").convert("RGBA").resize((260, 260), Image.LANCZOS)
    lmask = Image.new("L", (260, 260), 0)
    ImageDraw.Draw(lmask).ellipse([0, 0, 260, 260], fill=255)
    badge = Image.new("RGBA", (292, 292), (0, 0, 0, 0))
    ImageDraw.Draw(badge).ellipse([0, 0, 292, 292], fill=(255, 255, 255, 255))
    badge.paste(logo, (16, 16), lmask)

    im, d = base_card()
    im.paste(badge, ((W - 292) // 2, 400), badge)
    center(d, "WELCOME", F(120), 800, GOLD)
    center(d, "ABOARD", F(120), 950, GOLD)
    center(d, "J'S GLASS CO", F(64), 1150, (255, 255, 255))
    center(d, "LOMPOC LOCALS", F(40), 1480, (200, 182, 208))
    center(d, "lompoclocals.com", F(50), 1560, GOLD)
    im.save("c_end.png")
    print("CARDS_OK")

    shots = [
        ("c_title.png", 0.0, a_members + 0.3),
        ("jg3.jpg", a_members + 0.3, a_install + 0.4),
        ("jg5.jpg", a_install + 0.4, a_enclos + 0.45),
        ("jg1.jpg", a_enclos + 0.45, a_doors + 0.4),
        ("jg7.jpg", a_doors + 0.4, a_house + 0.4),
        ("jg8.jpg", a_house + 0.4, a_business + 0.5),
        ("c_find.png", a_business + 0.5, a_aboard + 0.2),
        ("c_end.png", a_aboard + 0.2, dur + 0.6),
    ]
    shots = [(img, round(t0, 3), round(max(t1, t0 + 0.4), 3)) for img, t0, t1 in shots]
    json.dump({"shots": shots, "dur": dur}, open("shots.json", "w"))
    print("SHOTS", json.dumps(shots))
    print("PREP_DONE")
    sys.exit(0)

plan = json.load(open("shots.json"))
shots, dur = plan["shots"], plan["dur"]

if PHASE == "segs":
    a, b = int(sys.argv[2]), int(sys.argv[3])
    for i, (img, t0, t1) in enumerate(shots):
        if i < a or i > b:
            continue
        out = f"seg{i:02d}.mp4"
        if os.path.exists(out):
            print("SEG", i, "cached"); continue
        d_s = t1 - t0
        frames = max(int(round(d_s * FPS)), 6)
        z = (f"zoom='min(1+0.06*on/{frames},1.06)'" if i % 2 == 0
             else f"zoom='max(1.06-0.06*on/{frames},1.0)'")
        fdur = 0.18 if d_s >= 0.9 else 0.08
        if img.endswith(".png"):
            vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
        else:
            vf = (f"scale={int(W*1.5)}:{int(H*1.5)}:force_original_aspect_ratio=increase,"
                  f"crop={int(W*1.5)}:{int(H*1.5)},"
                  f"zoompan={z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                  f"d={frames}:s={W}x{H}:fps={FPS}")
        fades = f",fade=t=out:st={max(0.0, d_s - fdur):.3f}:d={fdur}"
        if i == 0:
            fades = f",fade=t=in:d=0.35" + fades
        lbl = "lbl_" + img.replace(".jpg", "") + ".png"
        if img.endswith(".jpg") and os.path.exists(lbl):
            fin = f"format=rgba,fade=t=in:st=0.25:d=0.35:alpha=1"
            if d_s >= 1.6:
                fin += f",fade=t=out:st={d_s - 0.35:.3f}:d=0.35:alpha=1"
            sh(f"ffmpeg -y -loglevel error -loop 1 -i '{img}' -loop 1 -i '{lbl}' "
               f"-filter_complex \"[0:v]{vf}[bg];[1:v]{fin}[ov];"
               f"[bg][ov]overlay=x=0:y='24*(1-min(1,max(0,(t-0.25)/0.35)))'{fades}\" "
               f"-frames:v {frames} -pix_fmt yuv420p -r {FPS} -preset veryfast {out}")
        else:
            sh(f"ffmpeg -y -loglevel error -loop 1 -i '{img}' -vf \"{vf}{fades}\" "
               f"-frames:v {frames} -pix_fmt yuv420p -r {FPS} -preset veryfast {out}")
        print("SEG", i, out, round(d_s, 2))
    print("SEGS_DONE")
    sys.exit(0)

# ---------- final ----------
sh(f"ffmpeg -y -loglevel error -loop 1 -i c_title.png -frames:v 1 "
   f"-vf scale={W}:{H} -pix_fmt yuv420p -r {FPS} seg_poster.mp4")
segf = ["seg_poster.mp4"] + [f"seg{i:02d}.mp4" for i in range(len(shots))]
missing = [s for s in segf if not os.path.exists(s)]
if missing:
    sys.exit(f"MISSING {missing}")
with open("concat.txt", "w") as f:
    for s in segf:
        f.write(f"file '{s}'\n")

toks = [tuple(t) for t in json.load(open("words.json"))]
DISPLAY = ("Lompoc, meet one of our newest members. J's Glass Co — on West Ocean "
           "Avenue. Residential and commercial glass: repairs, new installations, "
           "storefronts... even the arched windows of a historic Lompoc hall. Find "
           "their page — photos, hours, and the map — on lompoclocals.com. Welcome "
           "aboard, J's Glass Co.")
dwords = DISPLAY.split()
n = min(len(dwords), len(toks))

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

ev = []
i = 0
while i < n:
    j = min(i + 4, n)
    ev.append((toks[i][1], toks[j - 1][2] + 0.05, " ".join(dwords[i:j])))
    i = j

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
   f"-filter_complex \"[0:v]"
   f"fade=t=out:st={total-0.6:.3f}:d=0.6[v];[1:a]apad,afade=t=out:st={total-0.6:.3f}:d=0.6[a]\" "
   f"-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 19 "
   f"-c:a aac -b:a 192k -t {total:.3f} -movflags +faststart final.mp4")
info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 final.mp4",
                      shell=True, capture_output=True, text=True).stdout
print("FINAL_OK", info.strip())
