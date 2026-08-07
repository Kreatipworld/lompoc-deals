#!/usr/bin/env python3
"""La Purisima recap — knowledge documentary. PD/CC photos + era cards + captions.
No CTA, no music: narration only. Poster = hero photo with title. Phases: prep|segs a b|final."""
from PIL import Image, ImageDraw, ImageFont
import json, os, subprocess, sys

W, H, FPS = 1080, 1920, 30
INK = (36, 22, 41)
GOLD = (239, 198, 24)
CREAM = (247, 243, 233)
FONT = "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf"

NARR = "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260806_034433_6c179cda-7cc4-4bfb-a50a-836017811bcc.mp3"
WM = "https://upload.wikimedia.org/wikipedia/commons"
ASSETS = {
    "narration.mp3": NARR,
    "pm1.jpg": WM + "/thumb/a/a3/La_Purisima_Mission_-_Lompoc%2C_CA.jpg/1920px-La_Purisima_Mission_-_Lompoc%2C_CA.jpg",
    "pm2.jpg": WM + "/3/34/La_Purisima_Mission_153.jpg",
    "pm3.jpg": WM + "/3/35/La_Purisima_Mission_166.jpg",
    "pm4.jpg": WM + "/6/68/La_Purisima_Mission_176.jpg",
    "pm5.jpg": WM + "/0/0e/La_Purisima_Mission_181.jpg",
    "pm6.jpg": WM + "/thumb/a/a9/Side_view_of_La_Purisima_Mission.jpg/1920px-Side_view_of_La_Purisima_Mission.jpg",
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

    a_all     = find("all", 0.18)
    a_lompoc  = find("lompoc", 0.26, a_all)
    a_destroy = find("destroyed", 0.36, a_lompoc)
    a_north   = find("north", 0.43, a_destroy)
    a_century = find("century", 0.55, a_north)
    a_build   = find("building", 0.66, a_century)
    a_1820b   = find("1820", 0.74, a_build)
    a_crops   = find("crops", 0.82, a_build)
    a_capsule = find("capsule", 0.90, a_crops)

    # ---------- cards ----------
    def era_card(fname, year, sub):
        im = Image.new("RGB", (W, H), CREAM)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, W, 12], fill=GOLD)
        d.rectangle([0, H - 12, W, H], fill=GOLD)
        f_year = F(260)
        d.text(((W - tw(d, year, f_year)) // 2, 700), year, font=f_year, fill=INK)
        bar_w = 160
        d.rounded_rectangle([(W - bar_w) // 2, 1020, (W + bar_w) // 2, 1034], radius=7, fill=GOLD)
        f_sub = F(54)
        d.text(((W - tw(d, sub, f_sub)) // 2, 1080), sub, font=f_sub, fill=(90, 74, 96))
        im.save(fname)

    LABELS = {
        "pm1.jpg": "THE MISSION CHURCH",
        "pm2.jpg": "THE 1820 COMPOUND",
        "pm5.jpg": "ADOBE QUARTERS",
        "pm4.jpg": "FURNISHED AS IT WAS IN 1820",
        "pm3.jpg": "THE COLONNADE & HORNO OVEN",
        "pm6.jpg": "THE RESTORED CORRIDOR",
    }
    for img, label in LABELS.items():
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d2 = ImageDraw.Draw(ov)
        f_l = F(40)
        w_l = tw(d2, label, f_l)
        pad = 28
        x0 = (W - w_l) // 2 - pad
        d2.rounded_rectangle([x0, 200, x0 + w_l + 2 * pad, 282], radius=16,
                             fill=(36, 22, 41, 200))
        d2.text(((W - w_l) // 2, 219), label, font=f_l, fill=(255, 255, 255, 255))
        d2.rounded_rectangle([(W - 110) // 2, 296, (W + 110) // 2, 306], radius=5,
                             fill=GOLD + (255,))
        ov.save("lbl_" + img.replace(".jpg", "") + ".png")
    json.dump(list(LABELS.keys()), open("labels.json", "w"))

    era_card("c_1787.png", "1787", "THE ELEVENTH MISSION")
    era_card("c_1812.png", "1812", "EARTHQUAKE & FLOOD")
    era_card("c_1930.png", "1930s", "REBUILT BY THE CCC")

    # approved designed cover (Town Guides Nº 1) — single source of truth
    sh("curl -sfL -o c_title.png 'https://d2ol7oe51mr4n9.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/43fcda3a-660a-4d24-bd13-02e917c38372.jpg'")

    # end card: quiet credit, no CTA
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 12], fill=GOLD)
    d.rectangle([0, H - 12, W, H], fill=GOLD)
    t = "LA PURÍSIMA MISSION"
    d.text(((W - tw(d, t, F(78))) // 2, 830), t, font=F(78), fill=(255, 255, 255))
    t = "Lompoc, California"
    d.text(((W - tw(d, t, F(50))) // 2, 950), t, font=F(50), fill=GOLD)
    t = "From the Lompoc Locals town guides"
    d.text(((W - tw(d, t, F(34))) // 2, 1500), t, font=F(34), fill=(170, 158, 178))
    t = "Photos: Jsweida · Elisa.rolle · Red3two (CC BY-SA)"
    d.text(((W - tw(d, t, F(26))) // 2, 1560), t, font=F(26), fill=(130, 118, 140))
    im.save("c_end.png")
    print("CARDS_OK")

    shots = [
        ("c_title.png", 0.0, a_all * 0.45),
        ("pm1.jpg", a_all * 0.45, a_all + 0.4),
        ("c_1787.png", a_all + 0.4, a_lompoc + 0.5),
        ("c_1812.png", a_lompoc + 0.5, a_destroy + 0.6),
        ("pm2.jpg", a_destroy + 0.6, a_north + 0.6),
        ("pm5.jpg", a_north + 0.6, a_century + 0.5),
        ("c_1930.png", a_century + 0.5, a_build + 0.4),
        ("pm4.jpg", a_build + 0.4, a_crops + 0.5),
        ("pm3.jpg", a_crops + 0.5, a_capsule + 0.4),
        ("pm6.jpg", a_capsule + 0.4, a_capsule + 2.6),
        ("c_end.png", a_capsule + 2.6, dur + 0.6),
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
            # cards hold perfectly still — drift on typography reads as cheap
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
            # label rides the photo: rises + fades in, holds, fades before the cut
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
DISPLAY = ("Eleven of twenty-one. La Purísima Concepción, founded in 1787, was the "
           "eleventh of California's Spanish missions — and today, it's the most "
           "completely restored of them all. The first mission stood in what's now "
           "downtown Lompoc. In December 1812, an earthquake — and the floods that "
           "followed — destroyed it. Rebuilt four miles north and finished by 1820, "
           "the mission was abandoned after 1834... and crumbled for a century. Until "
           "the 1930s, when the Civilian Conservation Corps brought it back, building "
           "by building. Today, every room is furnished as it was in 1820. The gardens "
           "grow mission-era crops. It's not a ruin — it's a time capsule. La Purísima "
           "Mission. In Lompoc, California.")
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
   f"-filter_complex \"[0:v]subtitles=caps.ass:fontsdir=/usr/share/fonts,"
   f"fade=t=out:st={total-0.6:.3f}:d=0.6[v];[1:a]apad,afade=t=out:st={total-0.6:.3f}:d=0.6[a]\" "
   f"-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 19 "
   f"-c:a aac -b:a 192k -t {total:.3f} -movflags +faststart final.mp4")
info = subprocess.run("ffprobe -v error -show_entries format=duration,size -of csv=p=0 final.mp4",
                      shell=True, capture_output=True, text=True).stdout
print("FINAL_OK", info.strip())
