#!/usr/bin/env python3
"""Taco Route Tuesday — real-photo 9:16 commercial builder.
Runs in the Higgsfield sandbox in PHASES (each under the 120s foreground cap):
  python3 build.py prep          -> download assets, whisper timings, cards, shots.json
  python3 build.py segs <a> <b>  -> render segment indices a..b inclusive (skips existing)
  python3 build.py final         -> concat + subtitles + audio mix -> final.mp4
Idempotent: cached words.json / existing files are reused after a sandbox reset."""
import json, os, re, subprocess, sys, glob
from PIL import Image, ImageDraw, ImageFont, ImageOps

PHASE = sys.argv[1] if len(sys.argv) > 1 else "prep"

W, H, FPS = 1080, 1920, 30
GOLD = "#EFC618"; PURPLE = "#650C75"; CREAM = "#F7F1E1"; INK = "#1a1a1a"
BLOB = "https://hdmjeo8b19ivdmlw.public.blob.vercel-storage.com"

ASSETS = {
  "narration.wav": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260804_194133_0410d44d-36dd-4aa1-b764-98fc1282da6a.mp3",
  "music.m4a": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260804_165132_2eeb871b-4c33-481d-bfee-549cc733f549.m4a",
  "map.png": "https://d8j0ntlcm91z4.cloudfront.net/user_3CuWntmy2lNmJohSFZzzxO6qy1E/hf_20260804_155309_3339bd09-828e-422b-8b1a-2b12fafb9718.png",
  "logo.png": "https://www.lompoclocals.com/partner-images/brand.png",
  "hook.img":    BLOB + "/biz-photos/mr-taco-lompoc/6c9f412bc5.jpg",
  "asada.img":   BLOB + "/photos/1776641339088-hj6ojp.jpeg",
  "pastor.img":  BLOB + "/photos/1776641338219-1kzz4g.jpeg",
  "birria.img":  BLOB + "/biz-photos/tacos-y-mariscos-el-culichi/f6de7878ec.jpg",
  "mariscos.img":BLOB + "/biz-photos/tacos-y-mariscos-el-culichi/ab102a0d14.jpg",
  "mision.img":  BLOB + "/photos/1776641945645-zwcyrr.jpeg",
  "tizon.img":   BLOB + "/covers/1776641336364-jbchzm.jpeg",
  "tacho.img":   BLOB + "/biz-photos/taqueria-don-tacho/da586176e2.jpg",
  "culichi.img": BLOB + "/biz-photos/tacos-y-mariscos-el-culichi/1b2e9e8689.jpg",
  "michoa.img":  BLOB + "/photos/1776641405652-9t2tgl.jpeg",
  "toro.img":    BLOB + "/covers/1776641299228-l6id2p.jpeg",
  "m1.img": BLOB + "/biz-photos/burritos-lalo/b0d8ae65b4.jpg",
  "m2.img": BLOB + "/biz-photos/super-grill/76b869fb5d.jpg",
  "m3.img": BLOB + "/biz-photos/mariscos-el-palmar/4475b7ed94.jpg",
  "m4.img": BLOB + "/biz-photos/florianos-mexican-food/6d2a934b4e.jpg",
}

def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        print("CMD FAILED:", cmd[:300]); print(r.stderr[-2000:]); sys.exit(1)
    return r.stdout

os.makedirs("work", exist_ok=True)
os.chdir("work")
for name, url in ASSETS.items():
    if not os.path.exists(name):
        sh(f"curl -sSL -o '{name}' '{url}'")
print("ASSETS_OK")

def font_path(bold=True):
    for pat in ["*Montserrat*Bold*", "*Montserrat*SemiBold*", "*Metropolis*Bold*",
                "*DejaVuSans-Bold*"]:
        hits = glob.glob(f"/usr/share/fonts/**/{pat}.ttf", recursive=True) + \
               glob.glob(f"/usr/local/share/fonts/**/{pat}.ttf", recursive=True) + \
               glob.glob(f"/usr/share/fonts/**/{pat}.otf", recursive=True)
        if hits: return hits[0]
    return "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT = font_path()
print("FONT", FONT)

# ---------- word alignment (cached) ----------
if os.path.exists("words.json"):
    toks = [tuple(t) for t in json.load(open("words.json"))]
else:
    from faster_whisper import WhisperModel
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segs, _ = model.transcribe("narration.wav", word_timestamps=True)
    raw = [(w.word.strip().lower(), w.start, w.end) for s in segs for w in s.words]
    toks = [(re.sub(r"[^a-z']", "", w), s, e) for w, s, e in raw]
    toks = [t for t in toks if t[0]]
    json.dump(toks, open("words.json", "w"))
print("TOKENS", len(toks))
dur = float(sh("ffprobe -v error -show_entries format=duration -of csv=p=0 narration.wav").strip())

# ---------- align known display script to whisper tokens ----------
import difflib
DISPLAY = ("It's Taco Tuesday, Lompoc — and this town came to play. Carne asada, "
           "al pastor, birria, mariscos — it's all happening tonight. La Mision on "
           "Burton Mesa. El Tizon and Don Tacho on H Street. El Culichi, La "
           "Michoacana, Toro Loco — and that's not even the whole list. One town. "
           "One Tuesday. One legendary taco route. Find every taqueria and every "
           "deal, free, at lompoclocals.com. Your town. Your tacos. Lompoc Locals.")
dwords = [w for w in DISPLAY.split() if re.sub(r"[^a-z']", "", w.lower())]
dnorm = [re.sub(r"[^a-z']", "", w.lower()) for w in dwords]
twords = [t[0] for t in toks]
times = [None] * len(dwords)
sm = difflib.SequenceMatcher(None, dnorm, twords, autojunk=False)
for a, b, size in sm.get_matching_blocks():
    for k in range(size):
        times[a + k] = (toks[b + k][1], toks[b + k][2])
matched = sum(1 for t in times if t)
# interpolate unmatched words between known neighbors
known = [i for i, t in enumerate(times) if t]
if not known: sys.exit("NO ALIGNMENT AT ALL")
for i in range(len(times)):
    if times[i]: continue
    prev = max((k for k in known if k < i), default=None)
    nxt = min((k for k in known if k > i), default=None)
    lo = times[prev][1] if prev is not None else 0.15
    hi = times[nxt][0] if nxt is not None else dur - 0.2
    span_idx = (nxt if nxt is not None else len(times)) - (prev + 1 if prev is not None else 0)
    pos = i - (prev + 1 if prev is not None else 0)
    step = max(hi - lo, 0.05) / max(span_idx, 1)
    times[i] = (lo + pos * step, lo + (pos + 1) * step)
print(f"ALIGNED {matched}/{len(dwords)} exact, rest interpolated")

def widx(word, after=0):
    w = re.sub(r"[^a-z']", "", word.lower())
    for i in range(after, len(dnorm)):
        if w in dnorm[i]: return i
    sys.exit(f"DISPLAY WORD NOT FOUND: {word}")

def wt(word, after=0): return times[widx(word, after)]

play    = wt("play")
asada   = wt("asada")
pastor  = wt("pastor")
birria  = wt("birria")
marisc  = wt("mariscos")
tonight = wt("tonight")
mision  = wt("mision")
mesa    = wt("mesa")
tizon   = wt("tizon")
tacho   = wt("tacho")
street  = wt("street")
culichi = wt("culichi")
michoa  = wt("michoacana")
toro    = wt("toro")
thats   = wt("that's", widx("loco"))
lst     = wt("list")
onetown = wt("one", widx("list"))
route   = wt("route")
findw   = wt("find")
com     = wt("lompoclocals.com")
your    = wt("your", widx("lompoclocals.com"))

# ---------- overlay cards (PIL) ----------
def F(size): return ImageFont.truetype(FONT, size)

def text_w(d, t, f):
    b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

def make_plate(fname, name, street_txt):
    """lower-third: floating rounded panel, centered gold tab, name + street"""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y = 1445
    d.rounded_rectangle([56, y, W - 56, y + 250], radius=30, fill=(12, 10, 16, 205))
    bar_w = 150
    d.rounded_rectangle([(W - bar_w) // 2, y - 9, (W + bar_w) // 2, y + 7],
                        radius=8, fill=GOLD)
    f1, f2 = F(64), F(42)
    while text_w(d, name, f1) > W - 220 and f1.size > 38: f1 = F(f1.size - 4)
    d.text(((W - text_w(d, name, f1)) // 2, y + 52), name, font=f1, fill="white")
    d.text(((W - text_w(d, street_txt, f2)) // 2, y + 152), street_txt, font=f2, fill=GOLD)
    im.save(fname)

make_plate("p_mision.png", "TAQUERIA LA MISION", "1410 Burton Mesa Blvd")
make_plate("p_tizon.png", "TACOS EL TIZON", "1145 N H St")
make_plate("p_tacho.png", "TAQUERIA DON TACHO", "614 N H St")
make_plate("p_culichi.png", "TACOS Y MARISCOS EL CULICHI", "801 W Laurel Ave")
make_plate("p_michoa.png", "TACOS Y MARISCOS LA MICHOACANA", "1009 N A St")
make_plate("p_toro.png", "TORO LOCO", "129 W Central Ave")
for tag, nm in [("m1", "BURRITOS LALO"), ("m2", "SUPER GRILL"),
                ("m3", "MARISCOS EL PALMAR"), ("m4", "FLORIANO'S")]:
    make_plate(f"p_{tag}.png", nm, "Lompoc, CA")

# hook title overlay
im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
f_kick, f_big = F(58), F(148)
t1, t2, t3 = "IT'S", "TACO", "TUESDAY"
d.rectangle([0, 330, W, 344], fill=GOLD)
d.text(((W - text_w(d, t1, f_kick)) // 2, 384), t1, font=f_kick, fill="white",
       stroke_width=6, stroke_fill=INK)
d.text(((W - text_w(d, t2, f_big)) // 2, 452), t2, font=f_big, fill=GOLD,
       stroke_width=10, stroke_fill=INK)
d.text(((W - text_w(d, t3, f_big)) // 2, 610), t3, font=f_big, fill=GOLD,
       stroke_width=10, stroke_fill=INK)
lp = "LOMPOC, CA"
d.text(((W - text_w(d, lp, f_kick)) // 2, 790), lp, font=f_kick, fill="white",
       stroke_width=6, stroke_fill=INK)
d.rectangle([0, 880, W, 894], fill=GOLD)
im.save("p_hook.png")

# CTA card (full frame)
im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
d.rectangle([0, 0, W, 26], fill=GOLD); d.rectangle([0, H - 26, W, H], fill=GOLD)
lines = [("EVERY", PURPLE, 128), ("TAQUERIA.", PURPLE, 128),
         ("EVERY DEAL.", PURPLE, 128), ("FREE.", GOLD, 170)]
y = 430
for t, c, s in lines:
    f = F(s); d.text(((W - text_w(d, t, f)) // 2, y), t, font=f, fill=c); y += s + 40
f = F(72); t = "lompoclocals.com"
d.rectangle([90, 1450, W - 90, 1610], fill=PURPLE)
d.text(((W - text_w(d, t, f)) // 2, 1490), t, font=f, fill="white")
im.save("cta.png")

# end card
im = Image.new("RGB", (W, H), PURPLE); d = ImageDraw.Draw(im)
logo = Image.open("logo.png").convert("RGBA").resize((640, 640), Image.LANCZOS)
im.paste(logo, ((W - 640) // 2, 360), logo)
f = F(84); t = "Your town. Your tacos."
d.text(((W - text_w(d, t, f)) // 2, 1130), t, font=f, fill="white")
f2 = F(64); t2 = "lompoclocals.com"
d.text(((W - text_w(d, t2, f2)) // 2, 1280), t2, font=f2, fill=GOLD)
im.save("end.png")
print("CARDS_OK")

# ---------- shot list ----------
shots = []  # (img, overlay|None, t0, t1)
def add(img, ov, t0, t1): shots.append((img, ov, round(t0, 3), round(max(t1, t0 + 0.4), 3)))

add("hook.img", "p_hook.png", 0.0, play[1] + 0.15)
add("asada.img", None, play[1] + 0.15, pastor[0])
add("pastor.img", None, pastor[0], birria[0])
add("birria.img", None, birria[0], marisc[0])
add("mariscos.img", None, marisc[0], tonight[1] + 0.15)
add("mision.img", "p_mision.png", tonight[1] + 0.15, tizon[0])
add("tizon.img", "p_tizon.png", tizon[0], tacho[0])
add("tacho.img", "p_tacho.png", tacho[0], street[1] + 0.1)
add("culichi.img", "p_culichi.png", street[1] + 0.1, michoa[0])
add("michoa.img", "p_michoa.png", michoa[0], toro[0])
add("toro.img", "p_toro.png", toro[0], thats[0])
mt0, mt1 = thats[0], lst[1] + 0.1
q = (mt1 - mt0) / 4.0
for i, tag in enumerate(["m1", "m2", "m3", "m4"]):
    add(f"{tag}.img", f"p_{tag}.png", mt0 + i * q, mt0 + (i + 1) * q)
add("map.png", None, lst[1] + 0.1, findw[0])
add("cta.png", None, findw[0], your[0])
add("end.png", None, your[0], max(dur, 30.0) + 0.4)
json.dump(shots, open("shots.json", "w"))
print("SHOTS", json.dumps(shots))
if PHASE == "prep":
    print("PREP_DONE"); sys.exit(0)

# ---------- render segments ----------
shots = [tuple(s) for s in json.load(open("shots.json"))]
if PHASE == "segs":
    a, b = int(sys.argv[2]), int(sys.argv[3])
    for i, (img, ov, t0, t1) in enumerate(shots):
        if i < a or i > b: continue
        out = f"seg{i:02d}.mp4"
        if os.path.exists(out):
            print("SEG", i, "cached"); continue
        d_s = t1 - t0
        frames = max(int(round(d_s * FPS)), 6)
        if i % 2 == 0: z = f"zoom='min(1+0.10*on/{frames},1.10)'"
        else:          z = f"zoom='max(1.10-0.10*on/{frames},1.0)'"
        vf = (f"scale={int(W*1.5)}:{int(H*1.5)}:force_original_aspect_ratio=increase,"
              f"crop={int(W*1.5)}:{int(H*1.5)},"
              f"zoompan={z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
              f"d={frames}:s={W}x{H}:fps={FPS}")
        if ov:
            # motion: card fades in while rising 30px; fades out before the cut
            anim = d_s >= 0.8
            fin = "format=rgba"
            if anim:
                fin += ",fade=t=in:st=0.10:d=0.30:alpha=1"
            if d_s >= 1.4:
                fin += f",fade=t=out:st={round(d_s - 0.30, 3)}:d=0.30:alpha=1"
            ypos = "'30*(1-min(1,max(0,(t-0.10)/0.30)))'" if anim else "0"
            cmd = (f"ffmpeg -y -loglevel error -loop 1 -i '{img}' -loop 1 -i '{ov}' "
                   f"-filter_complex \"[0:v]{vf}[bg];[1:v]{fin}[ov];"
                   f"[bg][ov]overlay=x=0:y={ypos}\" "
                   f"-frames:v {frames} -pix_fmt yuv420p -r {FPS} -preset veryfast {out}")
        else:
            xtra = ",fade=t=in:d=0.28" if img in ("cta.png", "end.png") else ""
            cmd = (f"ffmpeg -y -loglevel error -loop 1 -i '{img}' "
                   f"-vf \"{vf}{xtra}\" -frames:v {frames} -pix_fmt yuv420p -r {FPS} -preset veryfast {out}")
        sh(cmd)
        print("SEG", i, out, round(d_s, 2))
    print("SEGS_DONE"); sys.exit(0)

segf = [f"seg{i:02d}.mp4" for i in range(len(shots))]
missing = [s for s in segf if not os.path.exists(s)]
if missing:
    print("MISSING_SEGMENTS", missing); sys.exit(1)
with open("concat.txt", "w") as f:
    for s in segf: f.write(f"file '{s}'\n")

# ---------- subtitles (ASS, chunks of <=4 words) ----------
DISPLAY = ("It's Taco Tuesday, Lompoc — and this town came to play. Carne asada, "
           "al pastor, birria, mariscos — it's all happening tonight. La Mision on "
           "Burton Mesa. El Tizon and Don Tacho on H Street. El Culichi, La "
           "Michoacana, Toro Loco — and that's not even the whole list. One town. "
           "One Tuesday. One legendary taco route. Find every taqueria and every "
           "deal, free, at lompoclocals.com. Your town. Your tacos. Lompoc Locals.")
dwords = DISPLAY.split()
n = min(len(dwords), len(toks))
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"
ev = []
i = 0
while i < n:
    j = min(i + 4, n)
    # don't split right before sentence end
    txt = " ".join(dwords[i:j])
    t0 = toks[i][1]; t1 = toks[j - 1][2] + 0.05
    ev.append((t0, t1, txt)); i = j
if "Montserrat" in FONT: fname_ass = "Montserrat"
elif "Metropolis" in FONT: fname_ass = "Metropolis"
else: fname_ass = "DejaVu Sans"
with open("caps.ass", "w") as f:
    f.write("[Script Info]\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour,"
            " Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
            f"Style: cap,{fname_ass},62,&H00FFFFFF,&H00000000,&H80000000,-1,3,1,2,60,60,560\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Text\n")
    for t0, t1, txt in ev:
        f.write(f"Dialogue: 0,{ts(t0)},{ts(t1)},cap,{{\\fad(120,80)}}{txt}\n")

# ---------- final assembly ----------
total = shots[-1][3]
sh(f"ffmpeg -y -loglevel error -f concat -safe 0 -i concat.txt "
   f"-i narration.wav -stream_loop -1 -i music.m4a "
   f"-filter_complex \""
   f"[0:v]subtitles=caps.ass:fontsdir=/usr/share/fonts,"
   f"fade=t=out:st={round(total - 0.5, 3)}:d=0.5[v];"
   f"[2:a]volume=0.22,afade=t=in:d=0.8,afade=t=out:st={total-2.2}:d=2.2,apad[m];"
   f"[1:a][m]amix=inputs=2:duration=first:normalize=0[a]\" "
   f"-map '[v]' -map '[a]' -c:v libx264 -preset medium -crf 19 "
   f"-c:a aac -b:a 192k -t {total} -movflags +faststart final.mp4")
info = sh("ffprobe -v error -show_entries format=duration,size -of csv=p=0 final.mp4")
print("FINAL_OK", info.strip())
